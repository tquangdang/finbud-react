import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';


// Redirect protected pages to login if not authenticated
export default function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const loading = useAuthStore((s) => s.loading);

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" />;
  return children;
}