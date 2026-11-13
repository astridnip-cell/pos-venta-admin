"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { login, checkPanelAccess, AuthResponse } from "@/lib/strapi";

interface AuthContextType {
  token: string | null;
  user: AuthResponse["user"] | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthResponse["user"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Al cargar, recuperar la sesión guardada y confirmar que sigue siendo de un Administrador
  useEffect(() => {
    const clearSaved = () => {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
    };

    async function restoreSession() {
      const savedToken = localStorage.getItem("admin_token");
      const savedUser = localStorage.getItem("admin_user");

      if (savedToken && savedUser) {
        try {
          if (await checkPanelAccess(savedToken)) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
          } else {
            clearSaved(); // sesión vencida o de una cuenta sin rol Administrador
          }
        } catch {
          // Backend no disponible: se conserva la sesión; las páginas mostrarán el error al cargar datos
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      }
      setIsLoading(false);
    }

    restoreSession();
  }, []);

  const handleLogin = async (identifier: string, password: string) => {
    const response = await login(identifier, password);

    // Solo las cuentas con rol Administrador pueden entrar al panel
    const allowed = await checkPanelAccess(response.jwt);
    if (!allowed) {
      throw new Error("Esta cuenta no tiene acceso al panel de administración.");
    }

    // Guardar en localStorage para persistencia
    localStorage.setItem("admin_token", response.jwt);
    localStorage.setItem("admin_user", JSON.stringify(response.user));

    setToken(response.jwt);
    setUser(response.user);
    router.push("/dashboard");
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    setToken(null);
    setUser(null);
    router.push("/");
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isLoading,
        login: handleLogin,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
}
