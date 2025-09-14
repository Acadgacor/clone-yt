'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getRecommendations } from '@/app/actions';
import { Loader2, Wand2, Film } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const videoInfo = {
  videoTitle: 'yoy dadal yoy cepyok',
  videoGenre: 'Music',
  userRating: 4.5,
};

export function RecommendationCard() {
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleGetRecommendations = () => {
    startTransition(async () => {
      const result = await getRecommendations(videoInfo);
      if (result.success && result.data) {
        setRecommendations(result.data);
      } else {
        toast({
          variant: 'destructive',
          title: 'An error occurred',
          description: result.error,
        });
      }
    });
  };

  return (
    <Card className="flex h-full w-full flex-col border-border bg-background/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="text-accent" />
          <span>AI Recommendations</span>
        </CardTitle>
        <CardDescription>Discover new videos you'll love.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-grow flex-col">
        {recommendations.length === 0 && !isPending && (
          <div className="m-auto flex flex-col items-center justify-center gap-4 text-center">
            <p className="text-muted-foreground">
              Enjoying the show? Let our AI find your next favorite video.
            </p>
            <Button onClick={handleGetRecommendations} disabled={isPending}>
              {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                  <Wand2 className="mr-2 h-4 w-4" />
              )}
              Get Recommendations
            </Button>
          </div>
        )}
        {isPending && recommendations.length === 0 && (
          <div className="m-auto flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
            <p>Finding similar videos...</p>
          </div>
        )}
        {recommendations.length > 0 && (
          <div className="flex flex-grow flex-col gap-4">
             <ul className="space-y-3">
              {recommendations.map((rec, index) => (
                <li key={index} className="group cursor-pointer rounded-lg border border-border bg-card/50 p-3 transition-all hover:border-accent hover:bg-accent/10">
                  <div className="flex items-center gap-3">
                    <Film className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-accent" />
                    <p className="flex-1 font-medium">{rec}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Button onClick={handleGetRecommendations} variant="outline" className="mt-auto self-center" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
              Get New Recommendations
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
