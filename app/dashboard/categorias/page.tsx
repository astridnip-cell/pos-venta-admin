"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createCategory, getCategories, slugify } from "@/lib/strapi";
import { AlertCircle, Loader2, Tags, Plus, X } from "lucide-react";

const inputClass =
  "w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10";

export default function CategoriasPage() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Formulario de nueva categoría
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

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
  }, [token, refreshKey]);

  const openForm = () => {
    setName("");
    setDescription("");
    setError("");
    setSavedMessage("");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const cleanName = name.trim();

    if (!cleanName) {
      setError("Escribe el nombre de la categoría.");
      return;
    }
    const exists = categories.some(
      (c: any) => slugify((c.attributes || c).name || "") === slugify(cleanName)
    );
    if (exists) {
      setError("Ya existe una categoría con ese nombre.");
      return;
    }

    setIsSaving(true);
    try {
      await createCategory(token!, { name: cleanName, description: description.trim() });
      setShowForm(false);
      setSavedMessage(`Categoría "${cleanName}" creada.`);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la categoría.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Categorías</h1>
          <p className="text-sm text-slate-500 mt-1">Organiza tus productos por categorías</p>
        </div>
        {!showForm && (
          <button
            onClick={openForm}
            className="flex items-center gap-2 bg-slate-900 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-sm hover:bg-slate-800 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nueva categoría
          </button>
        )}
      </div>

      {savedMessage && (
        <div className="mb-6 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
          {savedMessage}
        </div>
      )}

      {/* Formulario de nueva categoría */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Nueva categoría</h2>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
              aria-label="Cerrar formulario"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category-name" className="block text-sm font-medium text-slate-700 mb-1.5">
                Nombre *
              </label>
              <input
                id="category-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Niños"
                className={inputClass}
              />
              <p className="text-xs text-slate-500 mt-1">
                Dirección en la tienda: /{slugify(name) || "nombre"}
              </p>
            </div>
            <div>
              <label htmlFor="category-description" className="block text-sm font-medium text-slate-700 mb-1.5">
                Descripción
              </label>
              <input
                id="category-description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Ropa para niños de 2 a 12 años"
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              disabled={isSaving}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-slate-800 transition-colors disabled:opacity-60"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSaving ? "Guardando..." : "Crear categoría"}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium uppercase tracking-wide text-slate-500 bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-3">Nombre</th>
                  <th className="px-6 py-3">Slug</th>
                  <th className="px-6 py-3">Descripción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-sm text-slate-500">
                      <Tags className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                      No hay categorías
                    </td>
                  </tr>
                ) : (
                  categories.map((category: any) => {
                    const attrs = category.attributes || category;
                    return (
                      <tr key={category.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{attrs.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-500 font-mono">{attrs.slug}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">
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
