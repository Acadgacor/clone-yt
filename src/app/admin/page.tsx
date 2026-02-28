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

  // Pre-fill form when data arrives
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
      // Menggunakan noembed.com sebagai proxy CORS-friendly untuk oEmbed YouTube
      const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      
      if (data.title) {
        form.setValue('title', data.title);
        form.setValue('channelName', data.author_name || '');
        toast({
          title: "Metadata Synced",
          description: `Fetched: ${data.title} from ${data.author_name}`,
        });
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

    toast({
      title: 'Settings Updated',
      description: 'Your theater settings have been saved to Firestore.',
    });
    setIsSubmitting(false);
  };

  return (
    <>
     <header className="sticky top-0 z-10 border-b border-border bg-background/95 p-4 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clapperboard className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold font-headline">CineView Settings</h1>
          </div>
          <Link href="/" passHref>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Theater
            </Button>
          </Link>
        </div>
      </header>
      <div className="container mx-auto flex min-h-[calc(100vh-80px)] items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Theater Configuration</CardTitle>
            <CardDescription>Paste a YouTube URL to automatically sync video and channel info.</CardDescription>
          </CardHeader>
          <CardContent>
            {isFetching ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>YouTube Video URL</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input 
                              placeholder="https://www.youtube.com/watch?v=..." 
                              {...field} 
                              onBlur={() => fetchMetadata(field.value)}
                            />
                          </FormControl>
                          <Button 
                            type="button" 
                            variant="secondary" 
                            size="icon"
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
                          <FormLabel>Auto-Sync Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Video title will appear here" {...field} />
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
                          <FormLabel>Channel / Author</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input placeholder="Channel name" {...field} className="pl-9" />
                              <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? 'Updating...' : 'Update Theater'}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
