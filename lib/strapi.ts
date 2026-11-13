const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

export interface AuthResponse {
  jwt: string;
  user: {
    id: number;
    username: string;
    email: string;
    role?: {
      name: string;
    };
  };
}

/**
 * Inicia sesión en Strapi con email y contraseña.
 * Devuelve el token JWT y los datos del usuario.
 */
export async function login(
  identifier: string,
  password: string
): Promise<AuthResponse> {
  const res = await fetch(`${STRAPI_URL}/api/auth/local`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(
      error?.error?.message || "Credenciales incorrectas"
    );
  }

  return res.json();
}

/**
 * Comprueba que el usuario tenga rol Administrador.
 * El backend solo responde 200 a ese rol; a los clientes les responde 403.
 */
export async function checkPanelAccess(token: string): Promise<boolean> {
  const res = await fetch(`${STRAPI_URL}/api/panel-access`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (res.status === 401 || res.status === 403) return false;
  if (!res.ok) throw new Error("No se pudo verificar el acceso. Intenta de nuevo.");
  return true;
}

/**
 * Obtiene los productos de Strapi con paginación opcional.
 */
export async function getProducts(
  token: string,
  params: { page?: number; pageSize?: number } = {}
) {
  const { page = 1, pageSize = 10 } = params;
  const query = `/api/products?populate=*&pagination[page]=${page}&pagination[pageSize]=${pageSize}&sort=createdAt:desc`;

  const res = await fetch(`${STRAPI_URL}${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) throw new Error("Error al obtener productos");
  return res.json();
}

/**
 * Obtiene TODOS los pedidos de Strapi (el más reciente primero).
 * Strapi entrega máximo 100 por página, así que se piden todas las páginas.
 */
export async function getOrders(token: string) {
  const pageSize = 100;
  const all: any[] = [];
  let page = 1;
  let pageCount = 1;

  do {
    const res = await fetch(
      `${STRAPI_URL}/api/orders?sort=createdAt:desc&pagination[page]=${page}&pagination[pageSize]=${pageSize}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        next: { revalidate: 0 },
      }
    );

    if (!res.ok) throw new Error("Error al obtener pedidos");
    const json = await res.json();
    all.push(...(json?.data ?? []));
    pageCount = json?.meta?.pagination?.pageCount ?? 1;
    page++;
  } while (page <= pageCount);

  return { data: all, meta: { pagination: { total: all.length } } };
}

/**
 * Un pedido cuenta como venta cuando su pago fue aprobado o cuando ya está
 * pagado, enviado o entregado (los pedidos de prueba del seed no tienen estado de pago).
 */
export function isPaidOrder(order: any): boolean {
  const o = order?.attributes || order;
  return (
    o?.paymentStatus === "approved" ||
    ["paid", "shipped", "delivered"].includes(o?.statusOrder)
  );
}

/** Total del pedido como número (en COP). */
export function orderTotal(order: any): number {
  const o = order?.attributes || order;
  return Number(o?.total) || 0;
}

/**
 * Obtiene las categorías de Strapi.
 */
export async function getCategories(token: string) {
  const res = await fetch(`${STRAPI_URL}/api/categories`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) throw new Error("Error al obtener categorías");
  return res.json();
}

/**
 * Convierte un nombre en un identificador para la URL: "Ropa Niños" → "ropa-ninos".
 */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Crea una categoría publicada. El slug se arma a partir del nombre.
 */
export async function createCategory(
  token: string,
  data: { name: string; description?: string }
) {
  const res = await fetch(`${STRAPI_URL}/api/categories?status=published`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      data: {
        name: data.name,
        slug: slugify(data.name),
        description: data.description || null,
      },
    }),
  });

  if (!res.ok) throw await getApiError(res, "Error al crear la categoría");
  return res.json();
}

/**
 * Obtiene un producto por su documentId.
 * En Strapi 5 las rutas /api/products/:id usan el documentId (texto), no el id numérico.
 */
export async function getProductById(token: string, documentId: string) {
  const res = await fetch(`${STRAPI_URL}/api/products/${documentId}?populate=*`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) throw new Error("Error al obtener producto");
  return res.json();
}

/**
 * Extrae un mensaje de error legible a partir de la respuesta de Strapi.
 */
async function getApiError(res: Response, fallback: string): Promise<Error> {
  let message = fallback;
  try {
    const error = await res.json();
    const details = error?.error?.details;
    const fieldErrors = details?.errors?.map((e: any) => e.message).join(", ");
    message =
      error?.error?.message ||
      fieldErrors ||
      fallback;
  } catch {
    /* ignore */
  }
  return new Error(message);
}

/**
 * Sube una imagen a Strapi (plugin Upload).
 * Devuelve el archivo creado ({ id, url, ... }).
 */
export async function uploadImage(token: string, file: File) {
  const formData = new FormData();
  formData.append("files", file);

  const res = await fetch(`${STRAPI_URL}/api/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) throw await getApiError(res, "Error al subir la imagen");
  const data = await res.json();
  return data?.[0];
}

/**
 * Crea un nuevo producto.
 */
export async function createProduct(token: string, data: any) {
  // status=published: el producto queda publicado y visible en la tienda
  const res = await fetch(`${STRAPI_URL}/api/products?status=published`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ data }),
  });

  if (!res.ok) throw await getApiError(res, "Error al crear producto");
  return res.json();
}

/**
 * Actualiza un producto existente.
 */
export async function updateProduct(token: string, documentId: string, data: any) {
  const res = await fetch(`${STRAPI_URL}/api/products/${documentId}?status=published`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ data }),
  });

  if (!res.ok) throw await getApiError(res, "Error al actualizar producto");
  return res.json();
}

/**
 * Elimina un producto.
 */
export async function deleteProduct(token: string, documentId: string) {
  const res = await fetch(`${STRAPI_URL}/api/products/${documentId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Error al eliminar producto");
}

/**
 * Actualiza el estado de un pedido.
 */
export async function updateOrderStatus(
  token: string,
  documentId: string,
  status: string
) {
  const res = await fetch(`${STRAPI_URL}/api/orders/${documentId}?status=published`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ data: { statusOrder: status } }),
  });

  if (!res.ok) throw new Error("Error al actualizar pedido");
  return res.json();
}
