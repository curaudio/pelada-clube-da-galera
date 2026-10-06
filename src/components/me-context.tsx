import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getMe } from "@/lib/club.fn";

type Me = { role: "admin" | "member"; playerId: number | null };

type MeState = {
  me: Me | null;
  isAdmin: boolean;
  /** Pode mexer na presença/perfil desse jogador (admin ou o próprio). */
  canEditPlayer: (playerId: number) => boolean;
  refresh: () => Promise<void>;
};

const MeContext = createContext<MeState>({
  me: null,
  isAdmin: false,
  canEditPlayer: () => false,
  refresh: async () => {},
});

export function MeProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);

  const refresh = useCallback(async () => {
    try {
      setMe(await getMe());
    } catch {
      setMe(null);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<MeState>(
    () => ({
      me,
      isAdmin: me?.role === "admin",
      canEditPlayer: (playerId) =>
        me?.role === "admin" || (me !== null && me.playerId === playerId),
      refresh,
    }),
    [me, refresh],
  );

  return <MeContext.Provider value={value}>{children}</MeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useMe() {
  return useContext(MeContext);
}
