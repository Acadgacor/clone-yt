'use client';

import { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
import { Clapperboard, Settings, ThumbsUp, Share2, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

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
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
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
      progressIntervalRef.current = setInterval(() => {
        const currentTime = playerRef.current.getCurrentTime();
        const duration = playerRef.current.getDuration();
        setProgress((currentTime / duration) * 100);
      }, 250);
    } else {
      setIsPlaying(false);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }
  };

  const setupPlayer = () => {
    if (window.YT && window.YT.Player) {
      playerRef.current = new (window as any).YT.Player('youtube-player', {
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          controls: 0, // Hide default controls
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

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (playerRef.current) {
        playerRef.current.destroy();
      }
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
  
  const handleSeek = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!isPlayerReady) return;
    const progressBar = event.currentTarget;
    const clickPosition = event.clientX - progressBar.getBoundingClientRect().left;
    const newProgress = (clickPosition / progressBar.offsetWidth);
    const newTime = playerRef.current.getDuration() * newProgress;
    playerRef.current.seekTo(newTime);
    setProgress(newProgress * 100);
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
        <div className="relative w-full aspect-video group">
            {loading ? (
                <Skeleton className="h-full w-full" />
            ) : (
               <>
                <div id="youtube-player" className="h-full w-full" />
                 <div 
                    className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/70 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />
                  <div className="absolute bottom-4 left-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-4">
                     <Button variant="ghost" size="icon" onClick={handleTogglePlay} className="text-white hover:bg-white/20 hover:text-white">
                        {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                     </Button>
                     <Progress value={progress} onClick={handleSeek} className="h-1.5 cursor-pointer bg-white/20 [&>div]:bg-primary"/>
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
