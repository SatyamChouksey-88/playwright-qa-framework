import { test as base } from '@playwright/test';
import { ProductsPage } from '../pages/products.page';
import { CartComponent } from '../pages/cart.component';
import { FilterComponent } from '../pages/filter.component';
import { ProductsApiClient } from '../api/products.api-client';

type TestFixtures = {
  productsPage: ProductsPage;
  cart: CartComponent;
  filter: FilterComponent;
  productsApi: ProductsApiClient;
};

export const test = base.extend<TestFixtures>({
  productsPage: async ({ page }, use) => {
    await use(new ProductsPage(page));
  },
  cart: async ({ page }, use) => {
    await use(new CartComponent(page));
  },
  filter: async ({ page }, use) => {
    await use(new FilterComponent(page));
  },
  productsApi: async ({ request }, use) => {
    await use(new ProductsApiClient(request));
  },
});

export { expect } from '@playwright/test';
