'use client';

import { Calendar, Bell, BookMarked, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface ParticipantSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const navItems = [
  { label: 'Events', href: '/', icon: Calendar },
  { label: 'My Schedule', href: '/schedule', icon: BookMarked },
  { label: 'Notifications', href: '/notifications', icon: Bell },
];

export function ParticipantSidebar({ open, onOpenChange }: ParticipantSidebarProps) {
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span className="text-violet-400 font-bold text-xl">⚡</span>
            <span className="text-white font-bold text-xl">Flowgram</span>
          </SheetTitle>
        </SheetHeader>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <SheetClose asChild key={href}>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    active
                      ? 'bg-violet-600/20 text-violet-300'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              </SheetClose>
            );
          })}
        </nav>

        <div className="px-4 pb-6">
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-colors w-full">
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
