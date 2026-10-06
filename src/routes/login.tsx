import { createFileRoute, Navigate, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Crest } from "@/components/crest";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GROK_PROVIDERS, authClient, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({ component: LoginPage });

const ERRORS: Record<string, string> = {
  USER_ALREADY_EXISTS: "Já existe uma conta com esse e-mail. Tente entrar.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
    "Já existe uma conta com esse e-mail. Tente entrar.",
  INVALID_EMAIL_OR_PASSWORD: "E-mail ou senha incorretos.",
  INVALID_PASSWORD: "E-mail ou senha incorretos.",
  INVALID_EMAIL: "E-mail inválido.",
  PASSWORD_TOO_SHORT: "A senha precisa ter pelo menos 8 caracteres.",
};

function LoginPage() {
  const { user, isPending } = useCurrentUserState();
  const router = useRouter();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"entrar" | "cadastrar">("entrar");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  if (!isPending && user) return <Navigate to="/" />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const result =
        mode === "cadastrar"
          ? await authClient.signUp.email({ name: name.trim(), email, password })
          : await authClient.signIn.email({ email, password });
      if (result.error) {
        const code = result.error.code ?? "";
        toast.error(
          ERRORS[code] ??
            (mode === "cadastrar"
              ? "Não deu para criar a conta."
              : "Não deu para entrar."),
        );
        return;
      }
      await router.invalidate();
      await navigate({ to: "/" });
    } catch {
      toast.error("Sem conexão. Tenta de novo.");
    } finally {
      setPending(false);
    }
  }

  const signingUp = mode === "cadastrar";

  return (
    <main className="mx-auto grid min-h-dvh w-full max-w-sm content-center gap-6 px-5 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <Crest className="h-14 w-12" />
        <h1 className="font-display text-4xl leading-none">Pelada</h1>
        <p className="text-sm text-muted">
          {signingUp
            ? "Crie sua conta para confirmar presença e ver o sorteio."
            : "Entre para ver a lista, o sorteio e a tabela."}
        </p>
      </div>

      <div
        role="tablist"
        className="grid grid-cols-2 rounded-lg bg-subtle p-1 text-sm"
      >
        {(["entrar", "cadastrar"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={cn(
              "h-10 cursor-pointer rounded-md transition-colors duration-150",
              mode === m ? "bg-surface text-fg" : "text-muted hover:text-fg",
            )}
          >
            {m === "entrar" ? "Entrar" : "Criar conta"}
          </button>
        ))}
      </div>

      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        {signingUp ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Seu nome</Label>
            <Input
              id="name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
            />
          </div>
        ) : null}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            autoComplete={signingUp ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          {signingUp ? (
            <p className="text-xs text-muted">Pelo menos 8 caracteres.</p>
          ) : null}
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Aguarde…" : signingUp ? "Criar conta" : "Entrar"}
        </Button>
      </form>

      {GROK_PROVIDERS.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-center text-xs text-muted">ou</p>
          {GROK_PROVIDERS.map((p) => (
            <Button
              key={p.providerId}
              type="button"
              variant="secondary"
              onClick={() => signIn(p.providerId, { callbackURL: "/" })}
            >
              Continuar com {p.label}
            </Button>
          ))}
        </div>
      ) : null}

      {signingUp ? (
        <p className="text-center text-xs text-muted">
          A primeira conta criada vira a administradora da pelada.
        </p>
      ) : null}
    </main>
  );
}
