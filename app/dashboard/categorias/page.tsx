"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getCategories } from "@/lib/strapi";
import { Loader2, Tags, Plus } from "lucide-react";

export default function CategoriasPage() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    async function loadCategories() {
      setIsLoading(true);
      try {
        const res = await getCategories(token!);
        setCategories(res?.data || []);
      } catch (error) {
        console.error("Error cargando categorías:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadCategories();
  }, [token]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
          <p className="text-gray-500 mt-1">
            Organiza tus productos por categorías
          </p>
        </div>
        <button className="flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-lg hover:bg-gray-800 transition-colors">
          <Plus className="h-4 w-4" />
          Nueva Categoría
        </button>
      </div>

      <div className="bg-white rounded-xl border">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b">
                  <th className="px-6 py-3 font-medium">Nombre</th>
                  <th className="px-6 py-3 font-medium">Slug</th>
                  <th className="px-6 py-3 font-medium">Descripción</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      <Tags className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      No hay categorías
                    </td>
                  </tr>
                ) : (
                  categories.map((category: any) => {
                    const attrs = category.attributes || category;
                    return (
                      <tr
                        key={category.id}
                        className="border-b last:border-0 hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {attrs.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {attrs.slug}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {attrs.description || "Sin descripción"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
