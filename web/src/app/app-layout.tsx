import { ListVideoIcon, LogOutIcon, SettingsIcon } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { Link, NavLink, Outlet } from "react-router";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { signOut } from "@/features/notifications/api";
import { cn } from "@/lib/utils";

const NAV: { to: string; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { to: "/", label: "Watchlist", icon: ListVideoIcon },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

function AccountMenu({ email }: { email: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-lg" className="size-11 rounded-full md:size-10" aria-label="Account menu">
          <span className="bg-brand grid size-8 place-items-center rounded-full text-sm font-semibold text-white uppercase">
            {email.charAt(0) || "?"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <span className="block text-xs text-muted-foreground">Signed in as</span>
          <span className="block truncate font-medium">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/settings">
            <SettingsIcon /> Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={() => signOut()}>
          <LogOutIcon /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Presentational shell, also used by the dev gallery */
export function AppShell({ email, children }: { email: string; children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="pt-safe sticky top-0 z-30 border-b bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6 md:h-16 3xl:max-w-[100rem] 4xl:max-w-[120rem]">
          <Link to="/" aria-label="Anime Watcher home" className="shrink-0">
            <Logo />
          </Link>
          {/* tablet & desktop: top navigation */}
          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {NAV.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end
                className={({ isActive }) =>
                  cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground",
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto">
            <AccountMenu email={email} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pt-5 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-6 md:pt-8 md:pb-12 3xl:max-w-[100rem] 4xl:max-w-[120rem]">
        {children}
      </main>

      {/* phones: thumb-reachable tab bar */}
      <nav
        aria-label="Main"
        className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t bg-background/90 backdrop-blur-lg md:hidden"
      >
        <ul className="mx-auto grid max-w-md grid-cols-2">
          {NAV.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end
                className={({ isActive }) =>
                  cn(
                    "flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )
                }
              >
                <Icon className="size-6" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export function AppLayout() {
  const { session } = useAuth();
  return (
    <AppShell email={session?.user.email ?? ""}>
      <Outlet />
    </AppShell>
  );
}
