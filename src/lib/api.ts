import type {
  AuthResponse,
  AuthUser,
  Category,
  Product,
  PurchaseInvoice,
  ReportsSummary,
  SaleInvoice,
  SalesSession,
  SessionSummary,
} from '@/types/pos';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const TOKEN_KEY = 'pos_auth_token';

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY) || '',
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
};

export async function getSalesSessionSummary(sessionId: string): Promise<SessionSummary> {
  return request<SessionSummary>(`/sales-sessions/${sessionId}/summary`);
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = authStorage.getToken();
  const response = await fetch(`${API_BASE}/api${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let message = 'حدث خطأ في الاتصال بالخادم';
    try {
      const error = await response.json();
      message = error.message || message;
    } catch {
      // ignore
    }

    if (response.status === 401) {
      authStorage.clearToken();
    }

    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  login: (username: string, password: string) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  me: () => request<{ user: AuthUser }>('/auth/me'),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),

  getCategories: () => request<Category[]>('/categories'),
  createCategory: (data: Omit<Category, 'id'>) => request<Category>('/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id: string, data: Partial<Category> & { previousName?: string }) =>
    request<Category>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id: string) => request<void>(`/categories/${id}`, { method: 'DELETE' }),

  getProducts: () => request<Product[]>('/products'),
  createProduct: (data: Omit<Product, 'id'>) => request<Product>('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: Omit<Product, 'id'>) => request<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id: string) => request<void>(`/products/${id}`, { method: 'DELETE' }),

  getPurchases: () => request<PurchaseInvoice[]>('/purchases'),
  createPurchase: (data: Omit<PurchaseInvoice, 'id'>) => request<PurchaseInvoice>('/purchases', { method: 'POST', body: JSON.stringify(data) }),
  deletePurchase: (id: string) => request<void>(`/purchases/${id}`, { method: 'DELETE' }),

  getSales: () => request<SaleInvoice[]>('/sales'),
  createSale: (data: Omit<SaleInvoice, 'id'> & { sessionId?: string | null }) =>
    request<SaleInvoice>('/sales', { method: 'POST', body: JSON.stringify(data) }),
  deleteSale: (id: string) => request<void>(`/sales/${id}`, { method: 'DELETE' }),

  getSalesSessions: () => request<SalesSession[]>('/sales-sessions'),
  getActiveSalesSession: () => request<{ session: SalesSession | null }>('/sales-sessions/active'),
  startSalesSession: (comments = '') => request<SalesSession>('/sales-sessions/start', { method: 'POST', body: JSON.stringify({ comments }) }),
  endSalesSession: (id: string, comments = '') => request<SalesSession>(`/sales-sessions/${id}/end`, { method: 'POST', body: JSON.stringify({ comments }) }),
  updateSalesSessionComments: (id: string, comments: string) => request<SalesSession>(`/sales-sessions/${id}/comments`, { method: 'PUT', body: JSON.stringify({ comments }) }),

  getReports: (from?: string, to?: string) => {
    const query = new URLSearchParams();
    if (from) query.set('from', from);
    if (to) query.set('to', to);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request<ReportsSummary>(`/reports/summary${suffix}`);
  },
};