'use client';

import { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
import { Clapperboard, Settings, ThumbsUp, Share2, Play, Pause, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

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
  const videoRef = useMemoFirebase(() => firestore ? doc(firestore, 'videos', 'current') : null, [firestore]);
  const { data: video, isLoading: loading } = useDoc<VideoData>(videoRef);

  const playerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const videoId = video?.url ? extractVideoId(video.url) : 'zWMj0Vu-z2I';
  const title = video?.title || 'Loading video...';
  const description = 'An exciting video experience curated just for you.';

  const onPlayerReady = (event: any) => {
    setIsPlayerReady(true);
    event.target.playVideo();
  };

  const onPlayerStateChange = (event: any) => {
    if (event.data === (window as any).YT.PlayerState.PLAYING) {
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  const setupPlayer = () => {
    if ((window as any).YT && (window as any).YT.Player) {
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

  useEffect(() => {
    if (videoId) {
      if ((window as any).YT) {
        setupPlayer();
      } else {
        (window as any).onYouTubeIframeAPIReady = setupPlayer;
      }
    }
    
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [videoId]);

  const handleTogglePlay = () => {
    if (!isPlayerReady) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };
  
  const handleToggleFullscreen = () => {
    if (!playerContainerRef.current) return;

    if (!isFullscreen) {
      playerContainerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-black text-foreground">
       <Script
        src="https://www.youtube.com/iframe_api"
        strategy="lazyOnload"
        onLoad={() => {
          if (videoId && !playerRef.current) {
             // onYouTubeIframeAPIReady will be called by the script
          }
        }}
      />
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/80 p-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="flex items-center gap-3">
                <Clapperboard className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold font-headline tracking-tighter">CineView</h1>
            </div>
            <Link href="/admin" passHref>
              <Button variant="ghost" size="icon">
                <Settings />
                <span className="sr-only">Admin Settings</span>
              </Button>
            </Link>
        </div>
      </header>

      <main className="flex-grow">
        <div ref={playerContainerRef} className="relative w-full aspect-video group bg-black">
            {loading ? (
                <Skeleton className="h-full w-full" />
            ) : (
               <>
                <div id="youtube-player" className="h-full w-full" />
                 <div 
                    className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  >
                     <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={handleTogglePlay} className="text-white hover:bg-white/20 hover:text-white h-20 w-20 rounded-full">
                            {isPlaying ? <Pause size={48} /> : <Play size={48} />}
                        </Button>
                     </div>
                  </div>
                   <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Button variant="ghost" size="icon" onClick={handleToggleFullscreen} className="text-white hover:bg-white/20 hover:text-white">
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
                  <Button variant="outline">
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
