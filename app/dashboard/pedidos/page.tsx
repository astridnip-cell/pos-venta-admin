"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getOrders, updateOrderStatus } from "@/lib/strapi";
import {
  Loader2,
  ShoppingCart,
  ChevronDown,
  Check,
  Truck,
  Package,
  Clock,
} from "lucide-react";

const statusOptions = [
  { value: "pending", label: "Pendiente", color: "bg-amber-50 text-amber-700 ring-amber-600/20", icon: Clock },
  { value: "paid", label: "Pagado", color: "bg-blue-50 text-blue-700 ring-blue-600/20", icon: Check },
  { value: "shipped", label: "Enviado", color: "bg-violet-50 text-violet-700 ring-violet-600/20", icon: Truck },
  { value: "delivered", label: "Entregado", color: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", icon: Package },
];

export default function PedidosPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    async function loadOrders() {
      setIsLoading(true);
      try {
        const res = await getOrders(token!);
        setOrders(res?.data || []);
      } catch (error) {
        console.error("Error cargando pedidos:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadOrders();
  }, [token]);

  const handleStatusChange = async (documentId: string, newStatus: string) => {
    try {
      await updateOrderStatus(token!, documentId, newStatus);
      // En Strapi 5 los datos vienen planos (sin "attributes")
      setOrders((prev) =>
        prev.map((order) =>
          order.documentId === documentId
            ? { ...order, statusOrder: newStatus }
            : order
        )
      );
      setOpenMenu(null);
    } catch (error) {
      alert("Error al actualizar estado del pedido");
    }
  };

  const getStatusConfig = (status: string) => {
    return (
      statusOptions.find((s) => s.value === status) || {
        value: status,
        label: status,
        color: "bg-slate-100 text-slate-700 ring-slate-500/20",
        icon: Clock,
      }
    );
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Pedidos</h1>
        <p className="text-sm text-slate-500 mt-1">Gestiona los pedidos de tu tienda</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium uppercase tracking-wide text-slate-500 bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-3">Pedido</th>
                  <th className="px-6 py-3">Cliente</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Fecha</th>
                  <th className="px-6 py-3">Estado</th>
                  <th className="px-6 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-10 text-center text-sm text-slate-500"
                    >
                      <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                      No hay pedidos aún
                    </td>
                  </tr>
                ) : (
                  orders.map((order: any) => {
                    const attrs = order.attributes || order;
                    const statusConfig = getStatusConfig(attrs.statusOrder);
                    const StatusIcon = statusConfig.icon;

                    return (
                      <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">
                          #{attrs.orderNumber || order.id}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {attrs.customerName || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {attrs.customerEmail || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {attrs.createdAt
                            ? new Date(attrs.createdAt).toLocaleDateString(
                                "es-CO"
                              )
                            : "N/A"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="relative">
                            <button
                              onClick={() =>
                                setOpenMenu(
                                  openMenu === order.documentId ? null : order.documentId
                                )
                              }
                              className={`inline-flex items-center gap-1.5 whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${statusConfig.color}`}
                            >
                              <StatusIcon className="h-3 w-3" />
                              {statusConfig.label}
                              <ChevronDown className="h-3 w-3" />
                            </button>

                            {openMenu === order.documentId && (
                              <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 min-w-[150px] py-1">
                                {statusOptions.map((option) => {
                                  const OptionIcon = option.icon;
                                  return (
                                    <button
                                      key={option.value}
                                      onClick={() =>
                                        handleStatusChange(
                                          order.documentId,
                                          option.value
                                        )
                                      }
                                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                    >
                                      <OptionIcon className="h-3 w-3" />
                                      {option.label}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-900 text-right">
                          ${(attrs.total || 0).toLocaleString("es-CO")}
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
