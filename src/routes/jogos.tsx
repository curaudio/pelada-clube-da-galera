import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/jogos")({
  ssr: false,
  component: JogosLayout,
});

function JogosLayout() {
  return <Outlet />;
}
