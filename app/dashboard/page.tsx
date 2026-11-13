"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getProducts, getOrders, isPaidOrder, orderTotal } from "@/lib/strapi";
import {
  Package,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  Loader2,
} from "lucide-react";

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  lowStockProducts: number;
}

// Colores de cada estado de pedido
const statusStyles: Record<string, { label: string; className: string }> = {
  pending: { label: "Pendiente", className: "bg-amber-50 text-amber-700 ring-amber-600/20" },
  paid: { label: "Pagado", className: "bg-blue-50 text-blue-700 ring-blue-600/20" },
  shipped: { label: "Enviado", className: "bg-violet-50 text-violet-700 ring-violet-600/20" },
  delivered: { label: "Entregado", className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
};

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

        // Ingresos = solo pedidos pagados
        const totalRevenue = orders
          .filter(isPaidOrder)
          .reduce((sum: number, order: any) => sum + orderTotal(order), 0);

        // Stock bajo = en o por debajo del stock mínimo de cada producto (10 si no tiene)
        const lowStockProducts = products.filter((p: any) => {
          const attrs = p.attributes || p;
          return Number(attrs.stock ?? 0) <= Number(attrs.stock_minimo ?? 10);
        }).length;

        setStats({
          totalProducts: productsRes?.meta?.pagination?.total ?? products.length,
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
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const statCards = [
    {
      label: "Total productos",
      value: stats.totalProducts,
      icon: Package,
      iconClass: "bg-indigo-50 text-indigo-600",
    },
    {
      label: "Pedidos",
      value: stats.totalOrders,
      icon: ShoppingCart,
      iconClass: "bg-blue-50 text-blue-600",
    },
    {
      label: "Ingresos (pagados)",
      value: `$${stats.totalRevenue.toLocaleString("es-CO")}`,
      icon: DollarSign,
      iconClass: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Stock bajo",
      value: stats.lowStockProducts,
      icon: AlertTriangle,
      iconClass: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Resumen general de tu tienda</p>
      </div>

      {/* Tarjetas de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <p className="text-2xl font-semibold text-slate-900 mt-1">{stat.value}</p>
                </div>
                <div
                  className={`w-11 h-11 rounded-lg flex items-center justify-center ${stat.iconClass}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pedidos recientes */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">Pedidos recientes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium uppercase tracking-wide text-slate-500 bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-3">Pedido</th>
                <th className="px-6 py-3">Cliente</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-500">
                    No hay pedidos aún
                  </td>
                </tr>
              ) : (
                recentOrders.map((order: any) => {
                  const attrs = order.attributes || order;
                  const status = statusStyles[attrs.statusOrder] || {
                    label: attrs.statusOrder || "Pendiente",
                    className: "bg-slate-100 text-slate-700 ring-slate-500/20",
                  };

                  return (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        #{attrs.orderNumber || order.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {attrs.customerName || "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${status.className}`}
                        >
                          {status.label}
                        </span>
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
      </div>
    </div>
  );
}
