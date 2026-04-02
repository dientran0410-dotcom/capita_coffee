import { apiUtils } from '../api/axios';

export interface Category {
  id: string;
  name: string;
  slug?: string;
  parentId?: string;
  status?: string;
  topping?: boolean;
}

export interface CategoryCreateRequest {
  name: string;
  slug: string;
  parentId?: string;
  isTopping?: boolean;
}

export interface CategoryUpdateRequest {
  name?: string;
  parentId?: string;
  status?: string;
  topping?: boolean;
}

// Helper unwrap response
function unwrap<T>(data: any): T {
  return (data?.result ?? data) as T;
}

// ================= GET LIST =================
export async function getCategories(params?: {
  isTopping?: boolean;
  parentId?: string;
}): Promise<Category[]> {
  const data = await apiUtils.get<Category[] | { result: Category[] }>(
    '/products/categories',
    params
  );

  const result = unwrap<Category[]>(data);
  return Array.isArray(result) ? result : [];
}

// ================= CREATE =================
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export async function createCategory(
  request: CategoryCreateRequest,
): Promise<Category> {

  const payload = {
    ...request,
    slug: request.slug || generateSlug(request.name),
  };

  console.log("🚀 payload gửi lên BE:", payload); // debug

  const data: any = await apiUtils.post('/products/categories', payload);
  return (data?.result ?? data) as Category;
}

// ================= GET BY ID =================
export async function getCategoryById(id: string): Promise<Category> {
  const data = await apiUtils.get<Category | { result: Category }>(
    `/products/categories/${id}`
  );

  return unwrap<Category>(data);
}

// ================= UPDATE =================
export async function updateCategory(
  id: string,
  request: CategoryUpdateRequest,
): Promise<Category> {
  const data = await apiUtils.put<Category | { result: Category }>(
    `/products/categories/${id}`,
    request
  );

  return unwrap<Category>(data);
}

// ================= DELETE =================
export async function deleteCategory(id: string): Promise<void> {
  await apiUtils.delete(`/products/categories/${id}`);
}