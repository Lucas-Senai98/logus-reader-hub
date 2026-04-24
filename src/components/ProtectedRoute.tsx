import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { verifyAdminSession } from "@/lib/auth";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"checking" | "allowed" | "blocked">("checking");

  useEffect(() => {
    let active = true;

    async function check() {
      const ok = await verifyAdminSession();
      if (active) {
        setStatus(ok ? "allowed" : "blocked");
      }
    }

    check();

    return () => {
      active = false;
    };
  }, []);

  if (status === "checking") {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-foreground">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Verificando acesso administrativo...
        </div>
      </div>
    );
  }

  if (status === "blocked") {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
