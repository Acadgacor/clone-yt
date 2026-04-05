import { useState, useEffect, useRef, useCallback } from 'react';

export function useVideoTimeSync(isReplay: boolean) {
    // State untuk expose waktu video (untuk trigger re-render jika diperlukan)
    const [currentVideoTime, setCurrentVideoTime] = useState(0);
    
    // Ref untuk menyimpan waktu video saat ini (performance - tidak trigger render)
    const currentVideoTimeRef = useRef(0);
    const previousVideoTimeRef = useRef(0);

    // Handler saat video di-skip (maju/mundur)
    const handleVideoSeek = useCallback((newTime: number, onSeekCallback?: (newTime: number) => void) => {
        if (!isReplay) return;
        
        if (onSeekCallback) {
            onSeekCallback(newTime);
        }
    }, [isReplay]);

    // LISTENER VIDEO TIME UPDATE (dari VideoPlayer via event)
    useEffect(() => {
        const handleTimeUpdate = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail && typeof customEvent.detail.currentTime === 'number') {
                const newTime = customEvent.detail.currentTime;
                
                // Deteksi skip/seek (lompatan waktu > 3 detik)
                const timeDiff = Math.abs(newTime - previousVideoTimeRef.current);
                if (isReplay && timeDiff > 3) {
                    // Reset tracking saat video di-skip
                    handleVideoSeek(newTime);
                }
                
                previousVideoTimeRef.current = currentVideoTimeRef.current;
                currentVideoTimeRef.current = newTime;
                setCurrentVideoTime(newTime);
            }
        };
        
        window.addEventListener('videoTimeUpdate', handleTimeUpdate);
        return () => window.removeEventListener('videoTimeUpdate', handleTimeUpdate);
    }, [isReplay, handleVideoSeek]);

    return {
        currentVideoTime,
        currentVideoTimeRef,
        previousVideoTimeRef,
        handleVideoSeek
    };
}
