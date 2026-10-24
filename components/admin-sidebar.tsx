"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tags,
  BarChart3,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/productos", label: "Productos", icon: Package },
  { href: "/dashboard/pedidos", label: "Pedidos", icon: ShoppingCart },
  { href: "/dashboard/categorias", label: "Categorías", icon: Tags },
  { href: "/dashboard/reportes", label: "Reportes", icon: BarChart3 },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0d0d0d] border-r border-[#1a1a1a] flex flex-col" style={{ boxShadow: '4px 0 20px rgba(0, 255, 255, 0.05)' }}>
      {/* Logo */}
      <div className="p-6 border-b border-[#1a1a1a]">
        <h1 className="text-xl font-bold neon-text-cyan" style={{ animation: 'neon-pulse 2s ease-in-out infinite' }}>Velora Admin</h1>
        <p className="text-xs text-gray-500 mt-1">Panel de administración</p>
      </div>

      {/* Navegación */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-cyan-400/10 text-cyan-400 border border-cyan-400/30"
                  : "text-gray-400 hover:bg-[#1a1a1a] hover:text-cyan-300"
              }`}
              style={isActive ? { 
                textShadow: '0 0 8px #00ffff',
                boxShadow: '0 0 15px rgba(0, 255, 255, 0.2), inset 0 0 15px rgba(0, 255, 255, 0.05)'
              } : {}}
            >
              <Icon className="h-4 w-4" style={isActive ? { filter: 'drop-shadow(0 0 3px #00ffff)' } : {}} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Usuario y logout */}
      <div className="p-4 border-t border-[#1a1a1a]">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-cyan-400/20 flex items-center justify-center" style={{ boxShadow: '0 0 10px rgba(0, 255, 255, 0.3)' }}>
            <span className="text-xs font-medium text-cyan-400">
              {user?.username?.charAt(0).toUpperCase() || "A"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.username || "Admin"}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email || ""}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-400/10 transition-colors"
          style={{ textShadow: '0 0 5px #ff4757' }}
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
