'use client';

interface HeaderProps {
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
}

export default function Header({ theme, onThemeToggle }: HeaderProps) {
  return (
    <header className="flex items-center gap-3 mb-7 flex-wrap">
      <div>
        <div className="text-xl font-black tracking-tight" style={{ color: 'var(--green)' }}>
          🌾 FieldCropCast
        </div>
        <span className="block text-xs -mt-0.5" style={{ color: 'var(--muted)' }}>
          Farmer Weather Risk Dashboard
        </span>
      </div>
      <div className="ml-auto">
        <button
          onClick={onThemeToggle}
          title="Toggle light/dark mode"
          className="w-9 h-9 flex items-center justify-center rounded-full text-base transition-all cursor-pointer"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text2)' }}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  );
}
