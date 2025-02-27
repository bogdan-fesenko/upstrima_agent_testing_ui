/**
 * Authentication utilities for the application
 */
import { isAuthenticated as apiIsAuthenticated, refreshToken as apiRefreshToken } from './api';

/**
 * Check if the user is authenticated
 * @returns Boolean indicating if the user is authenticated
 */
export function isAuthenticated(): boolean {
  return apiIsAuthenticated();
}

/**
 * Refresh the authentication token
 * @returns Promise that resolves to true if token was refreshed successfully
 */
export async function refreshToken(): Promise<boolean> {
  const result = await apiRefreshToken();
  return result !== null;
}

/**
 * Function to check if a route is protected and requires authentication
 * Use this on server-side to protect API routes or server components
 * @param req Request object
 * @param redirectTo Path to redirect to if not authenticated
 * @returns Redirect object or null if authenticated
 */
export async function protectServerRoute(req: Request, redirectTo: string = '/login') {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return Response.redirect(new URL(redirectTo, req.url));
  }
  
  // Additional token validation could be done here
  
  return null;
}