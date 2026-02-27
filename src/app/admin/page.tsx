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
import { Clapperboard, ArrowLeft, Lock } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import Link from 'next/link';
import AuthButton from '@/components/auth/AuthButton';

const formSchema = z.object({
  url: z.string().url({ message: 'Please enter a valid YouTube URL.' }),
  title: z.string().min(1, { message: 'Title cannot be empty.' }),
});

type FormValues = z.infer<typeof formSchema>;
type VideoData = {
  url: string;
  title: string;
};

export default function AdminPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const videoRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid, 'video', 'current') : null),
    [firestore, user]
  );
  
  const { data: videoData } = useDoc<VideoData>(videoRef);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: '',
      title: '',
    },
  });

  useEffect(() => {
    if (videoData) {
      form.reset(videoData);
    }
  }, [videoData, form]);

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    if (!videoRef) return;
    setIsSubmitting(true);
    
    setDocumentNonBlocking(videoRef, data, { merge: true });

    toast({
      title: 'Success!',
      description: 'The video has been updated successfully.',
    });
    
    setIsSubmitting(false);
  };

  if (!isUserLoading && !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Lock className="mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="text-2xl font-bold">Admin Access Required</h2>
        <p className="mb-6 text-muted-foreground">Please sign in to manage your theater.</p>
        <AuthButton />
        <Link href="/" className="mt-4 text-sm text-primary hover:underline">Back to Home</Link>
      </div>
    );
  }

  if (isUserLoading) {
    return null;
  }

  return (
    <>
     <header className="sticky top-0 z-10 border-b border-border bg-background/95 p-4 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clapperboard className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold font-headline">CineView Admin</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" passHref>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
            <AuthButton />
          </div>
        </div>
      </header>
      <div className="container mx-auto flex min-h-[calc(100vh-80px)] items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Update Video</CardTitle>
            <CardDescription>Update the video that is displayed on your homepage.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>YouTube Video URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://www.youtube.com/watch?v=..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Video Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter the video title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isSubmitting || !videoRef} className="w-full">
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
