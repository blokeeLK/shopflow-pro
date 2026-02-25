export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  categorySlug: string;
  price: number;
  promoPrice?: number;
  isPromo: boolean;
  promoEndDate?: string;
  images: string[];
  sizes: { size: string; stock: number }[];
  sold: number;
  rating: number;
  reviewCount: number;
  featured: boolean;
  weight: number;
  dimensions: { width: number; height: number; length: number };
}

export interface CartItem {
  product: Product;
  size: string;
  quantity: number;
}

export interface Category {
  name: string;
  slug: string;
  image: string;
}

export const categories: Category[] = [
  { name: "Camisetas", slug: "camisetas", image: "" },
  { name: "Calças", slug: "calcas", image: "" },
  { name: "Vestidos", slug: "vestidos", image: "" },
  { name: "Acessórios", slug: "acessorios", image: "" },
];

export const products: Product[] = [
  {
    id: "1",
    name: "Camiseta Oversized Premium",
    slug: "camiseta-oversized-premium",
    description: "Camiseta oversized em algodão premium 100%. Caimento perfeito e conforto o dia todo.",
    category: "Camisetas",
    categorySlug: "camisetas",
    price: 149.90,
    promoPrice: 99.90,
    isPromo: true,
    promoEndDate: "2026-03-10T23:59:59",
    images: ["/placeholder.svg"],
    sizes: [
      { size: "P", stock: 5 },
      { size: "M", stock: 12 },
      { size: "G", stock: 8 },
      { size: "GG", stock: 3 },
    ],
    sold: 17,
    rating: 4.7,
    reviewCount: 23,
    featured: true,
    weight: 0.3,
    dimensions: { width: 30, height: 5, length: 40 },
  },
  {
    id: "2",
    name: "Calça Jogger Streetwear",
    slug: "calca-jogger-streetwear",
    description: "Calça jogger com elastano para máximo conforto. Estilo urbano e moderno.",
    category: "Calças",
    categorySlug: "calcas",
    price: 199.90,
    promoPrice: 159.90,
    isPromo: true,
    promoEndDate: "2026-03-15T23:59:59",
    images: ["/placeholder.svg"],
    sizes: [
      { size: "38", stock: 4 },
      { size: "40", stock: 10 },
      { size: "42", stock: 7 },
      { size: "44", stock: 2 },
    ],
    sold: 12,
    rating: 4.5,
    reviewCount: 15,
    featured: true,
    weight: 0.5,
    dimensions: { width: 35, height: 5, length: 45 },
  },
  {
    id: "3",
    name: "Vestido Midi Elegance",
    slug: "vestido-midi-elegance",
    description: "Vestido midi com tecido fluido e caimento impecável. Perfeito para qualquer ocasião.",
    category: "Vestidos",
    categorySlug: "vestidos",
    price: 259.90,
    images: ["/placeholder.svg"],
    sizes: [
      { size: "P", stock: 6 },
      { size: "M", stock: 9 },
      { size: "G", stock: 4 },
    ],
    sold: 8,
    rating: 4.9,
    reviewCount: 11,
    featured: true,
    isPromo: false,
    weight: 0.4,
    dimensions: { width: 30, height: 5, length: 50 },
  },
  {
    id: "4",
    name: "Camiseta Basic Essentials",
    slug: "camiseta-basic-essentials",
    description: "A camiseta básica que todo guarda-roupa precisa. 100% algodão penteado.",
    category: "Camisetas",
    categorySlug: "camisetas",
    price: 89.90,
    promoPrice: 69.90,
    isPromo: true,
    promoEndDate: "2026-03-20T23:59:59",
    images: ["/placeholder.svg"],
    sizes: [
      { size: "P", stock: 15 },
      { size: "M", stock: 20 },
      { size: "G", stock: 18 },
      { size: "GG", stock: 10 },
    ],
    sold: 20,
    rating: 4.3,
    reviewCount: 34,
    featured: false,
    weight: 0.25,
    dimensions: { width: 28, height: 4, length: 38 },
  },
  {
    id: "5",
    name: "Calça Cargo Urban",
    slug: "calca-cargo-urban",
    description: "Calça cargo com bolsos laterais funcionais. Estilo utility wear.",
    category: "Calças",
    categorySlug: "calcas",
    price: 229.90,
    images: ["/placeholder.svg"],
    sizes: [
      { size: "38", stock: 3 },
      { size: "40", stock: 7 },
      { size: "42", stock: 5 },
    ],
    sold: 6,
    rating: 4.6,
    reviewCount: 9,
    featured: false,
    isPromo: false,
    weight: 0.6,
    dimensions: { width: 35, height: 6, length: 45 },
  },
  {
    id: "6",
    name: "Vestido Floral Summer",
    slug: "vestido-floral-summer",
    description: "Vestido com estampa floral exclusiva. Tecido leve e fresco para o verão.",
    category: "Vestidos",
    categorySlug: "vestidos",
    price: 189.90,
    promoPrice: 149.90,
    isPromo: true,
    promoEndDate: "2026-03-12T23:59:59",
    images: ["/placeholder.svg"],
    sizes: [
      { size: "P", stock: 8 },
      { size: "M", stock: 11 },
      { size: "G", stock: 6 },
    ],
    sold: 14,
    rating: 4.8,
    reviewCount: 19,
    featured: true,
    weight: 0.35,
    dimensions: { width: 30, height: 4, length: 48 },
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductsByCategory(categorySlug: string): Product[] {
  return products.filter((p) => p.categorySlug === categorySlug && getTotalStock(p) > 0);
}

export function getFeaturedProducts(): Product[] {
  return products.filter((p) => p.featured && getTotalStock(p) > 0);
}

export function getTotalStock(product: Product): number {
  return product.sizes.reduce((acc, s) => acc + s.stock, 0);
}

export function getCategoriesWithStock(): Category[] {
  return categories.filter((c) => getProductsByCategory(c.slug).length > 0);
}

export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function getInstallments(price: number, count: number = 3): string {
  const value = price / count;
  return `${count}x de ${formatCurrency(value)} sem juros`;
}
