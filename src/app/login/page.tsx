'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clapperboard } from 'lucide-react';
import { useUser } from '@/firebase';
import AuthButton from '@/components/auth/AuthButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // If loading is done and we have a user, redirect to home.
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  // While loading, it's better to show nothing to prevent flashes of content.
  if (isUserLoading || user) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 flex items-center gap-3 text-center">
        <Clapperboard className="h-12 w-12 text-primary" />
        <div>
          <h1 className="text-4xl font-bold font-headline tracking-tighter">CineView</h1>
          <p className="text-muted-foreground">Your personal web theater.</p>
        </div>
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Welcome</CardTitle>
          <CardDescription>Sign in to continue to your CineView.</CardDescription>
        </CardHeader>
        <CardContent>
          <AuthButton />
        </CardContent>
      </Card>
    </div>
  );
}
