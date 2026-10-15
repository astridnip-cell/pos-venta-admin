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
  { value: "pending", label: "Pendiente", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  { value: "paid", label: "Pagado", color: "bg-blue-100 text-blue-800", icon: Check },
  { value: "shipped", label: "Enviado", color: "bg-purple-100 text-purple-800", icon: Truck },
  { value: "delivered", label: "Entregado", color: "bg-green-100 text-green-800", icon: Package },
];

export default function PedidosPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState<number | null>(null);

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

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      await updateOrderStatus(token!, orderId, newStatus);
      setOrders((prev) =>
        prev.map((order) => {
          if (order.id === orderId) {
            return {
              ...order,
              attributes: {
                ...order.attributes,
                statusOrder: newStatus,
              },
            };
          }
          return order;
        })
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
        <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
        <p className="text-gray-500 mt-1">
          Gestiona los pedidos de tu tienda
        </p>
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
                      <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      No hay pedidos aún
                    </td>
                  </tr>
                ) : (
                  orders.map((order: any) => {
                    const attrs = order.attributes || order;
                    const statusConfig = getStatusConfig(attrs.statusOrder);
                    const StatusIcon = statusConfig.icon;

                    return (
                      <tr
                        key={order.id}
                        className="border-b last:border-0 hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          #{attrs.orderNumber || order.id}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {attrs.customerName || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {attrs.customerEmail || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
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
                                  openMenu === order.id ? null : order.id
                                )
                              }
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}
                            >
                              <StatusIcon className="h-3 w-3" />
                              {statusConfig.label}
                              <ChevronDown className="h-3 w-3" />
                            </button>

                            {openMenu === order.id && (
                              <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg z-10 min-w-[140px]">
                                {statusOptions.map((option) => {
                                  const OptionIcon = option.icon;
                                  return (
                                    <button
                                      key={option.value}
                                      onClick={() =>
                                        handleStatusChange(
                                          order.id,
                                          option.value
                                        )
                                      }
                                      className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
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
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
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
