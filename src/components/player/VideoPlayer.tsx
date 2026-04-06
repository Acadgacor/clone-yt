'use client';

import { RefObject } from 'react';
import Script from 'next/script';
import PlayerControls from './PlayerControls';
import { useVideoPlayer } from '@/hooks/useVideoPlayer';

interface VideoPlayerProps {
  videoId: string;
  fullscreenWrapperRef: RefObject<HTMLDivElement>;
  showChat: boolean;
  setShowChat: (show: boolean) => void;
}

export default function VideoPlayer({ videoId, fullscreenWrapperRef, showChat, setShowChat }: VideoPlayerProps) {
  const {
    playerContainerRef,
    isPlayerReady,
    isPlaying,
    isFullscreen,
    showControls,
    duration,
    currentTime,
    volume,
    isMuted,
    availableQualities,
    currentQuality,
    isLive,
    isLiveSynced,
    isTouch,
    handleTogglePlay,
    handleToggleMute,
    handleToggleFullscreen,
    handleSeek,
    handleVolumeChange,
    handleQualityChange,
    handleMouseMove,
    handleMouseLeave,
    handleContainerClick,
    handleDoubleClick,
    handleSyncLive,
    formatQualityLabel,
  } = useVideoPlayer({ videoId, fullscreenWrapperRef });


  return (
    <div
      ref={playerContainerRef}
      tabIndex={0}
      className="w-full h-full relative group bg-black overflow-hidden flex items-center justify-center z-10 touch-none outline-none focus:outline-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleContainerClick}
      onDoubleClick={handleDoubleClick}
    >
      <Script src="https://www.youtube.com/iframe_api" strategy="lazyOnload" />
      <div id="youtube-player" className="w-full h-full pointer-events-none absolute inset-0 z-0" />

      {/* Cinematic gradient overlay */}
      <div 
        className={`absolute inset-0 z-20 pointer-events-none transition-opacity duration-700 ease-out ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/60 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black via-black/80 to-transparent" />
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-black/40 to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-black/40 to-transparent" />
      </div>

      {/* Ambient glow effect when controls visible */}
      <div 
        className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-32 pointer-events-none z-15 transition-all duration-700 ease-out ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background: 'radial-gradient(ellipse at center bottom, rgba(255,107,0,0.08) 0%, transparent 70%)',
        }}
      />

      <PlayerControls
        isPlaying={isPlaying}
        isPlayerReady={isPlayerReady}
        handleTogglePlay={handleTogglePlay}
        showControls={showControls}
        isMuted={isMuted}
        volume={volume}
        handleToggleMute={handleToggleMute}
        handleVolumeChange={handleVolumeChange}
        isLive={isLive}
        isLiveSynced={isLiveSynced}
        handleSyncLive={handleSyncLive}
        showChat={showChat}
        setShowChat={setShowChat}
        currentQuality={currentQuality}
        availableQualities={availableQualities}
        handleQualityChange={handleQualityChange}
        formatQualityLabel={formatQualityLabel}
        isFullscreen={isFullscreen}
        handleToggleFullscreen={handleToggleFullscreen}
        fullscreenWrapperRef={fullscreenWrapperRef}
        duration={duration}
        currentTime={currentTime}
        handleSeek={handleSeek}
        isTouch={isTouch}
      />
    </div>
  );
}