import { useId, useState } from 'react';
import { PHOTOS, bodyType, carSlug } from '../fields';
import './CarFigure.css';

// Side-profile drawings, facing right, on an 800×320 canvas.
const BODIES = {
  sedan: {
    wheels: [190, 615],
    body: 'M60 210 C56 190 56 168 66 156 C74 147 92 143 110 141 L212 134 C250 112 290 88 340 80 C390 74 450 73 488 78 C520 84 560 112 590 130 L690 144 C722 149 744 160 750 176 C755 190 755 204 750 214 C746 222 738 226 728 226 L675 226 A60 60 0 0 0 555 226 L250 226 A60 60 0 0 0 130 226 L80 226 C68 226 62 220 60 210 Z',
    windows: 'M236 132 C268 112 300 94 340 88 C380 82 440 82 476 86 C500 90 532 108 566 130 Z',
    pillars: [[402, 82, 10, 52]],
    lines: 'M215 137 L590 135 M402 137 V214 M548 137 C552 170 550 196 546 212 M262 137 C258 168 260 192 266 212 M252 214 L553 214',
    handles: [[360, 150], [505, 150]],
    head: 'M716 152 C730 155 742 162 746 170 L716 166 Z',
    tail: 'M62 160 L96 150 L100 162 L64 172 Z',
    mirror: 'M570 128 C580 120 596 120 598 130 L584 136 Z',
  },
  suv: {
    wheels: [190, 610],
    body: 'M58 214 C54 196 54 160 58 118 C60 96 66 78 80 68 C92 60 110 57 140 56 L470 56 C500 56 518 62 534 76 L588 122 L700 134 C728 138 746 150 752 168 C756 184 756 204 752 216 C748 224 740 228 730 228 L670 228 A60 60 0 0 0 550 228 L250 228 A60 60 0 0 0 130 228 L76 228 C64 228 60 222 58 214 Z',
    windows: 'M86 118 C88 96 92 80 104 72 C112 67 124 66 140 66 L466 66 C490 66 506 72 518 84 L564 120 Z',
    pillars: [[172, 66, 12, 54], [396, 66, 10, 54]],
    lines: 'M62 124 L588 126 M396 126 V216 M548 126 C552 160 550 196 546 214 M190 126 C186 150 186 164 190 170 M252 216 L548 216 M150 51 L462 51',
    handles: [[340, 140], [492, 140]],
    head: 'M712 140 C728 142 742 150 748 160 L714 156 Z',
    tail: 'M58 120 L74 120 L72 152 L57 152 Z',
    mirror: 'M566 120 C576 112 592 112 594 122 L580 128 Z',
  },
  hatch: {
    wheels: [195, 600],
    body: 'M64 210 C58 190 58 160 64 140 C70 120 82 100 100 90 C120 80 150 76 190 74 L440 72 C470 72 500 86 530 106 L576 132 L688 146 C720 150 742 162 748 178 C752 192 752 206 746 216 C742 223 736 226 726 226 L660 226 A60 60 0 0 0 540 226 L255 226 A60 60 0 0 0 135 226 L82 226 C70 226 66 220 64 210 Z',
    windows: 'M96 128 C100 112 108 100 120 94 C140 86 170 84 200 84 L432 82 C458 82 484 94 512 112 L552 132 Z',
    pillars: [[176, 84, 14, 48], [392, 82, 10, 50]],
    lines: 'M68 136 L576 136 M392 136 V214 M536 136 C540 168 538 196 534 212 M256 214 L538 214',
    handles: [[345, 150], [490, 150]],
    head: 'M712 154 C728 156 740 164 744 172 L712 168 Z',
    tail: 'M64 140 L84 138 L82 160 L62 160 Z',
    mirror: 'M556 128 C566 120 582 120 584 130 L570 136 Z',
  },
  truck: {
    wheels: [180, 620],
    body: 'M46 214 L46 132 C46 126 50 122 56 122 L330 122 L332 62 C332 54 338 50 346 50 L480 50 C500 50 514 56 524 68 L570 116 L708 128 C736 132 752 146 756 164 L758 214 C758 222 752 228 742 228 L680 228 A60 60 0 0 0 560 228 L240 228 A60 60 0 0 0 120 228 L58 228 C50 228 46 222 46 214 Z',
    windows: 'M346 116 L346 66 C346 62 350 60 354 60 L474 60 C490 60 500 64 510 74 L548 116 Z',
    pillars: [[442, 60, 10, 56]],
    lines: 'M54 134 L326 134 M331 122 V218 M446 122 V216 M560 124 C564 160 562 196 558 214 M242 216 L558 216',
    handles: [[398, 134], [520, 134]],
    head: 'M716 136 C736 140 748 150 752 160 L716 154 Z',
    tail: 'M46 136 L60 136 L60 166 L46 166 Z',
    mirror: 'M556 114 C566 104 584 104 586 116 L570 122 Z',
  },
};

const WHEEL_Y = 240;
const PHOTO_EXTS = ['png', 'webp', 'jpg'];

function Wheel({ x, spin }) {
  return (
    <g transform={`translate(${x} ${WHEEL_Y})`}>
      <circle r="47" className="car-tyre" />
      <circle r="44" className="car-tyre-wall" />
      <g className="car-rim" style={spin}>
        <circle r="31" className="car-rim-face" />
        {[0, 72, 144, 216, 288].map((a) => (
          <path key={a} d="M-4 -8 L-6 -28 L6 -28 L4 -8 Z" transform={`rotate(${a})`} className="car-spoke" />
        ))}
        <circle r="8" className="car-hub" />
      </g>
      <circle r="31" className="car-rim-edge" />
    </g>
  );
}

function CarDrawing({ type, paint, speed }) {
  const uid = useId().replace(/:/g, '');
  const b = BODIES[type];
  const spinning = speed > 1;
  const spin = spinning ? { animationDuration: `${Math.max(0.12, 24 / speed).toFixed(2)}s` } : undefined;

  return (
    <svg className={`car-svg ${spinning ? 'is-moving' : ''}`} viewBox="0 0 800 320" role="img">
      <defs>
        <linearGradient id={`shade-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.38" />
          <stop offset="0.42" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.62" stopColor="#000" stopOpacity="0.05" />
          <stop offset="1" stopColor="#000" stopOpacity="0.32" />
        </linearGradient>
        <linearGradient id={`glass-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3a4048" />
          <stop offset="0.55" stopColor="#15181c" />
          <stop offset="1" stopColor="#262b31" />
        </linearGradient>
        <radialGradient id={`shadow-${uid}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#000" stopOpacity="0.32" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="402" cy="288" rx="380" ry="16" fill={`url(#shadow-${uid})`} />

      <path d={b.mirror} fill={paint} />
      <path d={b.body} fill={paint} />
      <path d={b.body} fill={`url(#shade-${uid})`} />
      <path d={b.windows} fill={`url(#glass-${uid})`} />
      {b.pillars.map(([x, y, w, h]) => (
        <rect key={x} x={x} y={y} width={w} height={h} fill={paint} />
      ))}
      <path d={b.lines} className="car-lines" />
      {b.handles.map(([x, y]) => (
        <rect key={x} x={x} y={y} width="24" height="5" rx="2.5" className="car-handle" />
      ))}
      <path d={b.head} className="car-headlight" />
      <path d={b.tail} className="car-taillight" />
      <path d={b.mirror} fill="#000" opacity="0.18" />

      {b.wheels.map((x) => (
        <Wheel key={x} x={x} spin={spin} />
      ))}
    </svg>
  );
}

/**
 * Shows the Wikimedia cutout from carPhotos.json, or a user photo at
 * /cars/<make>-<model>.(png|webp|jpg), otherwise a drawing of the body type in the chosen paint.
 */
export default function CarFigure(props) {
  const slug = carSlug(props.make || '', props.model || '');
  return <CarFigureInner key={slug} slug={slug} {...props} />;
}

function CarFigureInner({ slug, make, model, paint = '#c9ccd0', speed = 0, className = '', showCredit = false }) {
  const credit = PHOTOS[slug];
  const sources = credit ? [`/cars/${slug}.webp`] : PHOTO_EXTS.map((ext) => `/cars/${slug}.${ext}`);
  const [attempt, setAttempt] = useState(0);
  const [photoReady, setPhotoReady] = useState(false);

  const tryingPhoto = attempt < sources.length;
  const isPhoto = tryingPhoto && (photoReady || credit);

  return (
    <figure className={`car-figure ${isPhoto ? 'is-photo' : ''} ${className}`} aria-label={`${make} ${model}`}>
      {tryingPhoto && (
        <img
          key={sources[attempt]}
          className={`car-photo ${photoReady ? 'is-ready' : ''}`}
          src={sources[attempt]}
          alt={`${make} ${model}`}
          onLoad={() => setPhotoReady(true)}
          onError={() => setAttempt((n) => n + 1)}
        />
      )}
      {!isPhoto && <CarDrawing type={bodyType(model)} paint={paint} speed={speed} />}
      {showCredit && credit && photoReady && (
        <figcaption className="car-credit">
          Photo:{' '}
          <a href={credit.page} target="_blank" rel="noreferrer">
            {credit.author}
          </a>
          , {credit.license}, via Wikimedia Commons
        </figcaption>
      )}
    </figure>
  );
}
