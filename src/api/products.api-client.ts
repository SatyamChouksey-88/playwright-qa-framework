import { APIRequestContext } from '@playwright/test';
import { getEnvConfig } from '../../config/env';
import { Product, ProductsResponse } from '../types/product.types';

export class ProductsApiClient {
  private readonly request: APIRequestContext;
  private readonly apiUrl: string;

  constructor(request: APIRequestContext) {
    this.request = request;
    this.apiUrl = getEnvConfig().productsApiUrl;
  }

  async fetchProducts(): Promise<Product[]> {
    const response = await this.request.get(this.apiUrl);
    if (!response.ok()) {
      throw new Error(`Products API failed: ${response.status()} ${response.statusText()}`);
    }
    const body = (await response.json()) as ProductsResponse;
    return body.products;
  }

  async getAllSizes(): Promise<Set<string>> {
    const products = await this.fetchProducts();
    const sizes = new Set<string>();
    products.forEach((p) => p.availableSizes.forEach((s) => sizes.add(s)));
    return sizes;
  }

  async getProductsWithSize(size: string): Promise<Product[]> {
    const products = await this.fetchProducts();
    return products.filter((p) => p.availableSizes.includes(size));
  }
}
