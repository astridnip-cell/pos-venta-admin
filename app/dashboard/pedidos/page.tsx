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
  { value: "pending", label: "Pendiente", color: "bg-yellow-400/10 text-yellow-400", icon: Clock },
  { value: "paid", label: "Pagado", color: "bg-cyan-400/10 text-cyan-400", icon: Check },
  { value: "shipped", label: "Enviado", color: "bg-purple-400/10 text-purple-400", icon: Truck },
  { value: "delivered", label: "Entregado", color: "bg-green-400/10 text-green-400", icon: Package },
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
        color: "bg-gray-100 text-gray-800",
        icon: Clock,
      }
    );
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white" style={{ textShadow: '0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 40px #00ffff' }}>Pedidos</h1>
        <p className="text-gray-400 mt-1">
          Gestiona los pedidos de tu tienda
        </p>
      </div>

      <div className="neon-card bg-[#111111] rounded-xl border border-[#1a1a1a]">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-400 border-b border-[#1a1a1a]">
                  <th className="px-6 py-3 font-medium">Pedido</th>
                  <th className="px-6 py-3 font-medium">Cliente</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Fecha</th>
                  <th className="px-6 py-3 font-medium">Estado</th>
                  <th className="px-6 py-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-cyan-400" />
                      No hay pedidos aún
                    </td>
                  </tr>
                ) : (
                  orders.map((order: any) => {
                    const attrs = order.attributes || order;
                    const statusConfig = getStatusConfig(attrs.statusOrder);
                    const StatusIcon = statusConfig.icon;
                    const statusGlow = statusConfig.color.includes('cyan') ? '#00ffff' : statusConfig.color.includes('green') ? '#39ff14' : statusConfig.color.includes('purple') ? '#bf00ff' : '#ffff00';

                    return (
                      <tr
                        key={order.id}
                        className="neon-table-row border-b border-[#1a1a1a] last:border-0"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-white">
                          #{attrs.orderNumber || order.id}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {attrs.customerName || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {attrs.customerEmail || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
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
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}
                              style={{ boxShadow: `0 0 8px ${statusGlow}40` }}
                            >
                              <StatusIcon className="h-3 w-3" />
                              {statusConfig.label}
                              <ChevronDown className="h-3 w-3" />
                            </button>

                            {openMenu === order.documentId && (
                              <div className="absolute top-full left-0 mt-1 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-lg z-10 min-w-[140px]" style={{ boxShadow: '0 0 20px rgba(0, 255, 255, 0.1)' }}>
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
                                      className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-300 hover:bg-[#333] hover:text-white first:rounded-t-lg last:rounded-b-lg"
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
                        <td className="px-6 py-4 text-sm font-medium text-white text-right">
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
