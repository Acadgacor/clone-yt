'use client';

import { Users, AlertCircle } from 'lucide-react';
import AnimatedContent from '@/components/AnimatedContent';
import { useYoutubeViewers } from '@/hooks/useYoutubeViewers';

interface ViewerCountProps {
    videoId: string | undefined;
}

export default function ViewerCount({ videoId }: ViewerCountProps) {
    const { viewersCount, error, isLive } = useYoutubeViewers(videoId);

    if (!videoId) return null;

    // if there's an error, we might optionally show an alert icon or just hide it
    if (error) {
        return (
            <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md border border-white/10 px-2 py-1 rounded-full shadow-lg opacity-50">
                <AlertCircle className="h-3 w-3 text-red-400" />
                <span className="text-[9px] font-bold text-red-200 tracking-wider">Viewer Count Unavailable</span>
            </div>
        );
    }

    // If not live, maybe we don't show the real-time viewer count, or we show 0.
    // We'll hide it if the count is literally 0 and not marked as live to keep the UI clean for VODs.
    if (viewersCount === 0 && !isLive) return null;

    return (
        <AnimatedContent
            direction="horizontal"
            distance={10}
            className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full shadow-lg"
        >
            <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </div>
            <Users className="h-3.5 w-3.5 text-white/80" />
            <span className="text-xs font-bold text-white tracking-widest">
                {viewersCount.toLocaleString()} {viewersCount === 1 ? 'Viewer' : 'Viewers'}
            </span>
        </AnimatedContent>
    );
}
