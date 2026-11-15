import { useId } from 'react';
import type { Silhouette } from '@/data';

type Props = {
  silhouette: Silhouette;
  tone: 'dark' | 'light';
  className?: string;
  label?: string;
};

const BODY: Record<Silhouette, string> = {
  kurta:
    'M232 176 L300 164 L368 176 L392 232 L452 286 L418 330 L392 292 L396 372 L412 646 Q300 672 188 646 L204 372 L208 292 L182 330 L148 286 L208 232 Z',
  shirt:
    'M236 180 L300 168 L364 180 L386 226 L440 276 L410 316 L386 282 L390 350 L396 480 Q300 500 204 480 L210 350 L214 282 L190 316 L160 276 L214 226 Z',
  coat:
    'M226 176 L300 162 L374 176 L400 236 L462 300 L426 348 L398 306 L404 400 L420 720 Q300 748 180 720 L196 400 L202 306 L174 348 L138 300 L200 236 Z',
  trouser:
    'M200 186 H400 L410 300 L378 716 H318 L300 430 L282 716 H222 L190 300 Z',
  tee:
    'M240 190 L300 178 L360 190 L410 226 L432 280 L392 306 L378 272 L382 340 L386 470 Q300 488 214 470 L218 340 L222 272 L208 306 L168 280 L190 226 Z',
  tote: 'M203 322 H397 L384 566 Q300 582 216 566 Z',
  scarf:
    'M180 206 Q300 152 420 214 L442 306 Q400 336 378 304 L392 620 Q300 664 208 620 L222 304 Q200 336 158 306 Z',
};

const DETAILS: Partial<Record<Silhouette, string[]>> = {
  kurta: ['M282 170 L300 206 L318 170', 'M300 206 L300 640'],
  shirt: ['M282 172 L300 208 L318 172', 'M300 208 L300 486'],
  coat: ['M300 168 L264 232 L300 300 L336 232 Z', 'M300 300 L300 730'],
  trouser: ['M300 196 L300 424', 'M206 250 H394'],
  tee: ['M278 184 Q300 210 322 184'],
  tote: ['M252 322 L252 268 Q300 236 348 268 L348 322'],
  scarf: ['M208 330 Q300 372 392 330'],
};

export default function Media({ silhouette, tone, className, label }: Props) {
  const raw = useId();
  const uid = raw.replace(/[^a-zA-Z0-9]/g, '');
  const dark = tone === 'dark';
  const bgFrom = dark ? '#1d1d1d' : '#f7f6f3';
  const bgTo = dark ? '#080808' : '#e6e4df';
  const fillFrom = dark ? '#333333' : '#ffffff';
  const fillTo = dark ? '#050505' : '#d9d7d1';
  const ink = dark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.18)';

  return (
    <svg
      className={className}
      viewBox="0 0 600 800"
      role="img"
      aria-label={label ?? `${silhouette} garment illustration`}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={`bg${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={bgFrom} />
          <stop offset="100%" stopColor={bgTo} />
        </linearGradient>
        <linearGradient id={`fg${uid}`} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor={fillFrom} />
          <stop offset="100%" stopColor={fillTo} />
        </linearGradient>
        <radialGradient id={`glow${uid}`} cx="0.5" cy="0.38" r="0.62">
          <stop offset="0%" stopColor={dark ? '#ffffff' : '#000000'} stopOpacity={dark ? 0.1 : 0.06} />
          <stop offset="100%" stopColor={dark ? '#ffffff' : '#000000'} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="600" height="800" fill={`url(#bg${uid})`} />
      <rect width="600" height="800" fill={`url(#glow${uid})`} />
      <ellipse cx="300" cy="742" rx="150" ry="18" fill="#000" opacity={dark ? 0.45 : 0.08} />

      <path d={BODY[silhouette]} fill={`url(#fg${uid})`} />
      <path d={BODY[silhouette]} fill="none" stroke={ink} strokeWidth="2" strokeLinejoin="round" />

      {(DETAILS[silhouette] ?? []).map((d, index) => (
        <path
          key={index}
          d={d}
          fill={silhouette === 'coat' && index === 0 ? ink : 'none'}
          stroke={ink}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}
