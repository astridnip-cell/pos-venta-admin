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
      color: "text-cyan-400",
      bg: "bg-cyan-400/10",
      border: "border-cyan-400/30",
    },
    {
      label: "Pedidos",
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: "text-green-400",
      bg: "bg-green-400/10",
      border: "border-green-400/30",
    },
    {
      label: "Ingresos Totales",
      value: `$${stats.totalRevenue.toLocaleString("es-CO")}`,
      icon: DollarSign,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
      border: "border-purple-400/30",
    },
    {
      label: "Stock Bajo",
      value: stats.lowStockProducts,
      icon: AlertTriangle,
      color: "text-orange-400",
      bg: "bg-orange-400/10",
      border: "border-orange-400/30",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white" style={{ textShadow: '0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 40px #00ffff' }}>Dashboard</h1>
        <p className="text-gray-400 mt-1">
          Resumen general de tu tienda
        </p>
      </div>

      {/* Tarjetas de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const glowColor = stat.color === 'text-cyan-400' ? '#00ffff' : stat.color === 'text-green-400' ? '#39ff14' : stat.color === 'text-purple-400' ? '#bf00ff' : '#ff6600';
          return (
            <div
              key={stat.label}
              className={`neon-card bg-[#111111] rounded-xl border ${stat.border} p-6`}
              style={{ 
                boxShadow: `0 0 15px ${glowColor}20, inset 0 0 15px ${glowColor}05`,
                animation: 'float 3s ease-in-out infinite'
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">{stat.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${stat.color}`} style={{ textShadow: `0 0 10px ${glowColor}, 0 0 20px ${glowColor}` }}>
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`w-12 h-12 rounded-lg ${stat.bg} flex items-center justify-center`}
                  style={{ boxShadow: `0 0 15px ${glowColor}40, inset 0 0 10px ${glowColor}20` }}
                >
                  <Icon className={`h-6 w-6 ${stat.color}`} style={{ filter: `drop-shadow(0 0 5px ${glowColor})` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pedidos recientes */}
      <div className="neon-card bg-[#111111] rounded-xl border border-[#1a1a1a]">
        <div className="p-6 border-b border-[#1a1a1a]">
          <h2 className="text-lg font-semibold text-white" style={{ textShadow: '0 0 8px #00ffff, 0 0 16px #00ffff' }}>
            Pedidos Recientes
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-400 border-b border-[#1a1a1a]">
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
                    pending: "bg-yellow-400/10 text-yellow-400",
                    paid: "bg-cyan-400/10 text-cyan-400",
                    shipped: "bg-purple-400/10 text-purple-400",
                    delivered: "bg-green-400/10 text-green-400",
                  };

                  return (
                    <tr key={order.id} className="border-b border-[#1a1a1a] last:border-0 hover:bg-[#1a1a1a]/50">
                      <td className="px-6 py-4 text-sm font-medium text-white">
                        #{attrs.orderNumber || order.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {attrs.customerName || "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            statusColors[attrs.statusOrder] ||
                            "bg-gray-400/10 text-gray-400"
                          }`}
                        >
                          {attrs.statusOrder || "pending"}
                        </span>
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
      </div>
    </div>
  );
}
