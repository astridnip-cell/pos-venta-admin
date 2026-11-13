"use client";

import { AdminSidebar } from "@/components/admin-sidebar";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  // Reportes conserva su diseño oscuro original; el resto del panel usa el tema claro
  const isReports = pathname?.startsWith("/dashboard/reportes");

  // Sin sesión de Administrador: volver al login (en un efecto, no durante el render)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/");
  }, [isLoading, isAuthenticated, router]);

  // Mientras carga la autenticación
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div
      className={
        isReports ? "min-h-screen bg-[#0a0a0a] text-white" : "min-h-screen bg-slate-50 text-slate-900"
      }
    >
      <AdminSidebar />
      <main className="ml-64 p-8">{children}</main>
    </div>
  );
}
