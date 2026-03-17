## YugiAdmin - Yu-Gi-Oh! Store Admin

YugiAdmin is a small admin web application for managing a Yu-Gi-Oh! card store inventory (cards, decks, accessories) with a pricing system based on rarity and currency conversion.

### Tech stack

- **React + TypeScript** (Vite)
- **React Router v6** for navigation
- **Zustand** for state management
- **TailwindCSS** for styling
- **PocketBase** for backend (self-hosted)

### Getting started

1. **Install dependencies**

```bash
npm install
```

2. **Create environment file**

Create a `.env` file in the project root:

```bash
VITE_PB_URL=http://127.0.0.1:8090
VITE_ADMIN_USER=admin
VITE_ADMIN_PASSWORD=change-me
```

3. **Run the dev server**

```bash
npm run dev
```

Open the shown URL (by default `http://localhost:5173`) and log in with the credentials set in `.env`.

### PocketBase backend setup

1. **Download and run PocketBase**

- Download PocketBase for your OS from the official site.
- Start it (default URL is `http://127.0.0.1:8090`).

2. **Create an auth collection**

Create an auth collection named **`users`** (PocketBase calls these “auth collections”).

- Create a user whose **username and password match**:
  - `VITE_ADMIN_USER`
  - `VITE_ADMIN_PASSWORD`

This project intentionally gates login attempts to those `.env` values.

3. **Create inventory collections**

Create 3 collections (regular collections) with these exact names:

- `cards`
- `decks`
- `accessories`

Each must include the following fields (types shown as PocketBase field types):

- `name` (text, required)
- `sellerName` (text, required)
- `gameFormat` (select: `TCG`, `OCG`, required)
- `condition` (select: `Near Mint`, `Lightly Played`, `Moderately Played`, `Heavily Played`, `Damaged`, required)
- `expansionCode` (text, required)
- `rarity` (select: `Common`, `Rare`, `Super Rare`, `Ultra Rare`, `Secret Rare`, `Prismatic Secret Rare`, required)
- `quantity` (number, min 0, required)
- `priceUsd` (number, min 0, required)
- `priceCup` (number, min 0, required)

4. **Create currency settings collection**

Create a collection named `currency_settings` with fields:

- `basePriceUsd` (number, min 0, required)
- `cupPerUsd` (number, min 0, required)
- `autoPriceEnabled` (bool, required)
- `multipliers` (json, required)

The app will auto-create a single settings record if none exists.

### Authentication

- Login is username + password.
- Credentials are checked against `VITE_ADMIN_USER` and `VITE_ADMIN_PASSWORD`, then authenticated against PocketBase `users`.
- PocketBase auth uses its built-in auth store (browser localStorage) and routes are protected except `/login`.

### Data model

All inventory items share a common shape (`BaseItem`) that includes:

- **id**: string (auto-generated)
- **name**: item name
- **sellerName**: seller identifier
- **gameFormat**: `TCG` or `OCG`
- **condition**: `Near Mint`, `Lightly Played`, `Moderately Played`, `Heavily Played`, `Damaged`
- **expansionCode**: set code / expansion code
- **rarity**: `Common`, `Rare`, `Super Rare`, `Ultra Rare`, `Secret Rare`, `Prismatic Secret Rare`
- **quantity**: number
- **priceUsd**: number
- **priceCup**: number

These are used for three categories:

- **Cards**
- **Decks**
- **Accessories**

All inventory data is stored in PocketBase and can be exported/imported as `.json` from each category page.

### Currency & pricing system

The **Currency Settings** page controls how prices are calculated:

- **Base price (USD)**: a reference price for a "baseline" card.
- **Rarity multipliers**: per-rarity multipliers applied to the base price:
  - Common
  - Rare
  - Super Rare
  - Ultra Rare
  - Secret Rare
  - Prismatic Secret Rare
- **CUP exchange rate**: how many CUP equal 1 USD (e.g. 350).
- **Auto-pricing toggle**:
  - When **ON**, new items default their `priceUsd` to `basePrice × rarityMultiplier`.
  - `priceCup` is then computed as `priceUsd × cupRate`.
  - The values can still be manually overridden in the item form.

There is a **preview table** showing, for each rarity:

- Rarity
- Multiplier (editable)
- Calculated USD price
- Calculated CUP price

#### Applying prices

- When you change settings, new items will use the updated defaults (if auto-pricing is enabled).
- The **"Apply to all existing items"** button recalculates prices for **every existing item** in all categories using the current base price, multipliers, and CUP rate.

### Pages overview

- **Dashboard**
  - Summary cards: total cards, decks, accessories, and inventory value in USD and CUP.
  - Low stock alerts for items with `quantity <= 5`.
- **Cards / Decks / Accessories**
  - Searchable, filterable data table.
  - Filters by format, condition, rarity, and seller.
  - Add / edit modal form with validation.
  - Delete with confirmation dialog.
  - Import / export JSON for backup or batch updates.
- **Currency Settings**
  - Configure base price, multipliers, CUP rate.
  - Toggle auto-pricing.
  - Preview computed prices per rarity.

### Notes

- PocketBase must be running for the app to function.
- Clearing browser storage will log you out (PocketBase token is stored locally by default).

