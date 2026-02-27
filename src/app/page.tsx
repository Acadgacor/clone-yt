'use client';

import { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
import { Clapperboard, ThumbsUp, Share2, Play, Pause, Maximize, Minimize, Settings, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function Home() {
  const { toast } = useToast();
  const playerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const firestore = useFirestore();

  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Fetch theater config from Firestore
  const configRef = useMemoFirebase(() => doc(firestore, 'settings', 'theater'), [firestore]);
  const { data: config, isLoading } = useDoc<any>(configRef);

  // Default video ID fallback
  const videoId = config?.videoId || 'zWMj0Vu-z2I';
  const title = config?.title || 'CineView Featured Content';
  const description = 'Experience the best of cinematic content, curated for enthusiasts.';
  
  const onPlayerReady = (event: any) => {
    setIsPlayerReady(true);
  };

  const onPlayerStateChange = (event: any) => {
    if ((window as any).YT && event.data === (window as any).YT.PlayerState.PLAYING) {
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    const setupPlayer = () => {
        if (videoId && document.getElementById('youtube-player')) {
            // Destroy existing player if any to avoid duplicates
            if (playerRef.current && typeof playerRef.current.destroy === 'function') {
              try {
                playerRef.current.destroy();
              } catch (e) {
                console.warn("Error destroying player:", e);
              }
            }

            playerRef.current = new (window as any).YT.Player('youtube-player', {
                videoId: videoId,
                playerVars: {
                    autoplay: 0,
                    controls: 0,
                    modestbranding: 1,
                    rel: 0,
                    iv_load_policy: 3,
                    showinfo: 0,
                    disablekb: 1,
                },
                events: {
                    onReady: onPlayerReady,
                    onStateChange: onPlayerStateChange,
                },
            });
        }
    };

    if (videoId) {
        if (!(window as any).YT || !(window as any).YT.Player) {
            (window as any).onYouTubeIframeAPIReady = setupPlayer;
        } else {
            setupPlayer();
        }
    }

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [videoId]);

  const resetInactivityTimeout = () => {
    if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
    inactivityTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const handleMouseMove = () => {
    setShowControls(true);
    resetInactivityTimeout();
  };

  const handleTogglePlay = () => {
    if (!isPlayerReady || !playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
    setShowControls(true);
    resetInactivityTimeout();
  };
  
  const handleToggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!isFullscreen) {
      playerContainerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied!",
        description: "The shareable link has been copied to your clipboard.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy link.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-foreground">
       <Script
        src="https://www.youtube.com/iframe_api"
        strategy="lazyOnload"
      />
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/80 p-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="flex items-center gap-3">
                <Clapperboard className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold font-headline tracking-tighter">CineView</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
              </Link>
            </div>
        </div>
      </header>

      <main className="flex-grow">
        <div 
            ref={playerContainerRef} 
            className="relative w-full aspect-video bg-black overflow-hidden"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => { if (isPlaying) setShowControls(false); }}
        >
            <div id="youtube-player" className="h-full w-full pointer-events-none" />
            
            <div 
              className={cn(
                  "absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity duration-300",
                  showControls ? 'opacity-100' : 'opacity-0',
                  'pointer-events-none'
              )}
            >
                <div className="flex items-center gap-4 pointer-events-auto">
                  <Button variant="ghost" size="icon" onClick={handleTogglePlay} className="text-white hover:bg-white/20 hover:text-white h-20 w-20 rounded-full">
                      {isPlaying ? <Pause size={48} /> : <Play size={48} />}
                  </Button>
                </div>
            </div>

            <div 
              className={cn(
                  "absolute bottom-4 right-4 flex items-center gap-4 transition-opacity duration-300 pointer-events-none",
                  showControls ? 'opacity-100' : 'opacity-0'
              )}
            >
                <Button variant="ghost" size="icon" onClick={handleToggleFullscreen} className="text-white hover:bg-white/20 hover:text-white pointer-events-auto">
                  {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
                </Button>
            </div>
        </div>

        <div className="mx-auto max-w-7xl p-4 md:p-6">
            <div className="mt-4">
              <h2 className="text-4xl font-extrabold font-headline tracking-tight md:text-5xl text-white">
                {title}
              </h2>
              <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="text-lg text-muted-foreground">
                   <p>{description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => toast({ title: "Liked!" })}>
                    <ThumbsUp className="mr-2" />
                    Like
                  </Button>
                  <Button variant="outline" onClick={handleShare}>
                    <Share2 className="mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
        </div>
      </main>
    </div>
  );
}
