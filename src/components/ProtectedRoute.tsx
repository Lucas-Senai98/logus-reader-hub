import { Navigate } from "react-router-dom";
import { isAdminAuthed } from "@/lib/auth";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isAdminAuthed()) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
}