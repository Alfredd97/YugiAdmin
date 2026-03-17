import PocketBase from 'pocketbase';

const pbUrl = import.meta.env.VITE_PB_URL as string | undefined;

if (!pbUrl) {
  // Keep runtime behavior explicit; a missing URL is a misconfiguration.
  // eslint-disable-next-line no-console
  console.warn('Missing VITE_PB_URL. PocketBase calls will fail until set.');
}

export const pb = new PocketBase(pbUrl ?? 'http://127.0.0.1:8090');

