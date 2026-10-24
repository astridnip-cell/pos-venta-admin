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
 * Obtiene los pedidos de Strapi.
 */
export async function getOrders(token: string) {
  const res = await fetch(
    `${STRAPI_URL}/api/orders?sort=createdAt:desc`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 0 },
    }
  );

  if (!res.ok) throw new Error("Error al obtener pedidos");
  return res.json();
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
 * Obtiene un producto por su ID.
 */
export async function getProductById(token: string, id: number) {
  const res = await fetch(`${STRAPI_URL}/api/products/${id}?populate=*`, {
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
  const res = await fetch(`${STRAPI_URL}/api/products`, {
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
export async function updateProduct(token: string, id: number, data: any) {
  const res = await fetch(`${STRAPI_URL}/api/products/${id}`, {
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
export async function deleteProduct(token: string, id: number) {
  const res = await fetch(`${STRAPI_URL}/api/products/${id}`, {
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
  id: number,
  status: string
) {
  const res = await fetch(`${STRAPI_URL}/api/orders/${id}`, {
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
