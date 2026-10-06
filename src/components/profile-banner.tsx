import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useMe } from "@/components/me-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { POSITIONS, type Player, type Position } from "@/lib/club";
import { claimPlayer, createMyPlayer, getBoard } from "@/lib/club.fn";

/** Aviso para quem ainda não vinculou a conta a um jogador do elenco. */
export function ProfileBanner() {
  const { me, refresh } = useMe();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [free, setFree] = useState<Player[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [pending, setPending] = useState(false);
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [position, setPosition] = useState<Position>("MEI");
  const [number, setNumber] = useState("");

  if (!me || me.playerId || hidden) return null;

  async function openDialog() {
    setOpen(true);
    try {
      const board = await getBoard();
      const claimed = new Set(board.claimedPlayerIds);
      setFree(board.players.filter((p) => !claimed.has(p.id)));
    } catch {
      setFree([]);
    }
  }

  async function done(message: string) {
    toast.success(message);
    setOpen(false);
    await refresh();
    await router.invalidate();
  }

  async function claim(player: Player) {
    setPending(true);
    try {
      await claimPlayer({ data: { playerId: player.id } });
      await done(`Você é o ${player.nickname}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não deu para vincular");
      await openDialog();
    } finally {
      setPending(false);
    }
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      await createMyPlayer({
        data: { name, nickname, position, number: number ? Number(number) : null },
      });
      await done(`${nickname} entrou no elenco`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não deu para criar");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]">
        <p className="text-sm">
          Escolha quem você é no elenco para confirmar presença.
        </p>
        <div className="flex gap-2">
          <Button size="sm" onClick={openDialog}>
            Escolher meu nome
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setHidden(true)}>
            Agora não
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quem é você?</DialogTitle>
            <DialogDescription>
              {creating
                ? "Cria o seu jogador no elenco."
                : "Toque no seu nome. Se não está na lista, crie o seu."}
            </DialogDescription>
          </DialogHeader>

          {creating ? (
            <form className="flex flex-col gap-4" onSubmit={create}>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="me-nickname">Apelido</Label>
                <Input
                  id="me-nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  required
                  minLength={2}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="me-name">Nome</Label>
                <Input
                  id="me-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Posição</Label>
                  <Select
                    value={position}
                    onValueChange={(v) => setPosition(v as Position)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {POSITIONS.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="me-number">Camisa</Label>
                  <Input
                    id="me-number"
                    inputMode="numeric"
                    value={number}
                    onChange={(e) => setNumber(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
              </div>
              <Button type="submit" disabled={pending}>
                {pending ? "Salvando…" : "Entrar no elenco"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setCreating(false)}
              >
                Voltar para a lista
              </Button>
            </form>
          ) : (
            <div className="flex flex-col gap-2">
              {free === null ? (
                <p className="text-sm text-muted">Carregando…</p>
              ) : free.length === 0 ? (
                <p className="text-sm text-muted">
                  Todo mundo da lista já tem conta.
                </p>
              ) : (
                <ul className="flex max-h-72 flex-col gap-2 overflow-y-auto">
                  {free.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => claim(p)}
                        className="flex w-full cursor-pointer items-center gap-3 rounded-lg bg-subtle/60 px-3 py-3 text-left transition-colors duration-150 hover:bg-subtle disabled:cursor-wait"
                      >
                        <span className="w-7 text-center font-display text-xl text-accent tabular-nums">
                          {p.number ?? "–"}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {p.nickname}
                          </span>
                          <span className="block truncate text-xs text-muted">
                            {p.name}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <Button variant="secondary" onClick={() => setCreating(true)}>
                Não estou na lista
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
