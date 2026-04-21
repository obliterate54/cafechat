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
  index?: string;
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
  sessionId?: string | null;
}

export interface ReportsSummary {
  salesReportData: Array<{ date: string; invoices: number; items: number; total: number }>;
  purchaseReportData: Array<{ date: string; invoices: number; items: number; total: number }>;
  profitReportData: Array<{ date: string; sales: number; purchases: number; profit: number }>;
  topSellingProducts: Array<{ name: string; quantity: number; revenue: number }>;
  purchasedItems: Array<{ name: string; quantity: number; cost: number }>;
  soldItems: Array<{ name: string; quantity: number; remaining: number }>;
}

export type UserRole = 'admin' | 'worker';

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface SalesSession {
  id: string;
  startedAt: string;
  endedAt?: string;
  openedBy: string;
  closedBy?: string;
  status: 'active' | 'closed';
  comments: string;
  totalSalesAmount: number;
  totalInvoices: number;
  totalItems: number;
  isActive: boolean;
}

export interface SessionSummaryItem {
  name: string;
  quantity: number;
  amount: number;
}

export interface SessionSummary {
  sessionId: string;
  sessionName?: string;
  startedAt: string;
  endedAt?: string | null;
  totalInvoices: number;
  totalItems: number;
  totalSalesAmount: number;
  products: SessionSummaryItem[];
  comments?: string;
}