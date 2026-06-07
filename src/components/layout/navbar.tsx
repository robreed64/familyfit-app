"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Home, Users, PlusCircle, User, LogOut, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/groups", label: "Groups", icon: Users },
  { href: "/log", label: "Log", icon: PlusCircle },
  { href: "/profile", label: "Profile", icon: User },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <>
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/80 backdrop-blur-xl border-b border-purple-100 dark:bg-gray-900/80 dark:border-purple-900">
        <div className="max-w-screen-lg mx-auto h-full px-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-lg bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              FamilyFit
            </span>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="gap-2 text-gray-500"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </header>

      {/* Bottom nav (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-purple-100 dark:bg-gray-900/90 dark:border-purple-900 md:hidden">
        <div className="flex items-center justify-around h-16 max-w-screen-sm mx-auto px-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all",
                  active
                    ? "text-purple-600 bg-purple-50 dark:bg-purple-950 dark:text-purple-400"
                    : "text-gray-400 hover:text-purple-500"
                )}
              >
                <Icon className={cn("w-5 h-5", href === "/log" && "text-inherit")} />
                <span className="text-xs font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Side nav (desktop) */}
      <aside className="fixed top-16 left-0 bottom-0 w-56 hidden md:flex flex-col p-4 gap-1 border-r border-purple-100 dark:border-purple-900">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
                active
                  ? "bg-gradient-to-r from-violet-100 to-purple-100 text-purple-700 dark:from-violet-950 dark:to-purple-950 dark:text-purple-300"
                  : "text-gray-500 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950"
              )}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          );
        })}
      </aside>
    </>
  );
}
