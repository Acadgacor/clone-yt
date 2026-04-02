import { RefObject } from 'react';

export interface Video {
  id: string;
  url: string;
  title?: string;
  created_at?: string;
}

export interface ViewProps {
  videoId: string;
  showChat: boolean;
  setShowChat: (show: boolean) => void;
  isFullscreen: boolean;
  wrapperRef: RefObject<HTMLDivElement | null>;
  theme: 'dark' | 'light';
  hostname: string;
  user: any;
}
