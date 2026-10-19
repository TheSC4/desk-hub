export default function SpotifyCard() {
  return (
    <div className="card flex flex-col items-center justify-center text-center p-6 border-dashed border-border/80 group hover:border-accent/50 transition-colors">
      <div className="w-14 h-14 rounded-2xl bg-surface-light flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
        <svg className="w-8 h-8 text-text-muted group-hover:text-accent transition-colors" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.35-1.435-5.308-1.76-8.793-.963-.335.077-.67-.133-.746-.468-.077-.334.132-.67.467-.746 3.808-.87 7.076-.502 9.722 1.113.294.18.386.563.207.857zm1.225-2.723c-.226.368-.71.482-1.078.256-2.69-1.653-6.79-2.131-9.97-1.165-.413.125-.85-.11-1.002-.523-.15-.414.11-.85.523-1.002 3.633-1.103 8.147-.568 11.27 1.356.369.226.483.71.257 1.078zm.105-2.835C14.692 8.95 8.085 8.73 4.247 9.895c-.495.15-1.02-.13-1.17-.625-.15-.495.13-1.02.625-1.17 4.436-1.346 11.756-1.091 15.673 1.235.445.264.59.84.327 1.285-.264.444-.84.59-1.285.326z"/>
        </svg>
      </div>

      <h3 className="text-base font-semibold text-text mb-1">Spotify</h3>
      <p className="text-xs text-text-muted max-w-[200px]">
        Spotify control coming soon
      </p>

      <span className="mt-4 px-3 py-1 rounded-full text-[10px] uppercase font-mono tracking-wider bg-surface-light text-text-muted/60 border border-border/50">
        Future Extension
      </span>
    </div>
  );
}
