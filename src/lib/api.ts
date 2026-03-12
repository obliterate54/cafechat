import type { Category, Product, PurchaseInvoice, ReportsSummary, SaleInvoice } from '@/types/pos';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}/api${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    let message = 'حدث خطأ في الاتصال بالخادم';
    try {
      const error = await response.json();
      message = error.message || message;
    } catch {
      // ignore JSON parse failures
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  getCategories: () => request<Category[]>('/categories'),
  createCategory: (data: Omit<Category, 'id'>) =>
    request<Category>('/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id: string, data: Partial<Category> & { previousName?: string }) =>
    request<Category>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id: string) =>
    request<void>(`/categories/${id}`, { method: 'DELETE' }),

  getProducts: () => request<Product[]>('/products'),
  createProduct: (data: Omit<Product, 'id'>) =>
    request<Product>('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: Omit<Product, 'id'>) =>
    request<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id: string) =>
    request<void>(`/products/${id}`, { method: 'DELETE' }),

  getPurchases: () => request<PurchaseInvoice[]>('/purchases'),
  createPurchase: (data: Omit<PurchaseInvoice, 'id'>) =>
    request<PurchaseInvoice>('/purchases', { method: 'POST', body: JSON.stringify(data) }),

  getSales: () => request<SaleInvoice[]>('/sales'),
  createSale: (data: Omit<SaleInvoice, 'id'>) =>
    request<SaleInvoice>('/sales', { method: 'POST', body: JSON.stringify(data) }),

  getReports: (from?: string, to?: string) => {
    const query = new URLSearchParams();
    if (from) query.set('from', from);
    if (to) query.set('to', to);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request<ReportsSummary>(`/reports/summary${suffix}`);
  }
};