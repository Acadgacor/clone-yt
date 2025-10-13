'use client';

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Clapperboard } from 'lucide-react';

const formSchema = z.object({
  url: z.string().url({ message: 'Please enter a valid YouTube URL.' }),
  title: z.string().min(1, { message: 'Title cannot be empty.' }),
});

type FormValues = z.infer<typeof formSchema>;

export default function AdminPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: '',
      title: '',
    },
  });

  useEffect(() => {
    fetch('/api/video')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          form.reset(data);
        }
      });
  }, [form]);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save video data');
      }

      toast({
        title: 'Success!',
        description: 'The video has been updated successfully.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: 'Could not update the video. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
     <header className="sticky top-0 z-10 border-b border-border bg-background/95 p-4 backdrop-blur-sm">
        <div className="container mx-auto flex items-center gap-2">
          <Clapperboard className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold font-headline">CineView Admin</h1>
        </div>
      </header>
      <div className="container mx-auto flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Update Video</CardTitle>
            <CardDescription>Update the video that is displayed on the homepage.</CardDescription>
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
                <Button type="submit" disabled={isSubmitting} className="w-full">
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
