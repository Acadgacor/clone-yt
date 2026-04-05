'use client';

import { RefObject } from 'react';
import VideoPlayer from '@/components/player/VideoPlayer';
import LiveChat from '@/components/chat/LiveChat';
import AnimatedContent from '@/components/AnimatedContent';
import ViewerCount from '@/components/player/ViewerCount';
import VideoInfo from '@/components/player/VideoInfo';
import type { ViewProps } from '@/types';

export default function DesktopView({
  videoId,
  showChat,
  setShowChat,
  isFullscreen,
  wrapperRef,
  theme,
  hostname,
  user,
}: ViewProps) {
  return (
    <main
      className={`flex h-full overflow-hidden relative ${
        isFullscreen
          ? 'flex-row p-0 gap-0 bg-black'
          : 'flex-row p-6 gap-5'
      }`}
      ref={wrapperRef as RefObject<HTMLDivElement>}
    >
      <AnimatedContent
        direction="vertical"
        distance={20}
        duration={0.4}
        delay={0.05}
        className={`relative flex flex-col scroll-smooth ${
          isFullscreen
            ? 'flex-1 min-h-0 p-0 mb-0 pr-0 gap-0 rounded-none overflow-hidden'
            : 'flex-grow overflow-y-auto rounded-2xl pr-3 gap-3 pb-4'
        }`}
      >
          <div
            className={`relative w-full flex items-center justify-center bg-black overflow-hidden ${
              isFullscreen
                ? 'flex-1 h-full min-h-0 rounded-none border-none shadow-none'
                : 'shrink-0 shadow-xl rounded-2xl overflow-hidden aspect-video min-h-[70vh] h-auto'
            }`}
          >
          <div className="absolute top-4 left-4 z-50 pointer-events-none">
            <ViewerCount videoId={videoId} />
          </div>
          <VideoPlayer
            videoId={videoId}
            fullscreenWrapperRef={wrapperRef as RefObject<HTMLDivElement>}
            showChat={showChat}
            setShowChat={setShowChat}
          />
        </div>
        <div className={isFullscreen ? "hidden" : "block"}>
          <VideoInfo videoId={videoId} />
        </div>
      </AnimatedContent>
      {showChat && (
        <AnimatedContent
          direction="vertical"
          distance={20}
          duration={0.35}
          delay={0.1}
          className={`flex flex-col ${
            isFullscreen
              ? 'w-[360px] h-full min-h-0 rounded-none border-none z-50 bg-black/95'
              : 'shrink-0 h-full w-[380px] xl:w-[420px] overflow-hidden rounded-2xl shadow-xl'
          }`}
        >
          <LiveChat
            videoId={videoId}
            theme={theme}
            hostname={hostname}
            user={user}
            isFullscreen={isFullscreen}
          />
        </AnimatedContent>
      )}
    </main>
  );
}
