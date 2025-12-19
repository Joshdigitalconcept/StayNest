import React from 'react';
import Image from 'next/image';

export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="https://i.ibb.co/zTzc0Sg/Whats-App-Image-2025-12-19-at-10-10-52-AM-1-1.png"
      alt="StayNest Logo"
      className={className}
      width={100}
      height={100}
      aria-hidden="true"
    />
  );
}
