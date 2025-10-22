'use client';

import { Clapperboard, Settings } from 'lucide-react';
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
  const description = 'An exciting video experience.';

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-20 p-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="flex items-center gap-2">
                <Clapperboard className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold font-headline">CineView</h1>
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
        <div className="relative h-0 pb-[56.25%]">
            {loading ? (
                <Skeleton className="absolute top-0 left-0 h-full w-full" />
            ) : (
                <iframe
                    className="absolute top-0 left-0 h-full w-full"
                    src={embedUrl}
                    title={title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                ></iframe>
            )}
        </div>
        <div className="mx-auto max-w-7xl p-4 md:p-8">
            <div className="mt-4">
              <h2 className="text-3xl font-bold font-headline">
                {loading ? <Skeleton className="h-9 w-3/4 rounded" /> : title}
              </h2>
              <div className="mt-2 text-muted-foreground">
                 {loading ? <Skeleton className="h-6 w-1/4 rounded" /> : <p>{description}</p>}
              </div>
            </div>
        </div>
      </main>
    </div>
  );
}
