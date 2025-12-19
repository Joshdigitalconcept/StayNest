"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/user-nav";
import { Logo } from "./logo";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Logo className="h-8 w-8" />
            <span className="font-bold sm:inline-block font-headline text-lg">
              StayNest
            </span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            <Button variant="ghost" asChild>
              <Link href="#">Become a Host</Link>
            </Button>
            <UserNav />
          </nav>
        </div>
      </div>
    </header>
  );
}
