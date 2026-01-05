import React from 'react';
import Image from 'next/image';

export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="https://i.ibb.co/BK4rWsg1/Generated-Image-November-05-2025-7-34-AM.png"
      alt="StayNest Logo"
      className={className}
      width={100}
      height={100}
      aria-hidden="true"
    />
  );
}
