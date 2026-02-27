'use client';

import { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
import { Clapperboard, ThumbsUp, Share2, Play, Pause, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import AuthButton from '@/components/auth/AuthButton';

type VideoData = {
  url: string;
  title: string;
};

function extractVideoId(url: string) {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1);
    }
    if (urlObj.hostname.includes('youtube.com')) {
      const videoId = urlObj.searchParams.get('v');
      if (videoId) {
        return videoId;
      }
    }
  } catch (e) {
    // Ignore invalid URLs
  }
  return null;
}

export default function Home() {
  const firestore = useFirestore();
  const { user } = useUser();

  const videoRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid, 'video', 'current') : null),
    [firestore, user]
  );
  
  const { data: video, isLoading: loading } = useDoc<VideoData>(videoRef);
  const { toast } = useToast();

  const playerRef = useRef<YT.Player | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [showControls, setShowControls] = useState(true);

  // Default video if not logged in or no video set
  const videoId = video?.url ? extractVideoId(video.url) : 'zWMj0Vu-z2I';
  const title = video?.title || (video ? 'Untitled Video' : 'CineView Featured');
  const description = 'An exciting video experience curated just for you.';
  
  const onPlayerReady = (event: YT.PlayerEvent) => {
    setIsPlayerReady(true);
    event.target.playVideo();
  };

  const onPlayerStateChange = (event: YT.OnStateChangeEvent) => {
    if (event.data === (window as any).YT.PlayerState.PLAYING) {
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    const setupPlayer = () => {
        if (videoId && document.getElementById('youtube-player') && !playerRef.current) {
            playerRef.current = new (window as any).YT.Player('youtube-player', {
                videoId: videoId,
                playerVars: {
                    autoplay: 1,
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
            if (playerRef.current && typeof playerRef.current.destroy === 'function') {
                playerRef.current.destroy();
                playerRef.current = null;
            }
            setupPlayer();
        }
    }

    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    const liveCheckInterval = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getDuration === 'function') {
            const duration = playerRef.current.getDuration();
            const currentTime = playerRef.current.getCurrentTime();
            setIsLive(duration - currentTime < 15);
        }
    }, 1000);


    return () => {
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      clearInterval(liveCheckInterval);
      
      if (playerRef.current && typeof playerRef.current.destroy === 'function' && document.getElementById('youtube-player')) {
          playerRef.current.destroy();
          playerRef.current = null;
      }
    };
  }, [videoId]);

  useEffect(() => {
    if (isPlaying) {
      resetInactivityTimeout();
    } else {
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
      setShowControls(true);
    }
  }, [isPlaying]);


  const resetInactivityTimeout = () => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }
    inactivityTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
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
    setShowControls(true);
    resetInactivityTimeout();
  };

  const handleGoLive = () => {
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(playerRef.current.getDuration());
      setIsLive(true);
    }
    setShowControls(true);
    resetInactivityTimeout();
  };

  const handleShare = async () => {
    const shareData = {
      title: `Watch "${title}" on CineView`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        throw new Error('Web Share API not supported');
      }
    } catch (err) {
      try {
        await navigator.clipboard.writeText(shareData.url);
        toast({
          title: "Link copied!",
          description: "The link to this page has been copied to your clipboard.",
        });
      } catch (copyErr) {
        toast({
          variant: "destructive",
          title: "Oops!",
          description: "Could not copy the link.",
        });
      }
    }
  };

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
            <AuthButton />
        </div>
      </header>

      <main className="flex-grow">
        <div 
            ref={playerContainerRef} 
            className="relative w-full aspect-video bg-black"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => { if (isPlaying) setShowControls(false); }}
        >
            {loading ? (
                <Skeleton className="h-full w-full" />
            ) : (
               <>
                <div id="youtube-player" className="h-full w-full" />
                 <div 
                    className={cn(
                        "absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity duration-300",
                        showControls ? 'opacity-100' : 'opacity-0',
                        'pointer-events-none'
                    )}
                  >
                     <div className="flex items-center gap-4 pointer-events-auto">
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleTogglePlay(); }} className="text-white hover:bg-white/20 hover:text-white h-20 w-20 rounded-full">
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
                     <button
                        onClick={(e) => { e.stopPropagation(); handleGoLive(); }}
                        className="flex items-center gap-2 rounded-md bg-black/50 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/20 disabled:pointer-events-none disabled:opacity-50 pointer-events-auto"
                        disabled={isLive}
                      >
                        <span
                          className={cn(
                            'h-2.5 w-2.5 rounded-full transition-colors',
                            isLive ? 'bg-red-500' : 'bg-gray-400'
                          )}
                          aria-hidden="true"
                        />
                        <span>LIVE</span>
                      </button>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleToggleFullscreen(); }} className="text-white hover:bg-white/20 hover:text-white pointer-events-auto">
                        {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
                      </Button>
                   </div>
               </>
            )}
        </div>
        <div className="mx-auto max-w-7xl p-4 md:p-6">
            <div className="mt-4">
              <h2 className="text-4xl font-extrabold font-headline tracking-tight md:text-5xl">
                {loading ? <Skeleton className="h-12 w-3/4 rounded-lg" /> : title}
              </h2>
              <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="text-lg text-muted-foreground">
                   {loading ? <Skeleton className="mt-2 h-7 w-1/2 rounded" /> : <p>{description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline">
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
