import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

export interface EnvConfig {
  envName: string;
  baseUrl: string;
  productsApiUrl: string;
  /**
   * Whether the app fetches its catalog over the network.
   *
   * The app's `getProducts()` branches on `NODE_ENV`: a production build calls
   * `firebaseio.com/products.json`, while a local `react-scripts start` build
   * does `require('static/json/products.json')` and issues no request at all
   * (see ../react-shopping-cart/src/services/products.ts). Waiting on a response
   * — or stubbing one with `page.route` — is therefore meaningless on dev.
   */
  fetchesCatalogOverNetwork: boolean;
}

const PRODUCTS_API = 'https://react-shopping-cart-67954.firebaseio.com/products.json';
const HOSTED_APP = 'https://react-shopping-cart-67954.firebaseapp.com';

const DEFAULTS: Record<string, Omit<EnvConfig, 'envName'>> = {
  dev: {
    baseUrl: 'http://localhost:3000',
    productsApiUrl: PRODUCTS_API,
    fetchesCatalogOverNetwork: false,
  },
  staging: {
    baseUrl: HOSTED_APP,
    productsApiUrl: PRODUCTS_API,
    fetchesCatalogOverNetwork: true,
  },
  prod: {
    baseUrl: HOSTED_APP,
    productsApiUrl: PRODUCTS_API,
    fetchesCatalogOverNetwork: true,
  },
};

function loadEnvFile(envName: string): void {
  const envPath = path.resolve(__dirname, 'environments', `${envName}.env`);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
  }
}

export function getEnvConfig(): EnvConfig {
  const envName = process.env.TEST_ENV ?? 'prod';
  loadEnvFile(envName);

  const defaults = DEFAULTS[envName] ?? DEFAULTS.prod;

  return {
    envName,
    baseUrl: process.env.BASE_URL ?? defaults.baseUrl,
    productsApiUrl: process.env.PRODUCTS_API_URL ?? defaults.productsApiUrl,
    fetchesCatalogOverNetwork: defaults.fetchesCatalogOverNetwork,
  };
}
