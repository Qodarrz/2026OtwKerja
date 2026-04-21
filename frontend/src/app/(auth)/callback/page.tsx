'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      const handleAuth = async () => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            login(token, userData);
            router.push('/');
          } else {
            console.error('Failed to fetch profile');
            router.push('/login?error=oauth_failed');
          }
        } catch (err) {
          console.error('OAuth callback error:', err);
          router.push('/login?error=oauth_failed');
        }
      };

      handleAuth();
    } else {
      router.push('/login');
    }
  }, [searchParams, login, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-white">
      <div className="relative">
        <div className="absolute inset-0 bg-blue-600/20 blur-[60px] rounded-full" />
        <Loader2 className="w-12 h-12 animate-spin text-blue-500 relative z-10" />
      </div>
      <h2 className="mt-6 text-xl font-medium text-gray-300">Authenticating...</h2>
      <p className="text-gray-500 mt-2">Almost there, setting up your session</p>
    </div>
  );
}
