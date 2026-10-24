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
  const [categories, setCategories] = useState<{ id: number; name: string }[]>(
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
          return { id: cat.id, name: attrs.name };
        });
        setCategories(list);
      } catch (error) {
        console.error("Error cargando categorías:", error);
      }
    }

    loadCategories();
  }, [token]);

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return;
    try {
      await deleteProduct(token!, id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
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
      const res = await getProductById(token!, product.id);
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
          <h1 className="text-2xl font-bold text-white" style={{ textShadow: '0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 40px #00ffff' }}>Productos</h1>
          <p className="text-gray-400 mt-1">
            Gestiona el inventario de tu tienda
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-cyan-400/10 text-cyan-400 border border-cyan-400/30 px-4 py-2.5 rounded-lg hover:bg-cyan-400/20 transition-colors"
          style={{ boxShadow: '0 0 10px #00ffff40, 0 0 20px #00ffff20, inset 0 0 10px #00ffff10' }}
        >
          <Plus className="h-4 w-4" />
          Nuevo Producto
        </button>
      </div>

      {/* Buscador */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-400" />
        <input
          type="text"
          placeholder="Buscar productos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-[#111111] border border-[#1a1a1a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20"
        />
      </div>

      {/* Tabla de productos */}
      <div className="neon-card bg-[#111111] rounded-xl border border-[#1a1a1a]">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-400 border-b border-[#1a1a1a]">
                    <th className="px-6 py-3 font-medium">Producto</th>
                    <th className="px-6 py-3 font-medium">Categoría</th>
                    <th className="px-6 py-3 font-medium">Precio</th>
                    <th className="px-6 py-3 font-medium">Stock</th>
                    <th className="px-6 py-3 font-medium text-right">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        <Package className="h-8 w-8 mx-auto mb-2 text-cyan-400" />
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
                      const stockColor =
                        stock < 5
                          ? "text-red-400 bg-red-400/10"
                          : stock < 20
                          ? "text-orange-400 bg-orange-400/10"
                          : "text-green-400 bg-green-400/10";
                      const stockGlow = stock < 5 ? '#ff4757' : stock < 20 ? '#ff6600' : '#39ff14';

                      return (
                        <tr
                          key={product.id}
                          className="neon-table-row border-b border-[#1a1a1a] last:border-0"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-[#1a1a1a] flex items-center justify-center overflow-hidden" style={{ boxShadow: 'inset 0 0 10px rgba(0, 255, 255, 0.05)' }}>
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
                                  <Package className="h-4 w-4 text-cyan-400" />
                                )}
                              </div>
                              <span className="text-sm font-medium text-white">
                                {attrs.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400">
                            {category}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-white">
                            ${attrs.price?.toLocaleString("es-CO")}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${stockColor}`}
                              style={{ boxShadow: `0 0 8px ${stockGlow}40` }}
                            >
                              {stock} uds
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEdit(product)}
                                disabled={isEditingLoading}
                                title="Editar producto"
                                className="p-2 text-gray-400 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-colors disabled:opacity-40"
                                style={{ textShadow: '0 0 5px #00ffff' }}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(product.id)}
                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                style={{ textShadow: '0 0 5px #ff4757' }}
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
              <div className="flex items-center justify-center gap-2 p-4 border-t border-[#1a1a1a]">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? "bg-cyan-400/20 text-cyan-400 border border-cyan-400/30"
                          : "text-gray-400 hover:bg-[#1a1a1a]"
                      }`}
                      style={currentPage === page ? { boxShadow: '0 0 10px rgba(0, 255, 255, 0.3)' } : {}}
                    >
                      {page}
                    </button>
                  )
                )}
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
