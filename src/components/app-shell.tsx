import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { CalendarDays, House, Shuffle, Trophy, Users } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { AccountMenu } from "@/components/account-menu";
import { Crest } from "@/components/crest";
import { MeProvider } from "@/components/me-context";
import { ProfileBanner } from "@/components/profile-banner";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Início", icon: House },
  { to: "/elenco", label: "Elenco", icon: Users },
  { to: "/jogos", label: "Jogos", icon: CalendarDays },
  { to: "/tabela", label: "Tabela", icon: Trophy },
  { to: "/sorteio", label: "Sorteio", icon: Shuffle },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const router = useRouter();
  const { user, isPending } = useCurrentUserState();
  const sawSignedOut = useRef(false);

  // Os dados das telas só carregam com sessão. Se a pessoa entrou agora,
  // recarrega o que tinha falhado por estar deslogada.
  useEffect(() => {
    if (isPending) return;
    if (!user) {
      sawSignedOut.current = true;
    } else if (sawSignedOut.current) {
      sawSignedOut.current = false;
      void router.invalidate();
    }
  }, [user, isPending, router]);

  if (pathname === "/login") return <>{children}</>;

  if (isPending) {
    return (
      <div className="grid min-h-dvh place-items-center bg-bg">
        <Crest className="h-12 w-10 animate-pulse" />
      </div>
    );
  }

  if (!user) return <RedirectToSignIn />;

  return (
    <MeProvider>
      <Shell pathname={pathname}>{children}</Shell>
    </MeProvider>
  );
}

function Shell({
  pathname,
  children,
}: {
  pathname: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-bg/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <Crest className="h-8 w-7" />
            <div className="leading-none">
              <p className="font-display text-xl tracking-tight">Pelada</p>
              <p className="text-[0.65rem] tracking-[0.18em] text-muted uppercase">
                Clube da galera
              </p>
            </div>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const active =
                item.to === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm transition-colors duration-150",
                    active ? "bg-subtle text-fg" : "text-muted hover:text-fg",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <AccountMenu />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 pt-6 pb-28 md:pb-12">
        <ProfileBanner />
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:hidden">
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active =
              item.to === "/"
                ? pathname === "/"
                : pathname.startsWith(item.to);
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "flex h-16 flex-col items-center justify-center gap-1 text-[0.65rem] tracking-wide",
                    active ? "text-fg" : "text-muted",
                  )}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.2 : 1.7} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
