import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { isAuthenticated, refreshToken } from '../../lib/auth';

/**
 * Hook to check if the user is authenticated and redirect if not
 * @param redirectTo Path to redirect to if not authenticated
 * @returns Object containing authentication state
 */
export function useAuth(redirectTo: string = '/login') {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      setLoading(true);
      
      // Check if user is authenticated
      let authStatus = isAuthenticated();
      
      // If not authenticated, try to refresh the token
      if (!authStatus) {
        const refreshed = await refreshToken();
        authStatus = refreshed;
      }
      
      // If still not authenticated, redirect to login
      if (!authStatus) {
        router.push(redirectTo);
      } else {
        setAuthenticated(true);
      }
      
      setLoading(false);
    }
    
    checkAuth();
  }, [router, redirectTo]);
  
  return { loading, authenticated };
}

/**
 * Higher-order component to protect routes that require authentication
 * @param Component The component to wrap with authentication protection
 * @param redirectTo Path to redirect to if not authenticated
 * @returns Protected component
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  redirectTo: string = '/login'
): React.FC<P> {
  const ProtectedRoute: React.FC<P> = (props) => {
    const { loading, authenticated } = useAuth(redirectTo);
    
    if (loading) {
      return <div>Loading...</div>;
    }
    
    if (!authenticated) {
      return null; // Will redirect in useAuth hook
    }
    
    return <Component {...props} />;
  };
  
  return ProtectedRoute;
}