'use client';

import { useAuth, useUser } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
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

export default function AuthButton() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({
        title: "Login Successful",
        description: "Welcome to CineView!",
      });
    } catch (error: any) {
      console.error("Login failed:", error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Could not sign in with Google.",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Logged Out",
        description: "See you again soon!",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Logout Error",
        description: "Failed to sign out.",
      });
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
        className="rounded-full h-9 md:h-10 px-4 md:px-6 font-bold text-xs tracking-widest uppercase"
      >
        <LogIn className="mr-2 h-4 w-4" />
        Login
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 md:h-10 md:w-10 p-0 overflow-hidden border border-primary/20">
          <Avatar className="h-full w-full">
            <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
            <AvatarFallback className="bg-primary/10 text-primary">
              <UserIcon className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 liquid-glass mt-2">
        <DropdownMenuLabel className="font-bold">
          <div className="flex flex-col space-y-1">
            <p className="text-sm leading-none">{user.displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
