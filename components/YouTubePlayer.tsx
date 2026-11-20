"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";

export type PlayerHandle = {
  getTime(): number | null;
  seek(seconds: number): void;
  pause(): void;
  play(): void;
  isPlaying(): boolean;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<any> | null = null;
function loadYouTubeApi(): Promise<any> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!apiPromise) {
    apiPromise = new Promise((resolve) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        resolve(window.YT);
      };
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
    });
  }
  return apiPromise;
}

export function YouTubePlayer({ videoId, ref }: { videoId: string; ref?: Ref<PlayerHandle> }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current!;
    const mount = document.createElement("div");
    container.appendChild(mount);

    loadYouTubeApi().then((YT) => {
      if (cancelled) return;
      playerRef.current = new YT.Player(mount, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: { rel: 0, playsinline: 1, modestbranding: 1 },
      });
    });

    return () => {
      cancelled = true;
      try {
        playerRef.current?.destroy();
      } catch {}
      playerRef.current = null;
      container.innerHTML = "";
    };
  }, [videoId]);

  useImperativeHandle(ref, () => ({
    getTime: () => {
      const t = playerRef.current?.getCurrentTime?.();
      return typeof t === "number" ? t : null;
    },
    seek: (s) => {
      playerRef.current?.seekTo?.(s, true);
      playerRef.current?.playVideo?.();
    },
    pause: () => playerRef.current?.pauseVideo?.(),
    play: () => playerRef.current?.playVideo?.(),
    isPlaying: () => playerRef.current?.getPlayerState?.() === 1,
  }));

  return (
    <div
      ref={containerRef}
      className="aspect-video w-full overflow-hidden rounded-xl bg-black [&>iframe]:h-full [&>iframe]:w-full"
    />
  );
}
