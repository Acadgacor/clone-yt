import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Mengekstrak YouTube Video ID dari berbagai format URL:
 * - https://www.youtube.com/live/e4bOBAGIs9E
 * - https://youtu.be/e4bOBAGIs9E
 * - https://www.youtube.com/watch?v=e4bOBAGIs9E
 */
export function getYouTubeId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}
