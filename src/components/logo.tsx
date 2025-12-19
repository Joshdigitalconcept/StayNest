import React from 'react';
import Image from 'next/image';

export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="https://i.ibb.co/3sW2g9p/Stay-Nest-Final-Logo-01-2.png"
      alt="StayNest Logo"
      className={className}
      width={100}
      height={100}
      aria-hidden="true"
    />
  );
}
