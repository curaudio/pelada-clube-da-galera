import { useRouter } from "@tanstack/react-router";
import { Plus } from "lucide-react";
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
import { createMatch } from "@/lib/club.fn";

export function CreateMatchDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [playedAt, setPlayedAt] = useState("");
  const [venue, setVenue] = useState("Society da Vila");
  const [kickoff, setKickoff] = useState("10h");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      await createMatch({ data: { playedAt, venue, kickoff } });
      toast.success("Pelada marcada");
      setOpen(false);
      await router.invalidate();
    } catch {
      toast.error("Não deu para marcar o jogo");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Nova pelada
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Marcar pelada</DialogTitle>
          <DialogDescription>
            Domingo de manhã, campo e lista aberta.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={playedAt}
              onChange={(e) => setPlayedAt(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="venue">Campo</Label>
            <Input
              id="venue"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="kickoff">Horário</Label>
            <Input
              id="kickoff"
              value={kickoff}
              onChange={(e) => setKickoff(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Marcando…" : "Marcar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
