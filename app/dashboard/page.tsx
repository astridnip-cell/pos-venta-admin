"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getProducts, getOrders, getCategories } from "@/lib/strapi";
import {
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Loader2,
} from "lucide-react";

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  lowStockProducts: number;
}

export default function DashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    lowStockProducts: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    async function loadDashboard() {
      try {
        const [productsRes, ordersRes] = await Promise.all([
          getProducts(token!, { pageSize: 100 }),
          getOrders(token!),
        ]);

        const products = productsRes?.data || [];
        const orders = ordersRes?.data || [];

        const totalRevenue = orders.reduce(
          (sum: number, order: any) => sum + (order.attributes?.total || order.total || 0),
          0
        );

        const lowStockProducts = products.filter(
          (p: any) => (p.attributes?.stock ?? p.stock ?? 0) < 5
        ).length;

        setStats({
          totalProducts: products.length,
          totalOrders: orders.length,
          totalRevenue,
          lowStockProducts,
        });

        setRecentOrders(orders.slice(0, 5));
      } catch (error) {
        console.error("Error cargando dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, [token]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Productos",
      value: stats.totalProducts,
      icon: Package,
      color: "bg-blue-500",
    },
    {
      label: "Pedidos",
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: "bg-green-500",
    },
    {
      label: "Ingresos Totales",
      value: `$${stats.totalRevenue.toLocaleString("es-CO")}`,
      icon: DollarSign,
      color: "bg-purple-500",
    },
    {
      label: "Stock Bajo",
      value: stats.lowStockProducts,
      icon: AlertTriangle,
      color: "bg-orange-500",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Resumen general de tu tienda
        </p>
      </div>

      {/* Tarjetas de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl border p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pedidos recientes */}
      <div className="bg-white rounded-xl border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Pedidos Recientes
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="px-6 py-3 font-medium">Pedido</th>
                <th className="px-6 py-3 font-medium">Cliente</th>
                <th className="px-6 py-3 font-medium">Estado</th>
                <th className="px-6 py-3 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No hay pedidos aún
                  </td>
                </tr>
              ) : (
                recentOrders.map((order: any) => {
                  const attrs = order.attributes || order;
                  const statusColors: Record<string, string> = {
                    pending: "bg-yellow-100 text-yellow-800",
                    paid: "bg-blue-100 text-blue-800",
                    shipped: "bg-purple-100 text-purple-800",
                    delivered: "bg-green-100 text-green-800",
                  };

                  return (
                    <tr key={order.id} className="border-b last:border-0">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        #{attrs.orderNumber || order.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {attrs.customerName || "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            statusColors[attrs.statusOrder] ||
                            "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {attrs.statusOrder || "pending"}
                        </span>
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
      </div>
    </div>
  );
}
