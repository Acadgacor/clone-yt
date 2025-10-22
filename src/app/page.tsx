'use client';

import { Clapperboard, Settings, ThumbsUp, Share2 } from 'lucide-react';
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
  
  const videoId = video?.url ? extractVideoId(video.url) : 'zWMj0Vu-z2I';
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&modestbranding=1&rel=0`;
  const title = video?.title || 'Loading video...';
  const description = 'An exciting video experience curated just for you.';

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/50 bg-background/80 p-4 backdrop-blur-sm">
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
        <div className="aspect-video w-full">
            {loading ? (
                <Skeleton className="h-full w-full" />
            ) : (
                <iframe
                    className="h-full w-full"
                    src={embedUrl}
                    title={title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                ></iframe>
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
