import { cn } from "@/lib/utils";

export function FormPills({ form }: { form: Array<"W" | "D" | "L"> }) {
  if (form.length === 0) {
    return <span className="text-xs text-muted">—</span>;
  }
  return (
    <span className="flex gap-0.5">
      {form.map((r, i) => (
        <span
          key={`${r}-${i}`}
          className={cn(
            "grid size-5 place-items-center rounded-xs text-[0.6rem] font-medium",
            r === "W" && "bg-win/20 text-win",
            r === "D" && "bg-subtle text-muted",
            r === "L" && "bg-loss/20 text-loss",
          )}
        >
          {r === "W" ? "V" : r === "D" ? "E" : "D"}
        </span>
      ))}
    </span>
  );
}
