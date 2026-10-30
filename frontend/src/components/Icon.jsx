// Thin-line icon set (24px grid, 1.6 stroke).

const PATHS = {
  gauge: <><path d="M4 15a8 8 0 1 1 16 0" /><path d="m12 15 4-5" /><circle cx="12" cy="15" r="1.2" /></>,
  speed: <><path d="M3 12h4" /><path d="M5 8h5" /><path d="M5 16h5" /><path d="M14 6h3a4 4 0 0 1 0 12h-3" /></>,
  activity: <path d="M3 12h4l3-7 4 14 3-7h4" />,
  pedal: <><rect x="7" y="3" width="10" height="15" rx="2" /><path d="M10 7h4M10 10.5h4M10 14h4" /><path d="M9 21h6" /></>,
  thermo: <><path d="M10 14.5V5a2 2 0 1 1 4 0v9.5a4 4 0 1 1-4 0Z" /><path d="M12 11v6" /></>,
  wind: <><path d="M3 8h10a3 3 0 1 0-3-3" /><path d="M3 12h15a3 3 0 1 1-3 3" /><path d="M3 16h7" /></>,
  fuel: <><path d="M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16" /><path d="M4 21h12" /><path d="M8 8h4" /><path d="M15 10h2a2 2 0 0 1 2 2v4a1.5 1.5 0 0 0 3 0V8l-3-3" /></>,
  battery: <><rect x="3" y="7" width="16" height="10" rx="2" /><path d="M21 10.5v3" /><path d="M10 9.5 8 12h4l-2 2.5" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  moon: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />,
  contrast: <><circle cx="12" cy="12" r="9" /><path d="M12 3v18a9 9 0 0 0 0-18Z" fill="currentColor" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><circle cx="12" cy="7.8" r="0.6" fill="currentColor" /></>,
  check: <><circle cx="12" cy="12" r="9" /><path d="m8 12.5 2.8 2.8L16.5 9.5" /></>,
  alert: <><path d="M12 3 2 20h20L12 3Z" /><path d="M12 10v4" /><circle cx="12" cy="17" r="0.6" fill="currentColor" /></>,
  arrowLeft: <path d="M19 12H5m6-6-6 6 6 6" />,
  arrowRight: <path d="M5 12h14m-6-6 6 6-6 6" />,
  database: <><ellipse cx="12" cy="5.5" rx="7" ry="2.5" /><path d="M5 5.5v13c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-13" /><path d="M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5" /></>,
  refresh: <><path d="M20 11a8 8 0 0 0-14.3-4.9L4 8" /><path d="M4 4v4h4" /><path d="M4 13a8 8 0 0 0 14.3 4.9L20 16" /><path d="M20 20v-4h-4" /></>,
  car: <><path d="M3 16v-3l2.5-5h13L21 13v3" /><path d="M3 16h18" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /></>,
  swap: <><path d="M4 8h14l-4-4" /><path d="M20 16H6l4 4" /></>,
  code: <><path d="M4 7h16M4 12h10M4 17h7" /></>,
  live: <><circle cx="12" cy="12" r="2.5" /><path d="M7.5 7.5a6.4 6.4 0 0 0 0 9M16.5 7.5a6.4 6.4 0 0 1 0 9" /></>,
};

export default function Icon({ name, size = 18, className = '', title }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}
      {PATHS[name]}
    </svg>
  );
}
