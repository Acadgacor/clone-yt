'use client';

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Clapperboard, ArrowLeft, Loader2, RefreshCw, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

const formSchema = z.object({
  url: z.string().url({ message: 'Please enter a valid YouTube URL.' }),
  title: z.string().min(1, { message: 'Title cannot be empty.' }),
  channelName: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function getYouTubeId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export default function AdminPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const configRef = useMemoFirebase(() => doc(firestore, 'settings', 'theater'), [firestore]);
  const { data: currentConfig, isLoading: isFetching } = useDoc<any>(configRef);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: '',
      title: '',
      channelName: '',
    },
  });

  useEffect(() => {
    if (currentConfig) {
      form.reset({
        url: currentConfig.url || '',
        title: currentConfig.title || '',
        channelName: currentConfig.channelName || '',
      });
    }
  }, [currentConfig, form]);

  const fetchMetadata = async (url: string) => {
    if (!url) return;
    setIsFetchingMetadata(true);
    try {
      const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      
      if (data.title) {
        form.setValue('title', data.title);
        form.setValue('channelName', data.author_name || '');
      }
    } catch (error) {
      console.error("Failed to fetch metadata:", error);
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: "Could not fetch video details automatically.",
      });
    } finally {
      setIsFetchingMetadata(false);
    }
  };

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    setIsSubmitting(true);
    const videoId = getYouTubeId(data.url);

    if (!videoId) {
      toast({
        variant: "destructive",
        title: "Invalid URL",
        description: "Could not extract a valid YouTube video ID from the provided URL.",
      });
      setIsSubmitting(false);
      return;
    }

    setDocumentNonBlocking(configRef, {
      url: data.url,
      title: data.title,
      channelName: data.channelName,
      videoId: videoId,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 p-3 md:p-4 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-hidden">
            <Clapperboard className="h-6 w-6 md:h-8 md:w-8 text-primary shrink-0" />
            <h1 className="text-lg md:text-2xl font-bold font-headline truncate">Settings</h1>
          </div>
          <Link href="/" passHref>
            <Button variant="outline" size="sm" className="shrink-0 text-xs md:text-sm">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Back to Theater</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </Link>
        </div>
      </header>
      <div className="flex-grow flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl border-white/5 liquid-glass">
          <CardHeader className="p-5 md:p-6">
            <CardTitle className="text-xl md:text-2xl">Theater Configuration</CardTitle>
            <CardDescription className="text-xs md:text-sm">Paste a YouTube URL to automatically sync video and channel info.</CardDescription>
          </CardHeader>
          <CardContent className="p-5 md:p-6 pt-0 md:pt-0">
            {isFetching ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs md:text-sm">YouTube Video URL</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input 
                              placeholder="https://www.youtube.com/watch?v=..." 
                              className="text-sm md:text-base h-10 md:h-12"
                              {...field} 
                              onBlur={() => fetchMetadata(field.value)}
                            />
                          </FormControl>
                          <Button 
                            type="button" 
                            variant="secondary" 
                            size="icon"
                            className="h-10 w-10 md:h-12 md:w-12 shrink-0"
                            onClick={() => fetchMetadata(field.value)}
                            disabled={isFetchingMetadata}
                          >
                            {isFetchingMetadata ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs md:text-sm">Auto-Sync Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Video title" className="text-sm md:text-base h-10 md:h-12" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="channelName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs md:text-sm">Channel / Author</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input placeholder="Channel name" className="text-sm md:text-base h-10 md:h-12 pl-9" {...field} />
                              <UserIcon className="absolute left-3 top-3 md:top-4 h-4 w-4 text-muted-foreground" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" disabled={isSubmitting} className="w-full h-10 md:h-12 font-bold uppercase tracking-widest text-xs md:text-sm">
                    {isSubmitting ? 'Updating...' : 'Update Theater'}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
