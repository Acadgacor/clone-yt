'use client';

import { Clapperboard } from 'lucide-react';
import { useEffect, useState } from 'react';

type VideoData = {
  url: string;
  title: string;
};

function extractVideoId(url: string) {
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
  const [video, setVideo] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/video')
      .then((res) => res.json())
      .then((data) => {
        setVideo(data);
        setLoading(false);
      });
  }, []);

  const videoId = video?.url ? extractVideoId(video.url) : 'zWMj0Vu-z2I';
  const embedUrl = `https://www.youtube.com/embed/${videoId}`;
  const title = video?.title || 'KISAH PILU MENGERIKAN DI KARNAVAL.... EMOTIONLESS : The Last Ticket';
  const description = 'An exciting video experience.';

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 p-4 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Clapperboard className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold font-headline">CineView</h1>
            </div>
        </div>
      </header>

      <main className="container mx-auto flex-grow p-4 md:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col">
            {loading ? (
               <div className="w-full overflow-hidden rounded-lg shadow-2xl shadow-primary/20 ring-1 ring-primary/50">
                <div className="aspect-video bg-muted animate-pulse" />
               </div>
            ) : (
                <div className="w-full overflow-hidden rounded-lg shadow-2xl shadow-primary/20 ring-1 ring-primary/50">
                <div className="aspect-video">
                    <iframe
                    className="h-full w-full"
                    src={embedUrl}
                    title={title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    ></iframe>
                </div>
                </div>
            )}
            <div className="mt-4">
              <h2 className="text-3xl font-bold font-headline">
                {loading ? <div className="h-9 w-3/4 rounded bg-muted animate-pulse" /> : title}
              </h2>
              <p className="mt-1 text-muted-foreground">
                {loading ? <div className="h-6 w-1/4 rounded bg-muted animate-pulse" /> : description}
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-auto border-t border-border py-6">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} CineView. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
