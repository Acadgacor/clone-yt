import { RecommendationCard } from '@/components/recommendation-card';
import { Clapperboard } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 p-4 backdrop-blur-sm">
        <div className="container mx-auto flex items-center gap-2">
          <Clapperboard className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold font-headline">CineView</h1>
        </div>
      </header>

      <main className="container mx-auto flex-grow p-4 md:p-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="flex flex-col lg:col-span-2">
            <div className="w-full overflow-hidden rounded-lg shadow-2xl shadow-primary/20 ring-1 ring-primary/50">
              <div className="aspect-video">
                <iframe
                  className="h-full w-full"
                  src="https://www.youtube.com/embed/tPAZOEFY-jQ?autoplay=1&modestbranding=1&rel=0&showinfo=0"
                  title="yoy dadal yoy cepyok"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
            <div className="mt-4">
              <h2 className="text-3xl font-bold font-headline">
                yoy dadal yoy cepyok
              </h2>
              <p className="mt-1 text-muted-foreground">
                An exciting video experience, powered by AI.
              </p>
            </div>
          </div>

          <div className="mt-8 lg:mt-0">
            <RecommendationCard />
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
