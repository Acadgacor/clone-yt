'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Clapperboard, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

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
      url: 'https://www.youtube.com/watch?v=zWMj0Vu-z2I',
      title: 'CineView Featured Content',
    },
  });

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    setIsSubmitting(true);
    // In this simplified version, we just show a toast since there is no persistent DB linked to a user
    setTimeout(() => {
      toast({
        title: 'Settings Updated',
        description: 'Your theater settings have been updated (simulated).',
      });
      setIsSubmitting(false);
    }, 1000);
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
            <CardDescription>Configure the featured video for this public instance.</CardDescription>
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
                  {isSubmitting ? 'Updating...' : 'Update Theater'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
