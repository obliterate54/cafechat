export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  barcode?: string;
  category?: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  barcode?: string;
}

export interface InvoiceItem {
  productName: string;
  barcode: string;
  quantity: number;
  purchasePrice: number;
  salePrice: number;
  category: string;
}

export interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  supplier: string;
  date: string;
  time: string;
  items: InvoiceItem[];
  total: number;
}

export interface SaleInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  time: string;
  items: CartItem[];
  total: number;
  cashier: string;
}

export interface ReportsSummary {
  salesReportData: Array<{ date: string; invoices: number; items: number; total: number }>;
  purchaseReportData: Array<{ date: string; invoices: number; items: number; total: number }>;
  profitReportData: Array<{ date: string; sales: number; purchases: number; profit: number }>;
  topSellingProducts: Array<{ name: string; quantity: number; revenue: number }>;
  purchasedItems: Array<{ name: string; quantity: number; cost: number }>;
  soldItems: Array<{ name: string; quantity: number; remaining: number }>;
}
