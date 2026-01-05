import React from 'react';
import Image from 'next/image';

export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="StayNest Logo"
      className={className}
      width={100}
      height={100}
      aria-hidden="true"
    />
  );
}
