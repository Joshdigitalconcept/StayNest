import React from 'react';

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="nestGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#4A90E2' }} />
          <stop offset="50%" style={{ stopColor: '#50E3C2' }} />
          <stop offset="100%" style={{ stopColor: '#E5C4A5' }} />
        </linearGradient>
      </defs>
      <path
        d="M50,15 A40,25 0 1,0 90,65 Q80,85 50,90 A40,25 0 1,0 10,65 Q20,85 50,90"
        fill="none"
        stroke="url(#nestGradient)"
        strokeWidth="5"
        transform="rotate(10 50 50)"
      />
      <path
         d="M50,25 A35,20 0 1,1 15,60 Q25,80 50,85 A35,20 0 1,1 85,60 Q75,80 50,85"
        fill="none"
        stroke="url(#nestGradient)"
        strokeWidth="4"
        strokeDasharray="5, 5"
         transform="rotate(-10 50 50)"
      />
      <path
        d="M50 35 L30 50 H35 V65 H65 V50 H70 Z"
        fill="hsl(var(--primary))"
      />
       <path d="M45 55 H55 V65 H45 Z" fill="hsl(var(--accent))" />
    </svg>
  );
}
