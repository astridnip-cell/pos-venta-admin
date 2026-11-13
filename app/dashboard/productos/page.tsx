"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getProducts,
  getCategories,
  getProductById,
  deleteProduct,
} from "@/lib/strapi";
import { ProductFormModal } from "@/components/product-form-modal";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Package,
  Search,
} from "lucide-react";

export default function ProductosPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  // Estado del modal de crear/editar
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isEditingLoading, setIsEditingLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!token) return;

    async function loadProducts() {
      setIsLoading(true);
      try {
        const res = await getProducts(token!, {
          page: currentPage,
          pageSize,
        });
        setProducts(res?.data || []);
        setTotalPages(res?.meta?.pagination?.pageCount || 1);
      } catch (error) {
        console.error("Error cargando productos:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadProducts();
  }, [token, currentPage, refreshKey]);

  // Cargar categorías para el selector del formulario
  useEffect(() => {
    if (!token) return;

    async function loadCategories() {
      try {
        const res = await getCategories(token!);
        const list = (res?.data || []).map((cat: any) => {
          const attrs = cat.attributes || cat;
          return { id: cat.documentId, name: attrs.name };
        });
        setCategories(list);
      } catch (error) {
        console.error("Error cargando categorías:", error);
      }
    }

    loadCategories();
  }, [token]);

  const handleDelete = async (documentId: string) => {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return;
    try {
      await deleteProduct(token!, documentId);
      setProducts((prev) => prev.filter((p) => p.documentId !== documentId));
    } catch (error) {
      alert("Error al eliminar producto");
    }
  };

  // Abrir modal para crear
  const openCreate = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  // Abrir modal para editar (carga el producto completo)
  const openEdit = async (product: any) => {
    setIsEditingLoading(true);
    try {
      const res = await getProductById(token!, product.documentId);
      setEditingProduct(res?.data || product);
      setModalOpen(true);
    } catch (error) {
      console.error("Error cargando producto:", error);
      alert("No se pudo cargar el producto para editar");
    } finally {
      setIsEditingLoading(false);
    }
  };

  // Recargar la lista después de guardar
  const handleSaved = () => {
    setModalOpen(false);
    setEditingProduct(null);
    setRefreshKey((k) => k + 1);
  };

  const filteredProducts = products.filter((p) => {
    const name = p.attributes?.name || p.name || "";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Productos</h1>
          <p className="text-sm text-slate-500 mt-1">Gestiona el inventario de tu tienda</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-slate-900 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-sm hover:bg-slate-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nuevo producto
        </button>
      </div>

      {/* Buscador */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar productos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
        />
      </div>

      {/* Tabla de productos */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium uppercase tracking-wide text-slate-500 bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-3">Producto</th>
                    <th className="px-6 py-3">Categoría</th>
                    <th className="px-6 py-3">Precio</th>
                    <th className="px-6 py-3">Stock</th>
                    <th className="px-6 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                        <Package className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                        No hay productos
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product: any) => {
                      const attrs = product.attributes || product;
                      const category =
                        attrs.category?.data?.attributes?.name ||
                        attrs.category?.name ||
                        "Sin categoría";
                      const stock = attrs.stock ?? 0;
                      const imageUrl = attrs.image?.url || attrs.image?.data?.url;
                      const stockClass =
                        stock < 5
                          ? "bg-red-50 text-red-700 ring-red-600/20"
                          : stock < 20
                          ? "bg-amber-50 text-amber-700 ring-amber-600/20"
                          : "bg-emerald-50 text-emerald-700 ring-emerald-600/20";

                      return (
                        <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                                {imageUrl ? (
                                  <img
                                    src={
                                      imageUrl.startsWith("http")
                                        ? imageUrl
                                        : `http://localhost:1337${imageUrl}`
                                    }
                                    alt={attrs.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Package className="h-4 w-4 text-slate-400" />
                                )}
                              </div>
                              <span className="text-sm font-medium text-slate-900">
                                {attrs.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">{category}</td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-900">
                            ${attrs.price?.toLocaleString("es-CO")}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${stockClass}`}
                            >
                              {stock} uds
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openEdit(product)}
                                disabled={isEditingLoading}
                                title="Editar producto"
                                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-40"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(product.documentId)}
                                title="Eliminar producto"
                                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 p-4 border-t border-slate-200">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
                      currentPage === page
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal crear/editar producto */}
      <ProductFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        token={token!}
        product={editingProduct}
        categories={categories}
      />
    </div>
  );
}
