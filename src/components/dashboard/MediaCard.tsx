import { useState, useEffect, useRef } from 'react';

// Preset stations with real working high-quality Lofi & Study streams for GATE CSE focus
const PRESET_STREAMS = [
  {
    name: 'Lofi Girl - Relax & Study',
    artist: 'Lofi Girl Radio',
    src: 'https://stream.zeno.fm/f3wvbbqmdg8uv',
    cover: '🎧',
    source: 'Live Focus Radio',
  },
  {
    name: 'Deep Focus Ambient Beats',
    artist: 'Study Hub FM',
    src: 'https://stream.zeno.fm/0r0xa792kwzuv',
    cover: '☕',
    source: 'Ambient Flow',
  },
  {
    name: 'Chillhop Study Sessions',
    artist: 'Chillhop Music',
    src: 'https://stream.zeno.fm/a843rdavx18uv',
    cover: '💻',
    source: 'Chillhop Radio',
  },
];

export default function MediaCard() {
  const [streamIndex, setStreamIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [sourceApp, setSourceApp] = useState<'spotify' | 'yt' | 'ytmusic'>('spotify');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentStream = PRESET_STREAMS[streamIndex];

  // Initialize and update Media Session API so tablet lockscreen and system controls work!
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentStream.name,
        artist: currentStream.artist,
        album: 'Desk Hub Study Session',
        artwork: [
          { src: './pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: './pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      });

      navigator.mediaSession.setActionHandler('play', () => togglePlay(true));
      navigator.mediaSession.setActionHandler('pause', () => togglePlay(false));
      navigator.mediaSession.setActionHandler('previoustrack', handlePrev);
      navigator.mediaSession.setActionHandler('nexttrack', handleNext);
    }
  }, [currentStream]);

  const togglePlay = (shouldPlay?: boolean) => {
    if (!audioRef.current) return;

    const targetPlay = shouldPlay !== undefined ? shouldPlay : !isPlaying;
    if (targetPlay) {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => console.log('Playback error:', e));
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleNext = () => {
    const nextIdx = (streamIndex + 1) % PRESET_STREAMS.length;
    setStreamIndex(nextIdx);
    if (audioRef.current) {
      audioRef.current.src = PRESET_STREAMS[nextIdx].src;
      if (isPlaying) {
        audioRef.current.play().catch(() => {});
      }
    }
  };

  const handlePrev = () => {
    const prevIdx = (streamIndex - 1 + PRESET_STREAMS.length) % PRESET_STREAMS.length;
    setStreamIndex(prevIdx);
    if (audioRef.current) {
      audioRef.current.src = PRESET_STREAMS[prevIdx].src;
      if (isPlaying) {
        audioRef.current.play().catch(() => {});
      }
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
    }
  };

  // Launch external apps on tablet via intent/URL
  const openApp = (app: 'spotify' | 'yt' | 'ytmusic') => {
    const urls = {
      spotify: 'https://open.spotify.com',
      yt: 'https://youtube.com',
      ytmusic: 'https://music.youtube.com',
    };
    window.open(urls[app], '_blank');
  };

  return (
    <div className="card flex flex-col justify-between h-full p-4 relative overflow-hidden">
      {/* Hidden audio element for live focus audio stream */}
      <audio
        ref={audioRef}
        src={currentStream.src}
        preload="none"
        onEnded={handleNext}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Top Source Switcher Strip */}
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-text flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
            Media & Study Music
          </span>
        </div>

        {/* Quick Launch Buttons for Spotify, YouTube, YouTube Music */}
        <div className="flex items-center gap-1.5 bg-surface-light p-1 rounded-lg border border-border/50">
          {/* Spotify */}
          <button
            onClick={() => {
              setSourceApp('spotify');
              openApp('spotify');
            }}
            title="Open Spotify"
            className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-all ${
              sourceApp === 'spotify' ? 'bg-[#1DB954]/20 text-[#1DB954]' : 'text-text-muted hover:text-text'
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.35-1.435-5.308-1.76-8.793-.963-.335.077-.67-.133-.746-.468-.077-.334.132-.67.467-.746 3.808-.87 7.076-.502 9.722 1.113.294.18.386.563.207.857zm1.225-2.723c-.226.368-.71.482-1.078.256-2.69-1.653-6.79-2.131-9.97-1.165-.413.125-.85-.11-1.002-.523-.15-.414.11-.85.523-1.002 3.633-1.103 8.147-.568 11.27 1.356.369.226.483.71.257 1.078zm.105-2.835C14.692 8.95 8.085 8.73 4.247 9.895c-.495.15-1.02-.13-1.17-.625-.15-.495.13-1.02.625-1.17 4.436-1.346 11.756-1.091 15.673 1.235.445.264.59.84.327 1.285-.264.444-.84.59-1.285.326z" />
            </svg>
            Spotify
          </button>

          {/* YouTube */}
          <button
            onClick={() => {
              setSourceApp('yt');
              openApp('yt');
            }}
            title="Open YouTube"
            className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-all ${
              sourceApp === 'yt' ? 'bg-[#FF0000]/20 text-[#FF0000]' : 'text-text-muted hover:text-text'
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            YouTube
          </button>

          {/* YouTube Music */}
          <button
            onClick={() => {
              setSourceApp('ytmusic');
              openApp('ytmusic');
            }}
            title="Open YouTube Music"
            className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-all ${
              sourceApp === 'ytmusic' ? 'bg-[#FF0000]/20 text-[#FF0000]' : 'text-text-muted hover:text-text'
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm0 19.138c-3.936 0-7.138-3.202-7.138-7.138 0-3.936 3.202-7.138 7.138-7.138 3.936 0 7.138 3.202 7.138 7.138 0 3.936-3.202 7.138-7.138 7.138zm-1.8-10.738v7.2l6-3.6-6-3.6z" />
            </svg>
            YT Music
          </button>
        </div>
      </div>

      {/* Middle Track Info Display */}
      <div className="flex items-center gap-3.5 my-2 p-2.5 rounded-xl bg-surface-light/40 border border-border/40">
        <div className="w-12 h-12 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center text-xl shrink-0">
          {currentStream.cover}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-text truncate">{currentStream.name}</span>
            {isPlaying && (
              <span className="flex items-center gap-0.5 shrink-0">
                <span className="w-1 h-3 bg-accent animate-pulse rounded-full" />
                <span className="w-1 h-4 bg-accent animate-pulse delay-75 rounded-full" />
                <span className="w-1 h-2 bg-accent animate-pulse delay-150 rounded-full" />
              </span>
            )}
          </div>
          <p className="text-[11px] text-text-muted truncate mt-0.5">
            {currentStream.artist} • <span className="text-accent">{currentStream.source}</span>
          </p>
        </div>
      </div>

      {/* Bottom Media Controls Strip */}
      <div className="flex items-center justify-between pt-1">
        {/* Volume slider */}
        <div className="flex items-center gap-1.5 w-24">
          <svg className="w-3.5 h-3.5 text-text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-full accent-accent h-1 bg-border rounded-lg cursor-pointer"
          />
        </div>

        {/* Prev / Play / Next Controls with touch-friendly spacing */}
        <div className="flex items-center gap-3">
          {/* Previous */}
          <button
            onClick={handlePrev}
            className="w-10 h-10 rounded-xl bg-surface-light hover:bg-border text-text flex items-center justify-center transition-all active:scale-95"
            title="Previous Track"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>

          {/* Play / Pause Primary Button */}
          <button
            onClick={() => togglePlay()}
            className="w-12 h-12 rounded-xl bg-accent hover:bg-accent-light text-white flex items-center justify-center shadow-lg shadow-accent/25 transition-all active:scale-95"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Next */}
          <button
            onClick={handleNext}
            className="w-10 h-10 rounded-xl bg-surface-light hover:bg-border text-text flex items-center justify-center transition-all active:scale-95"
            title="Next Track"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
        </div>

        {/* Stream badge */}
        <span className="text-[10px] font-mono text-text-muted/70 px-2 py-0.5 rounded bg-surface-light border border-border/40">
          Ch {streamIndex + 1}/{PRESET_STREAMS.length}
        </span>
      </div>
    </div>
  );
}
