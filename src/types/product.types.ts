export interface Product {
  id: number;
  sku: number;
  title: string;
  description: string;
  availableSizes: string[];
  style: string;
  price: number;
  installments: number;
  currencyId: string;
  currencyFormat: string;
  isFreeShipping: boolean;
}

export interface ProductsResponse {
  products: Product[];
}

export interface CatalogProduct {
  title: string;
  price: number;
  priceText: string;
}

export interface CartLineValidation {
  title: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}
