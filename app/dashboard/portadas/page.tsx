"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Cover, createCover, deleteCover, getCovers, uploadImage } from "@/lib/strapi";
import {
  AlertCircle,
  CalendarDays,
  ImageIcon,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

const inputClass =
  "w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10";
const labelClass = "block text-sm font-medium text-slate-700 mb-1.5";

/* ---------- Fechas (hora de Colombia, semanas de lunes a domingo) ---------- */

/** Hoy en Colombia como "AAAA-MM-DD". */
function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
}

function toUTC(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function addDays(iso: string, days: number): string {
  const date = toUTC(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Lunes de la semana de una fecha. */
function mondayOf(iso: string): string {
  const day = toUTC(iso).getUTCDay(); // 0 = domingo
  return addDays(iso, -((day + 6) % 7));
}

function shortDate(iso: string, withYear = false): string {
  return toUTC(iso).toLocaleDateString("es-CO", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
  });
}

function weekLabel(monday: string): string {
  return `${shortDate(monday)} – ${shortDate(addDays(monday, 6), true)}`;
}

function imageSrc(url?: string | null): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : `${STRAPI_URL}${url}`;
}

export default function PortadasPage() {
  const { token } = useAuth();
  const [covers, setCovers] = useState<Cover[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // Formulario
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [weekDate, setWeekDate] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentMonday = mondayOf(todayISO());

  useEffect(() => {
    if (!token) return;
    async function load() {
      setIsLoading(true);
      setLoadError("");
      try {
        setCovers(await getCovers(token!));
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "No se pudieron cargar las portadas.");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [token, refreshKey]);

  // La que la tienda muestra ahora: la más reciente cuya semana ya empezó
  const liveCover = useMemo(
    () => covers.find((c) => c.weekStart <= currentMonday) ?? null,
    [covers, currentMonday]
  );

  // Primera semana libre desde la actual, para proponerla en el formulario
  const nextFreeMonday = useMemo(() => {
    const taken = new Set(covers.map((c) => c.weekStart));
    let monday = currentMonday;
    while (taken.has(monday)) monday = addDays(monday, 7);
    return monday;
  }, [covers, currentMonday]);

  const selectedMonday = weekDate ? mondayOf(weekDate) : "";

  const openForm = () => {
    setTitle("");
    setSubtitle("");
    setWeekDate(nextFreeMonday);
    setImageFile(null);
    setPreview(null);
    setFormError("");
    setMessage("");
    setShowForm(true);
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!title.trim()) return setFormError("Escribe el título de la portada.");
    if (!selectedMonday) return setFormError("Elige la semana en que se mostrará.");
    if (!imageFile) return setFormError("Selecciona la foto de la portada.");
    if (covers.some((c) => c.weekStart === selectedMonday)) {
      return setFormError("Ya hay una portada programada para esa semana. Elimínala o elige otra semana.");
    }

    setIsSaving(true);
    try {
      const uploaded = await uploadImage(token!, imageFile);
      await createCover(token!, {
        title: title.trim(),
        subtitle: subtitle.trim(),
        weekStart: selectedMonday,
        image: uploaded.id,
      });
      setShowForm(false);
      setMessage(`Portada "${title.trim()}" programada para la semana ${weekLabel(selectedMonday)}.`);
      setRefreshKey((k) => k + 1);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se pudo guardar la portada.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (cover: Cover) => {
    if (!confirm(`¿Eliminar la portada "${cover.title}" de la semana ${weekLabel(cover.weekStart)}?`)) return;
    try {
      await deleteCover(token!, cover.documentId);
      setMessage(`Portada "${cover.title}" eliminada.`);
      setRefreshKey((k) => k + 1);
    } catch (error) {
      alert(error instanceof Error ? error.message : "No se pudo eliminar la portada.");
    }
  };

  const statusOf = (cover: Cover) => {
    if (liveCover?.documentId === cover.documentId)
      return { label: "En la tienda ahora", className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" };
    if (cover.weekStart > currentMonday)
      return { label: "Programada", className: "bg-blue-50 text-blue-700 ring-blue-600/20" };
    return { label: "Ya pasó", className: "bg-slate-100 text-slate-600 ring-slate-500/20" };
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Portadas</h1>
          <p className="text-sm text-slate-500 mt-1">
            Foto principal de la página de inicio. Cambia sola cada lunes según la semana programada.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={openForm}
            className="flex items-center gap-2 bg-slate-900 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-sm hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            Nueva portada
          </button>
        )}
      </div>

      {/* Portada actual */}
      <div className="mb-6 bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col sm:flex-row gap-5 sm:items-center">
        <div className="w-full sm:w-40 aspect-[4/3] rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0">
          {liveCover?.image?.url ? (
            <img src={imageSrc(liveCover.image.url)!} alt={liveCover.title} className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="h-6 w-6 text-slate-400" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Esta semana · {weekLabel(currentMonday)}
          </p>
          {liveCover ? (
            <>
              <p className="text-lg font-semibold text-slate-900 mt-1">{liveCover.title}</p>
              {liveCover.subtitle && <p className="text-sm text-slate-600">{liveCover.subtitle}</p>}
              {liveCover.weekStart < currentMonday && (
                <p className="text-xs text-amber-700 mt-2">
                  No hay portada para esta semana: se sigue mostrando la de la semana {weekLabel(liveCover.weekStart)}.
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-600 mt-1">
              Todavía no hay portadas. La tienda muestra la foto del primer producto destacado.
            </p>
          )}
        </div>
      </div>

      {message && (
        <div className="mb-6 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
          {message}
        </div>
      )}

      {/* Formulario de nueva portada */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Nueva portada</h2>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
              aria-label="Cerrar formulario"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {formError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cover-title" className={labelClass}>Título *</label>
              <input
                id="cover-title"
                type="text"
                maxLength={80}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Nueva colección de verano"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="cover-subtitle" className={labelClass}>Subtítulo</label>
              <input
                id="cover-subtitle"
                type="text"
                maxLength={160}
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Ej: Hasta 30% de descuento esta semana"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="cover-week" className={labelClass}>Semana *</label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <input
                id="cover-week"
                type="date"
                value={weekDate}
                onChange={(e) => setWeekDate(e.target.value)}
                className={`${inputClass} sm:w-56`}
              />
              {selectedMonday && (
                <span className="flex items-center gap-2 text-sm text-slate-600">
                  <CalendarDays className="h-4 w-4 text-slate-400" />
                  Se mostrará del {weekLabel(selectedMonday)}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Puedes elegir cualquier día: la portada se programa para la semana completa (lunes a domingo).
            </p>
          </div>

          <div>
            <label className={labelClass}>Foto *</label>
            <div className="flex items-center gap-4">
              <div className="w-32 aspect-[4/3] rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                {preview ? (
                  <img src={preview} alt="Vista previa" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-slate-400" />
                )}
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImage}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-700 border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 transition-colors text-sm font-medium"
                >
                  <Upload className="h-4 w-4" />
                  {imageFile ? imageFile.name : "Seleccionar foto"}
                </button>
                <p className="text-xs text-slate-500 mt-2">Se ve mejor una foto vertical, de una persona o prenda.</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
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
              {isSaving ? "Guardando..." : "Programar portada"}
            </button>
          </div>
        </form>
      )}

      {/* Lista de portadas */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : loadError ? (
          <p className="px-6 py-10 text-center text-sm text-red-600">{loadError}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium uppercase tracking-wide text-slate-500 bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-3">Portada</th>
                  <th className="px-6 py-3">Semana</th>
                  <th className="px-6 py-3">Estado</th>
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {covers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-500">
                      <ImageIcon className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                      Aún no hay portadas. Usa “Nueva portada” para programar la primera.
                    </td>
                  </tr>
                ) : (
                  covers.map((cover) => {
                    const status = statusOf(cover);
                    return (
                      <tr key={cover.documentId} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-10 rounded-md bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                              {cover.image?.url ? (
                                <img src={imageSrc(cover.image.url)!} alt={cover.title} className="w-full h-full object-cover" />
                              ) : (
                                <ImageIcon className="h-4 w-4 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">{cover.title}</p>
                              {cover.subtitle && <p className="text-xs text-slate-500 truncate">{cover.subtitle}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                          {weekLabel(cover.weekStart)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDelete(cover)}
                            title="Eliminar portada"
                            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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
