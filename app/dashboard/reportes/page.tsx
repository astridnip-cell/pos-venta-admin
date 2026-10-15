"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getProducts, getOrders } from "@/lib/strapi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  RadialBarChart,
  RadialBar,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  Package,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from "lucide-react";

const NEON_COLORS = {
  cyan: "#00f5ff",
  magenta: "#ff00ff",
  orange: "#ff8c00",
  green: "#00ff88",
  yellow: "#ffd700",
  red: "#ff4757",
  purple: "#a855f7",
  blue: "#3b82f6",
};

const PIE_COLORS = [
  NEON_COLORS.cyan,
  NEON_COLORS.magenta,
  NEON_COLORS.orange,
  NEON_COLORS.green,
  NEON_COLORS.purple,
  NEON_COLORS.blue,
];

const tooltipStyle = {
  backgroundColor: "#1a1a2e",
  border: "1px solid #333",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "12px",
};

export default function ReportesPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    async function loadData() {
      setIsLoading(true);
      try {
        const [productsRes, ordersRes] = await Promise.all([
          getProducts(token!, { pageSize: 100 }),
          getOrders(token!),
        ]);
        setProducts(productsRes?.data || []);
        setOrders(ordersRes?.data || []);
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [token]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  // Calcular métricas
  const totalRevenue = orders.reduce(
    (sum: number, order: any) => sum + (order.total || 0),
    0
  );
  const totalOrders = orders.length;
  const totalProducts = products.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Ventas por mes
  const salesByMonth = orders.reduce((acc: any, order: any) => {
    const date = new Date(order.createdAt);
    const month = date.toLocaleDateString("es-CO", { month: "short" });
    acc[month] = (acc[month] || 0) + (order.total || 0);
    return acc;
  }, {});

  const salesData = Object.entries(salesByMonth).map(([month, total]) => ({
    month,
    total: Number(total),
  }));

  // Productos por categoría
  const productsByCategory = products.reduce((acc: any, product: any) => {
    const category = product.category?.name || "Sin categoría";
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  const categoryData = Object.entries(productsByCategory).map(
    ([name, value]) => ({ name, value })
  );

  // Estado de pedidos
  const ordersByStatus = orders.reduce((acc: any, order: any) => {
    const status = order.statusOrder || "pending";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const statusData = Object.entries(ordersByStatus).map(([name, value]) => ({
    name,
    value,
  }));

  // Datos para gauge (porcentajes simulados basados en datos reales)
  const deliveredOrders = ordersByStatus["delivered"] || 0;
  const deliveryRate = totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0;

  const paidOrders = ordersByStatus["paid"] || 0;
  const paymentRate = totalOrders > 0 ? Math.round((paidOrders / totalOrders) * 100) : 0;

  const lowStockProducts = products.filter((p) => (p.stock ?? 0) < 10).length;
  const stockHealthRate = totalProducts > 0 ? Math.round(((totalProducts - lowStockProducts) / totalProducts) * 100) : 100;

  const gaugeData = [
    { name: "Entregados", value: deliveryRate, fill: NEON_COLORS.cyan },
    { name: "Pagados", value: paymentRate, fill: NEON_COLORS.green },
    { name: "Stock OK", value: stockHealthRate, fill: NEON_COLORS.magenta },
  ];

  // Top productos por ingresos
  const productRevenue = orders.reduce((acc: any, order: any) => {
    const items = typeof order.items === "string" ? JSON.parse(order.items) : order.items || [];
    items.forEach((item: any) => {
      acc[item.name] = (acc[item.name] || 0) + item.price * item.quantity;
    });
    return acc;
  }, {});

  const topProducts = Object.entries(productRevenue)
    .map(([name, revenue]) => ({ name, revenue: Number(revenue) }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const statCards = [
    {
      label: "Ingresos Totales",
      value: `$${totalRevenue.toLocaleString("es-CO")}`,
      change: "+12.5%",
      isPositive: true,
      icon: DollarSign,
      color: NEON_COLORS.cyan,
    },
    {
      label: "Pedidos",
      value: totalOrders.toString(),
      change: "+8.2%",
      isPositive: true,
      icon: Package,
      color: NEON_COLORS.magenta,
    },
    {
      label: "Productos",
      value: totalProducts.toString(),
      change: "+15.3%",
      isPositive: true,
      icon: TrendingUp,
      color: NEON_COLORS.green,
    },
    {
      label: "Promedio por Pedido",
      value: `$${Math.round(avgOrderValue).toLocaleString("es-CO")}`,
      change: "-2.1%",
      isPositive: false,
      icon: Users,
      color: NEON_COLORS.orange,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Reportes</h1>
        <p className="text-gray-400 mt-1">
          Análisis y métricas de tu tienda
        </p>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-5 hover:border-[#2a2a3e] transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}20` }}
                >
                  <Icon className="h-5 w-5" style={{ color: stat.color }} />
                </div>
                <div
                  className={`flex items-center gap-1 text-xs font-medium ${
                    stat.isPositive ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {stat.isPositive ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {stat.change}
                </div>
              </div>
              <p className="text-gray-400 text-xs mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Ventas por mes */}
        <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">
            Ventas por Mes
          </h3>
          {salesData.length === 0 ? (
            <p className="text-gray-500 text-center py-8 text-sm">
              No hay datos de ventas
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={NEON_COLORS.cyan} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={NEON_COLORS.cyan} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                <XAxis dataKey="month" stroke="#666" fontSize={11} />
                <YAxis stroke="#666" fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke={NEON_COLORS.cyan}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Ventas por categoría */}
        <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">
            Ventas por Categoría
          </h3>
          {categoryData.length === 0 ? (
            <p className="text-gray-500 text-center py-8 text-sm">
              No hay datos de categorías
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {categoryData.map((cat, index) => (
              <div key={cat.name} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                />
                <span className="text-xs text-gray-400">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Segunda fila de gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Gauges */}
        <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">
            Rendimiento
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="30%"
              outerRadius="90%"
              data={gaugeData}
              startAngle={180}
              endAngle={0}
            >
              <RadialBar
                dataKey="value"
                cornerRadius={10}
                background={{ fill: "#1e1e2e" }}
              />
              <Tooltip contentStyle={tooltipStyle} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {gaugeData.map((g) => (
              <div key={g.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: g.fill }}
                  />
                  <span className="text-xs text-gray-400">{g.name}</span>
                </div>
                <span className="text-xs font-medium text-white">
                  {g.value}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Estado de pedidos */}
        <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">
            Estado de Pedidos
          </h3>
          {statusData.length === 0 ? (
            <p className="text-gray-500 text-center py-8 text-sm">
              No hay datos de pedidos
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={statusData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                <XAxis type="number" stroke="#666" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#666" fontSize={11} width={80} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {statusData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top productos */}
        <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">
            Top Productos por Ingresos
          </h3>
          {topProducts.length === 0 ? (
            <p className="text-gray-500 text-center py-8 text-sm">
              No hay datos de productos
            </p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{
                      backgroundColor: `${PIE_COLORS[index % PIE_COLORS.length]}20`,
                      color: PIE_COLORS[index % PIE_COLORS.length],
                    }}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">
                      {product.name}
                    </p>
                    <div className="w-full bg-[#1e1e2e] rounded-full h-1.5 mt-1">
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          width: `${(product.revenue / topProducts[0].revenue) * 100}%`,
                          backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-medium text-gray-300">
                    ${product.revenue.toLocaleString("es-CO")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tendencia de ventas */}
      <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">
          Tendencia de Ventas
        </h3>
        {salesData.length === 0 ? (
          <p className="text-gray-500 text-center py-8 text-sm">
            No hay datos de ventas
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
              <XAxis dataKey="month" stroke="#666" fontSize={11} />
              <YAxis stroke="#666" fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="total"
                stroke={NEON_COLORS.magenta}
                strokeWidth={2}
                dot={{ fill: NEON_COLORS.magenta, strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, fill: NEON_COLORS.magenta }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
