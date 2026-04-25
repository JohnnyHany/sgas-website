"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AdminUser {
  email: string;
  name: string;
}

interface AdminContextType {
  admin: AdminUser | null;
  loading: boolean;
  isAdmin: boolean;
  refresh: () => void;
}

const AdminContext = createContext<AdminContextType>({
  admin: null,
  loading: true,
  isAdmin: false,
  refresh: () => {},
});

export function AdminProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setAdmin(data.admin);
      } else {
        setAdmin(null);
      }
    } catch {
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { checkAuth(); }, []);

  return (
    <AdminContext.Provider value={{ admin, loading, isAdmin: !!admin, refresh: checkAuth }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}
