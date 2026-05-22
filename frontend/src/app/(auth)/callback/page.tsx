'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth.service';
import { Loader2 } from 'lucide-react';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const token = searchParams.get('token');
        const userData = await authService.getProfile(token || undefined);
        login(token || '', userData); 
        
        const internalRoles = ['ADMIN', 'DOCUMENT_VALIDATOR', 'FIELD_INSPECTOR', 'LEGALIZER'];
        const isInternal = userData.roles.some((role: any) => internalRoles.includes(role));

        if (!userData.verify_gmail) {
          router.push(`/verify-otp?email=${encodeURIComponent(userData.email)}`);
        } else if (isInternal) {
          router.push('/dashboard');
        } else {
          router.push('/submit');
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        router.push('/login?error=oauth_failed');
      }
    };

    handleAuth();
  }, [login, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-primary-foreground">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full" />
        <Loader2 className="w-12 h-12 animate-spin text-primary relative z-10" />
      </div>
      <h2 className="mt-6 text-xl font-medium text-gray-300">Authenticating...</h2>
      <p className="text-muted-foreground mt-2">Almost there, setting up your session</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-primary-foreground">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full" />
          <Loader2 className="w-12 h-12 animate-spin text-primary relative z-10" />
        </div>
        <h2 className="mt-6 text-xl font-medium text-gray-300">Loading...</h2>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
