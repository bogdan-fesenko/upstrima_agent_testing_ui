'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { useAuth } from '../../lib/auth-context';

export function Header() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-gray-900">AI Agent Platform</span>
            </Link>
            
            <nav className="ml-6 flex space-x-4">
              <Link href="/" className="px-3 py-2 rounded-md text-sm font-medium text-gray-900 hover:bg-gray-100">
                Home
              </Link>
              <Link href="/agents" className="px-3 py-2 rounded-md text-sm font-medium text-gray-900 hover:bg-gray-100">
                Agents
              </Link>
              <Link href="/chats" className="px-3 py-2 rounded-md text-sm font-medium text-gray-900 hover:bg-gray-100">
                Chats
              </Link>
              <Link href="/files" className="px-3 py-2 rounded-md text-sm font-medium text-gray-900 hover:bg-gray-100">
                Files
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center">
            {loading ? (
                <div className="text-sm text-gray-500">Loading...</div>
              ) : user ? (
                <div className="flex items-center space-x-4">
                  <div className="text-sm font-medium text-gray-700">
                    {user.name || user.email || 'User'}
                  </div>
                  <Button variant="outline" onClick={handleLogout}>
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => router.push('/login')}>
                    Login
                  </Button>
                  <Button onClick={() => router.push('/signup')}>
                    Sign Up
                  </Button>
                </div>
              )}
          </div>
        </div>
      </div>
    </header>
  );
}