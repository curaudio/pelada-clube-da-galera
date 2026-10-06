import { useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useMe } from "@/components/me-context";
import { signOut } from "@/lib/auth/client";
import { hasGateSessionMarker } from "@/lib/auth/gate-session-marker";
import { useCurrentUser } from "@/lib/auth/use-current-user";

const subscribeToNothing = () => () => {};
const noGateSessionOnServer = () => false;

export function AccountMenu() {
  const user = useCurrentUser();
  const { isAdmin } = useMe();
  const [pending, setPending] = useState(false);
  const gateSession = useSyncExternalStore(
    subscribeToNothing,
    hasGateSessionMarker,
    noGateSessionOnServer,
  );
  if (!user) return null;
  const label = user.displayName ?? user.primaryEmail ?? "Conta";

  return (
    <div className="flex items-center gap-2">
      {isAdmin ? <Badge variant="accent">Admin</Badge> : null}
      <span
        title={label}
        className="grid size-8 place-items-center rounded-full bg-subtle text-sm font-medium"
      >
        {label.charAt(0).toUpperCase()}
      </span>
      {!gateSession ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setPending(true);
            void signOut().catch(() => {
              setPending(false);
              toast.error("Não deu para sair. Tenta de novo.");
            });
          }}
          className="h-9 cursor-pointer rounded-md px-2 text-xs text-muted transition-colors duration-150 hover:text-fg disabled:cursor-wait"
        >
          {pending ? "Saindo…" : "Sair"}
        </button>
      ) : null}
    </div>
  );
}
