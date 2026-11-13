"use client";

import { useEffect, useRef, useState } from "react";
import {
  X,
  Loader2,
  Upload,
  Image as ImageIcon,
  AlertCircle,
} from "lucide-react";
import { createProduct, updateProduct, uploadImage } from "@/lib/strapi";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

interface Category {
  /** documentId de la categoría (Strapi 5) */
  id: string;
  name: string;
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  token: string;
  /** Producto a editar. Si es null, el modal crea uno nuevo. */
  product: any | null;
  categories: Category[];
}

/** Normaliza los atributos de un producto (Strapi puede devolverlos planos o anidados). */
function getAttrs(product: any) {
  return product?.attributes || product || {};
}

/** Obtiene la URL de la imagen manejando ambos formatos de Strapi (plano y anidado). */
function getImageUrl(attrs: any) {
  const image = attrs?.image;
  const url = image?.url || image?.data?.url;
  if (!url) return null;
  return url.startsWith("http") ? url : `${STRAPI_URL}${url}`;
}

function getImageId(attrs: any) {
  return attrs?.image?.id ?? attrs?.image?.data?.id ?? null;
}

/** Convierte "XS, S, M" en ["XS", "S", "M"]. */
function parseList(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

/** Normaliza un campo JSON (array o string) a texto separado por comas. */
function toList(value: any): string {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.join(", ");
      } catch {
        /* no es JSON válido, se usa tal cual */
      }
    }
    return value;
  }
  return "";
}

const inputClass =
  "w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10";

const labelClass = "block text-sm font-medium text-slate-700 mb-1.5";

export function ProductFormModal({
  isOpen,
  onClose,
  onSaved,
  token,
  product,
  categories,
}: ProductFormModalProps) {
  const isEditing = !!product;
  const attrs = getAttrs(product);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [stock, setStock] = useState("");
  const [featured, setFeatured] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [sizesInput, setSizesInput] = useState("");
  const [colorsInput, setColorsInput] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageId, setExistingImageId] = useState<number | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inicializar el formulario cada vez que se abre el modal
  useEffect(() => {
    if (!isOpen) return;

    setName(attrs.name || "");
    setDescription(attrs.description || "");
    setPrice(attrs.price != null ? String(attrs.price) : "");
    setOriginalPrice(
      attrs.originalPrice != null ? String(attrs.originalPrice) : ""
    );
    setStock(attrs.stock != null ? String(attrs.stock) : "");
    setFeatured(!!attrs.featured);
    setCategoryId(attrs.category?.documentId ?? "");
    setSizesInput(toList(attrs.sizes));
    setColorsInput(toList(attrs.colors));

    setExistingImageId(getImageId(attrs));
    setImagePreview(getImageUrl(attrs));
    setImageFile(null);
    setError("");
  }, [isOpen, product]);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(getImageUrl(attrs));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("El nombre del producto es obligatorio");
      return;
    }
    if (!price || Number(price) <= 0) {
      setError("El precio debe ser mayor a 0");
      return;
    }
    if (!isEditing && !imageFile && !existingImageId) {
      setError("Debes seleccionar una imagen para el producto");
      return;
    }

    setIsSubmitting(true);
    try {
      // Subir nueva imagen (si se seleccionó una)
      let imageId = existingImageId;
      if (imageFile) {
        const uploaded = await uploadImage(token, imageFile);
        imageId = uploaded.id;
      }

      const payload: Record<string, any> = {
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : null,
        stock: stock ? Number(stock) : 0,
        featured,
        sizes: parseList(sizesInput),
        colors: parseList(colorsInput),
        image: imageId,
        // Strapi 5 enlaza relaciones por documentId; null quita la categoría
        category: categoryId || null,
      };

      if (isEditing) {
        await updateProduct(token, product.documentId, payload);
      } else {
        await createProduct(token, payload);
      }

      onSaved();
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al guardar");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Fondo oscuro */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Contenido */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-xl">
        {/* Encabezado */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            {isEditing ? "Editar producto" : "Nuevo producto"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Nombre */}
          <div>
            <label className={labelClass}>Nombre del producto *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Vestido Casual Floral"
              className={inputClass}
            />
          </div>

          {/* Descripción */}
          <div>
            <label className={labelClass}>Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe el producto..."
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Precios */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Precio *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="45000"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Precio original</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="60000"
                className={inputClass}
              />
              <p className="text-xs text-slate-500 mt-1">
                Se usa para mostrar el descuento. Déjalo vacío si no aplica.
              </p>
            </div>
          </div>

          {/* Stock y destacado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Stock (unidades)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="0"
                className={inputClass}
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-4 h-4 accent-slate-900"
                />
                <span className="text-sm text-slate-700">
                  Producto destacado
                </span>
              </label>
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label className={labelClass}>Categoría</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={inputClass}
            >
              <option value="">Sin categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tallas y colores */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Tallas</label>
              <input
                type="text"
                value={sizesInput}
                onChange={(e) => setSizesInput(e.target.value)}
                placeholder="XS, S, M, L, XL"
                className={inputClass}
              />
              <p className="text-xs text-slate-500 mt-1">
                Separa con comas.
              </p>
            </div>
            <div>
              <label className={labelClass}>Colores</label>
              <input
                type="text"
                value={colorsInput}
                onChange={(e) => setColorsInput(e.target.value)}
                placeholder="Negro, Blanco, Azul"
                className={inputClass}
              />
              <p className="text-xs text-slate-500 mt-1">
                Separa con comas.
              </p>
            </div>
          </div>

          {/* Imagen */}
          <div>
            <label className={labelClass}>
              Imagen {!isEditing && "*"}
            </label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Vista previa"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="h-6 w-6 text-slate-400" />
                )}
              </div>
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-700 border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 transition-colors text-sm font-medium"
                >
                  <Upload className="h-4 w-4" />
                  {imageFile ? imageFile.name : "Seleccionar imagen"}
                </button>
                {isEditing && !imageFile && (
                  <p className="text-xs text-slate-500 mt-2">
                    Deja la imagen actual si no seleccionas una nueva.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-slate-800 transition-colors disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting
                ? "Guardando..."
                : isEditing
                ? "Guardar cambios"
                : "Crear producto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
