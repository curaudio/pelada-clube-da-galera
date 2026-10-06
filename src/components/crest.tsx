import { cn } from "@/lib/utils";

export function Crest({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 56"
      className={cn("text-accent", className)}
      aria-hidden="true"
    >
      <path
        d="M24 2 L44 10 V28 C44 40 34 50 24 54 C14 50 4 40 4 28 V10 Z"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M24 14 C20 14 17 17 17 22 C17 28 24 34 24 34 C24 34 31 28 31 22 C31 17 28 14 24 14 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="24" cy="22" r="2" fill="currentColor" />
    </svg>
  );
}
