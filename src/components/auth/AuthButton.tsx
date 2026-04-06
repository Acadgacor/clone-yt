'use client';

import { useState } from 'react';
import { useAuth, useUser } from '@/supabase';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { LogIn, LogOut, User as UserIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function AuthButton() {
  const auth = useAuth();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    if (isLoggingIn) return;

    setIsLoggingIn(true);

    try {
      const { data, error } = await auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/youtube.force-ssl',
          redirectTo: `${window.location.origin}/auth/callback?next=/setup`,
        },
      });

      if (error) {
        throw error;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error("Error saat login:", error);
      toast(error.message || "Tidak dapat masuk dengan Google.", "destructive");
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await auth.signOut();
      if (error) {
        throw error;
      }
      localStorage.removeItem('google_access_token');
      router.push('/login');
    } catch (error: any) {
      toast("Gagal untuk keluar.", "destructive");
    }
  };

  if (isUserLoading) {
    return (
      <Button variant="ghost" size="icon" disabled className="rounded-full bg-muted/50 border border-border h-9 w-9 md:h-10 md:w-10">
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  if (!user) {
    return (
      <Button
        onClick={handleLogin}
        variant="default"
        disabled={isLoggingIn}
        className="rounded-full h-9 md:h-10 px-4 md:px-6 font-bold text-xs tracking-widest uppercase"
      >
        {isLoggingIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
        Login
      </Button>
    );
  }

  const displayName = user.user_metadata?.full_name || user.user_metadata?.name || 'User';
  const email = user.email || '';
  const photoUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || '';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 md:h-10 md:w-10 p-0 overflow-hidden border border-primary/20">
          <Avatar className="h-full w-full">
            <AvatarImage src={photoUrl} alt={displayName} />
            <AvatarFallback className="bg-primary/10 text-primary">
              <UserIcon className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 liquid-glass rounded-xl mt-2 border-white/10 shadow-2xl p-2">
        <DropdownMenuLabel className="font-bold p-3">
          <div className="flex flex-col space-y-1">
            <p className="text-sm leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground font-medium">{email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/5" />
        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer rounded-lg p-3 font-bold uppercase text-[10px] tracking-widest hover:bg-destructive/10">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}