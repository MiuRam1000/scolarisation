import { useQuery } from "@tanstack/react-query";
import { fetchSession } from "../lib/auth";

/** Session serveur courante. `null` = non connecté. */
export function useSessionQuery() {
  return useQuery({
    queryKey: ["session"],
    queryFn: fetchSession,
    staleTime: 60_000,
    retry: false,
  });
}
