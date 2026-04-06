/**
 * Configuration for the shop search API.
 *
 * Set SHOP_API_BASE_URL to your deployed Railway/Render endpoint.
 * The Express service lives in /shop-api in this repo.
 *
 * Example: https://stash-shop-api.onrender.com
 *
 * When developing locally you can point this at http://localhost:3001
 */
export const SHOP_API_BASE_URL =
  process.env.EXPO_PUBLIC_SHOP_API_URL ?? 'https://stash-shop-api.onrender.com';
