"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getProducts, deleteProduct } from "@/lib/strapi";
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
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

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
  }, [token, currentPage]);

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return;
    try {
      await deleteProduct(token!, id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      alert("Error al eliminar producto");
    }
  };

  const filteredProducts = products.filter((p) => {
    const name = p.attributes?.name || p.name || "";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-500 mt-1">
            Gestiona el inventario de tu tienda
          </p>
        </div>
        <button className="flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-lg hover:bg-gray-800 transition-colors">
          <Plus className="h-4 w-4" />
          Nuevo Producto
        </button>
      </div>

      {/* Buscador */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar productos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10"
        />
      </div>

      {/* Tabla de productos */}
      <div className="bg-white rounded-xl border">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b">
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
                        <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
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
                      const stockColor =
                        stock < 5
                          ? "text-red-600 bg-red-50"
                          : stock < 20
                          ? "text-orange-600 bg-orange-50"
                          : "text-green-600 bg-green-50";

                      return (
                        <tr
                          key={product.id}
                          className="border-b last:border-0 hover:bg-gray-50"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                                {attrs.image?.data?.url ? (
                                  <img
                                    src={`http://localhost:1337${attrs.image.data.url}`}
                                    alt={attrs.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Package className="h-4 w-4 text-gray-400" />
                                )}
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {attrs.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {category}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            ${attrs.price?.toLocaleString("es-CO")}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${stockColor}`}
                            >
                              {stock} uds
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(product.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
              <div className="flex items-center justify-center gap-2 p-4 border-t">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? "bg-black text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
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
    </div>
  );
}
