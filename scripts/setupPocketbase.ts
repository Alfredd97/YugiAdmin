import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const PB_URL = process.env.VITE_PB_URL || 'http://127.0.0.1:8090';
const ADMIN_USER = process.env.VITE_ADMIN_USER || 'admin@localhost.local';
const ADMIN_PASSWORD = process.env.VITE_ADMIN_PASSWORD || '1234567890';

// Admin credentials for PocketBase (needed to create collections)
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || 'admin@example.com';
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || 'admin123456';

const pb = new PocketBase(PB_URL);

const gameFormatOptions = ['TCG', 'OCG'];
const conditionOptions = ['Near Mint', 'Lightly Played', 'Moderately Played', 'Heavily Played', 'Damaged'];
const rarityOptions = ['Common', 'Rare', 'Super Rare', 'Ultra Rare', 'Secret Rare', 'Prismatic Secret Rare'];

async function setupCollections() {
  console.log('🔌 Connecting to PocketBase at', PB_URL);

  try {
    // Authenticate as admin
    await pb.admins.authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD);
    console.log('✅ Authenticated as PocketBase admin');
  } catch (err) {
    console.error('❌ Failed to authenticate as PocketBase admin');
    console.error('   Make sure PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD are set correctly');
    process.exit(1);
  }

  // 1. Create/update collections
  console.log('\n📦 Creating/updating collections...');

  try {
    await createUsersCollection();
    await createOrUpdateInventoryCollection('cards');
    await createOrUpdateInventoryCollection('decks');
    await createOrUpdateInventoryCollection('accessories');
    await createOrUpdateCurrencySettingsCollection();
    console.log('✅ All collections processed successfully');
  } catch (err) {
    console.error('❌ Error processing collections:', err);
    process.exit(1);
  }

  // 2. Create default admin user
  console.log('\n👤 Creating default admin user...');
  try {
    await createDefaultUser();
    console.log('✅ Default admin user created');
  } catch (err: any) {
    if (err?.response?.data?.username?.code === 'validation_not_unique') {
      console.log('ℹ️  Admin user already exists, skipping...');
    } else if (err?.response?.data?.email?.code === 'validation_not_unique') {
      console.log('ℹ️  Email already in use, skipping...');
    } else {
      console.error('❌ Error creating admin user:', err.message || err);
    }
  }

  console.log('\n🎉 Setup complete!');
  console.log(`   You can now log in with: ${ADMIN_USER} / ${ADMIN_PASSWORD}`);
}

async function createUsersCollection() {
  const collectionName = 'users';

  try {
    await pb.collections.getOne(collectionName);
    console.log(`   ℹ️  Collection '${collectionName}' already exists`);
    return;
  } catch {
    // Collection doesn't exist, create it
  }

  await pb.collections.create({
    name: collectionName,
    type: 'auth',
    schema: [
      {
        name: 'username',
        type: 'text',
        required: true,
        unique: true,
        options: {
          min: 3,
          max: 50
        }
      }
    ],
    options: {
      allowEmailAuth: true,
      allowUsernameAuth: true,
      requireEmail: false
    }
  });

  console.log(`   ✅ Created auth collection: ${collectionName}`);
}

const inventorySchemaFields = [
  { name: 'name', type: 'text', required: true, options: { min: 1, max: 255 } },
  { name: 'seller_name', type: 'text', required: true, options: { min: 1, max: 255 } },
  { name: 'game_format', type: 'select', required: true, options: { values: gameFormatOptions, maxSelect: 1 } },
  { name: 'condition', type: 'select', required: true, options: { values: conditionOptions, maxSelect: 1 } },
  { name: 'expansion_code', type: 'text', required: true, options: { min: 1, max: 50 } },
  { name: 'rarity', type: 'select', required: true, options: { values: rarityOptions, maxSelect: 1 } },
  { name: 'quantity', type: 'number', required: true, options: { min: 0 } },
  { name: 'price_usd', type: 'number', required: true, options: { min: 0 } },
  { name: 'price_cup', type: 'number', required: true, options: { min: 0 } }
];

async function createOrUpdateInventoryCollection(name: string) {
  let collection;
  try {
    collection = await pb.collections.getOne(name);
    console.log(`   ℹ️  Collection '${name}' exists - updating schema`);
  } catch {
    // Collection doesn't exist, will create
    collection = null;
  }

  if (collection) {
    // Update existing collection with new fields
    const existingSchema = collection.schema || [];
    const existingFieldNames = existingSchema.map((f: any) => f.name);
    const newFields = inventorySchemaFields.filter(f => !existingFieldNames.includes(f.name));

    if (newFields.length === 0) {
      console.log(`   ℹ️  Collection '${name}' already has all fields`);
      return;
    }

    // Build updated schema
    const updatedSchema = [...existingSchema, ...newFields];
    await pb.collections.update(collection.id, { schema: updatedSchema });
    console.log(`   ✅ Updated collection '${name}' - added ${newFields.length} new fields`);
  } else {
    // Create new collection
    await pb.collections.create({
      name,
      type: 'base',
      schema: inventorySchemaFields
    });
    console.log(`   ✅ Created collection: ${name}`);
  }
}

const currencySettingsSchemaFields = [
  { name: 'base_price_usd', type: 'number', required: true, options: { min: 0 } },
  { name: 'cup_per_usd', type: 'number', required: true, options: { min: 0 } },
  { name: 'auto_price_enabled', type: 'bool', required: true },
  { name: 'multipliers', type: 'json', required: true }
];

async function createOrUpdateCurrencySettingsCollection() {
  const name = 'currency_settings';
  let collection;

  try {
    collection = await pb.collections.getOne(name);
    console.log(`   ℹ️  Collection '${name}' exists - updating schema`);
  } catch {
    collection = null;
  }

  if (collection) {
    const existingSchema = collection.schema || [];
    const existingFieldNames = existingSchema.map((f: any) => f.name);
    const newFields = currencySettingsSchemaFields.filter(f => !existingFieldNames.includes(f.name));

    if (newFields.length === 0) {
      console.log(`   ℹ️  Collection '${name}' already has all fields`);
      return;
    }

    const updatedSchema = [...existingSchema, ...newFields];
    await pb.collections.update(collection.id, { schema: updatedSchema });
    console.log(`   ✅ Updated collection '${name}' - added ${newFields.length} new fields`);
  } else {
    await pb.collections.create({
      name,
      type: 'base',
      schema: currencySettingsSchemaFields
    });
    console.log(`   ✅ Created collection: ${name}`);
  }
}

async function createDefaultUser() {
  const email = ADMIN_USER.includes('@') ? ADMIN_USER : `${ADMIN_USER}@localhost.local`;
  const username = ADMIN_USER.includes('@') ? ADMIN_USER.split('@')[0] : ADMIN_USER;

  try {
    await pb.collection('users').getFirstListItem(`username = "${username}"`);
    console.log(`   ℹ️  User '${username}' already exists`);
    return;
  } catch {
    // User doesn't exist
  }

  await pb.collection('users').create({
    username: username,
    email: email,
    password: ADMIN_PASSWORD,
    passwordConfirm: ADMIN_PASSWORD
  });

  console.log(`   ✅ Created user: ${username} (${email})`);
}

// Run setup
setupCollections().catch((err) => {
  console.error('Setup failed:', err);
  process.exit(1);
});
