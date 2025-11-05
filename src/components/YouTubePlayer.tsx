'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

type YouTubePlayerProps = {
  videoId: string;
  height?: string | number;
  width?: string | number;
  playerVars?: Record<string, any>;
  onReady?: (event: any) => void;
  onStateChange?: (event: any) => void;
  premium?: boolean;
};

export default function YouTubePlayer({
  videoId,
  height = '100%',
  width = '100%',
  playerVars,
  onReady,
  onStateChange,
  premium = true,
}: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any>(null);
  const fallbackInjectedRef = useRef<boolean>(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    function createPlayer() {
      if (!containerRef.current || !window.YT || !window.YT.Player) return;
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {}
        playerRef.current = null;
      }
      playerRef.current = new window.YT.Player(containerRef.current, {
        height,
        width,
        videoId,
        playerVars: {
          // Premium defaults for smoother UX
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          autohide: 1,
          iv_load_policy: 3,
          color: 'white',
          // caller can override
          ...playerVars,
        },
        events: {
          onReady: (e: any) => {
            try { e.target.setPlaybackQuality?.('hd1080'); } catch {}
            setIsReady(true);
            onReady?.(e);
          },
          onStateChange,
        },
      });
    }

    function loadApiAndCreate() {
      if (typeof window === 'undefined') return;
      if (window.YT && window.YT.Player) {
        createPlayer();
        return;
      }
      const existing = document.getElementById('youtube-iframe-api');
      if (!existing) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        tag.id = 'youtube-iframe-api';
        document.body.appendChild(tag);
      }
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prev) prev();
        createPlayer();
      };
    }

    loadApiAndCreate();

    // Fallback: if API/player fails to attach after 2s, inject a plain iframe
    const fallbackTimer = window.setTimeout(() => {
      if (!containerRef.current) return;
      if (playerRef.current || fallbackInjectedRef.current) return;
      fallbackInjectedRef.current = true;
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
      iframe.title = 'YouTube video player';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true as any;
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.frameBorder = '0';
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(iframe);
    }, 2000);

    return () => {
      try {
        if (playerRef.current) playerRef.current.destroy();
      } catch {}
      window.clearTimeout(fallbackTimer);
    };
    // Recreate only when videoId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  return (
    <div className={premium ? 'group/video relative h-full w-full' : undefined} style={{ width: '100%', height: '100%' }}>
      {premium && (
        <>
          {/* Subtle gradient bezel */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.35)]" />
          <div className="pointer-events-none absolute inset-[1px] rounded-[1rem] bg-gradient-to-b from-white/6 via-transparent to-white/6" />
          {/* Ambient glow that softens on ready */}
          <div
            className={`pointer-events-none absolute -inset-6 rounded-[1.25rem] blur-2xl transition-opacity duration-500 ${isReady ? 'opacity-10' : 'opacity-40'} bg-[radial-gradient(60%_50%_at_30%_10%,rgba(255,255,255,0.18),transparent_60%),radial-gradient(50%_40%_at_70%_20%,rgba(255,255,255,0.14),transparent_65%)]`} />
          {/* Top light reflection */}
          <div className="pointer-events-none absolute left-3 right-3 top-2 h-8 rounded-full bg-gradient-to-b from-white/35 to-transparent opacity-70 transition-opacity group-hover/video:opacity-90" />
          {/* Bottom vignette */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/45 to-transparent" />
          {/* Loading controls placeholder (fades on ready) */}
          <div className={`pointer-events-none absolute inset-x-0 bottom-3 mx-3 transition-opacity duration-500 ${isReady ? 'opacity-0' : 'opacity-90'}`}>
            <div className="h-1 w-11/12 overflow-hidden rounded bg-white/20">
              <div className="h-full w-1/3 animate-[shine_1.4s_ease_infinite] bg-white/70" />
            </div>
            <div className="mt-2 flex items-center gap-2 text-[10px] font-medium text-white/80">
              <div className="h-5 w-5 rounded bg-white/20" />
              <div className="h-5 w-7 rounded bg-white/20" />
              <div className="ml-auto h-5 w-10 rounded bg-white/20" />
            </div>
          </div>
        </>
      )}
      <div ref={containerRef} className="relative z-[1] h-full w-full overflow-hidden rounded-2xl" />
    </div>
  );
}


