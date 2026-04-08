import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import LoadingScreen from './LoadingScreen';

export default function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const loading = useAuthStore((s) => s.loading);

  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" />;
  return children;
}