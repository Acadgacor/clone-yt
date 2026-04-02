import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';

interface UseUserVideoReturn {
  user: User | null;
  videoId: string | null;
  isLoading: boolean;
}

export function useUserVideo(): UseUserVideoReturn {
  const supabase = createClient();
  const router = useRouter();
  
  const [user, setUser] = useState<User | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Auth state listener
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Fetch user's personal video from 'users' table
  useEffect(() => {
    const fetchUserVideo = async () => {
      setIsLoading(true);
      
      // 1. Dapatkan user yang sedang login
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Jika belum login, redirect ke login
        router.push('/login');
        return;
      }

      // 2. Ambil data youtube_video_id dari tabel 'users'
      const { data, error } = await supabase
        .from('users')
        .select('youtube_video_id')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
      } 
      
      // 3. Jika user punya video, tampilkan. Jika tidak, arahkan ke /setup
      if (data && data.youtube_video_id) {
        setVideoId(data.youtube_video_id);
        setIsLoading(false);
      } else {
        // Redirect ke setup jika belum punya video
        router.push('/setup');
        return; // Stop execution, jangan setIsLoading(false)
      }
    };

    fetchUserVideo();
  }, [supabase, router]);

  return { user, videoId, isLoading };
}
