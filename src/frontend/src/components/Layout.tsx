import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { LogOut } from "lucide-react";
import type { ReactNode } from "react";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

interface LayoutProps {
  title: string;
  subtitle?: string;
  navItems?: NavItem[];
  children: ReactNode;
}

export function Layout({
  title,
  subtitle,
  navItems = [],
  children,
}: LayoutProps) {
  const { profile, isAdmin, clear } = useAuth();

  const displayName = isAdmin ? "Administrador" : (profile?.name ?? "Drive2");

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header
        data-ocid="header"
        className="sticky top-0 z-20 border-b border-border bg-card shadow-subtle"
      >
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground font-display text-lg font-bold">
              D
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-base font-bold leading-tight">
                {title}
              </p>
              {subtitle ? (
                <p className="truncate text-xs text-muted-foreground">
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {displayName}
            </span>
            <Button
              data-ocid="logout_button"
              variant="ghost"
              size="icon"
              aria-label="Sair"
              onClick={clear}
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-24 sm:pb-6">
        {children}
      </main>

      {navItems.length > 0 ? (
        <nav
          data-ocid="bottom_nav"
          className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card shadow-subtle sm:hidden"
        >
          <div className="mx-auto flex max-w-5xl items-stretch justify-around">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 px-2 py-2.5 text-[11px] font-medium text-muted-foreground transition-colors",
                  "aria-[current=page]:text-primary",
                )}
              >
                <item.icon className="size-5" />
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
