import { useRouter } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { addPlayer, deletePlayer, updatePlayer } from "@/lib/club.fn";

export function AddPlayerDialog() {
  return <PlayerDialog />;
}

export function EditPlayerDialog({
  player,
  canDelete = false,
}: {
  player: Player;
  canDelete?: boolean;
}) {
  return <PlayerDialog player={player} canDelete={canDelete} />;
}

function PlayerDialog({
  player,
  canDelete = false,
}: {
  player?: Player;
  canDelete?: boolean;
}) {
  const router = useRouter();
  const editing = Boolean(player);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(player?.name ?? "");
  const [nickname, setNickname] = useState(player?.nickname ?? "");
  const [position, setPosition] = useState<Position>(player?.position ?? "MEI");
  const [number, setNumber] = useState(
    player?.number != null ? String(player.number) : "",
  );
  const [pending, setPending] = useState(false);

  async function onDelete() {
    if (!player) return;
    if (
      !window.confirm(
        `Remover ${player.nickname}? Os gols e presenças dele nas peladas também saem.`,
      )
    )
      return;
    setPending(true);
    try {
      await deletePlayer({ data: { id: player.id } });
      toast.success(`${player.nickname} saiu do elenco`);
      setOpen(false);
      await router.invalidate();
    } catch {
      toast.error("Não deu para remover o jogador");
    } finally {
      setPending(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const payload = {
        name,
        nickname,
        position,
        number: number ? Number(number) : null,
      };
      if (player) {
        await updatePlayer({ data: { ...payload, id: player.id } });
        toast.success(`${nickname} atualizado`);
        setOpen(false);
      } else {
        await addPlayer({ data: payload });
        toast.success(`${nickname} entrou no elenco`);
        setOpen(false);
        setName("");
        setNickname("");
        setNumber("");
        setPosition("MEI");
      }
      await router.invalidate();
    } catch {
      toast.error("Não deu para salvar o jogador");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {editing ? (
          <Button
            variant="secondary"
            size="icon"
            className="size-9 shrink-0"
            aria-label={`Editar ${player?.nickname}`}
          >
            <Pencil className="size-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="size-4" />
            Novo jogador
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Editar jogador" : "Chamar para o racha"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Muda os dados dele em todas as peladas."
              : "Entra no elenco permanente da pelada."}
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nickname">Apelido</Label>
            <Input
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Fefo"
              required
              minLength={2}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Fernando Rocha"
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
              <Label htmlFor="number">Camisa</Label>
              <Input
                id="number"
                inputMode="numeric"
                value={number}
                onChange={(e) => setNumber(e.target.value.replace(/\D/g, ""))}
                placeholder="10"
              />
            </div>
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando…" : editing ? "Salvar" : "Adicionar"}
          </Button>
          {editing && canDelete ? (
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={onDelete}
            >
              <Trash2 className="size-4" />
              Remover do elenco
            </Button>
          ) : null}
        </form>
      </DialogContent>
    </Dialog>
  );
}
