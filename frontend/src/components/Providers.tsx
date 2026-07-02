"use client";

import { AuthProvider } from "@/context/AuthContext";
import { I18nProvider } from "@/context/I18nContext";
import { MessagesProvider } from "@/context/MessagesContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ReactNode, useEffect } from "react";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    localStorage.removeItem("theme");
  }, []);

  return (
    <I18nProvider>
      <AuthProvider>
        <MessagesProvider>
          <TooltipProvider delay={200}>{children}</TooltipProvider>
        </MessagesProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
