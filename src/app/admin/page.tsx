'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, Eye, BarChart3 } from 'lucide-react';

interface Video {
  id: string;
  title: string;
  youtube_url: string;
  created_at: string;
}

interface VideoWithViews extends Video {
  view_count: number;
}

export default function AdminPage() {
  const supabase = createClient();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [videos, setVideos] = useState<VideoWithViews[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);

  // Fetch videos with view counts
  useEffect(() => {
    const fetchVideosWithViews = async () => {
      setIsLoadingVideos(true);
      
      try {
        // Fetch all videos
        const { data: videosData, error: videosError } = await supabase
          .from('videos')
          .select('*')
          .order('created_at', { ascending: false });

        if (videosError) {
          throw videosError;
        }

        if (!videosData) {
          setVideos([]);
          return;
        }

        // Fetch view counts for each video
        const videosWithViews = await Promise.all(
          videosData.map(async (video) => {
            const { count, error: countError } = await supabase
              .from('views')
              .select('*', { count: 'exact', head: true })
              .eq('video_id', video.id);

            if (countError) {
              console.error('Error fetching view count:', countError);
            }

            return {
              ...video,
              view_count: count || 0,
            };
          })
        );

        setVideos(videosWithViews);
      } catch (error) {
        console.error('Error fetching videos:', error);
        toast({
          title: 'Error',
          description: 'Gagal memuat data video',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingVideos(false);
      }
    };

    fetchVideosWithViews();
  }, [supabase, toast]);

  // Handle form submission - Insert directly to Supabase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !url.trim()) {
      toast({
        title: 'Validasi Error',
        description: 'Judul dan URL wajib diisi',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('videos')
        .insert({
          title: title.trim(),
          youtube_url: url.trim(),
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: 'Sukses',
        description: 'Video berhasil ditambahkan',
      });

      // Reset form
      setTitle('');
      setUrl('');

      // Add new video to list with 0 views
      if (data) {
        setVideos((prev) => [
          { ...data, view_count: 0 },
          ...prev,
        ]);
      }
    } catch (error) {
      console.error('Error inserting video:', error);
      toast({
        title: 'Error',
        description: 'Gagal menambahkan video. Silakan coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>Tambah Video Baru</CardTitle>
            <CardDescription>
              Masukkan judul dan URL YouTube untuk menambahkan video baru
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Judul Video</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Masukkan judul video..."
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">URL YouTube</Label>
                <Input
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  disabled={isSubmitting}
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Video
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Videos List with View Counts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Daftar Video & Statistik
            </CardTitle>
            <CardDescription>
              Data video dengan jumlah penonton (siap untuk grafik recharts)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingVideos ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : videos.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                Belum ada video. Tambahkan video pertama Anda di atas.
              </p>
            ) : (
              <div className="space-y-4">
                {videos.map((video) => (
                  <div
                    key={video.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{video.title}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {video.youtube_url}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(video.created_at).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground ml-4">
                      <Eye className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {video.view_count.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Data structure ready for recharts */}
                <div className="mt-6 rounded-lg bg-muted p-4">
                  <h4 className="mb-2 text-sm font-medium">Data untuk Recharts:</h4>
                  <pre className="overflow-x-auto text-xs">
                    {JSON.stringify(
                      videos.map((v) => ({
                        name: v.title,
                        views: v.view_count,
                        date: v.created_at,
                      })),
                      null,
                      2
                    )}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
