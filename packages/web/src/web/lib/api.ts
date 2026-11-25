import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type { AppRouterClient } from "../../api";

const link = new RPCLink({
  url: `${window.location.origin}/api/rpc`,
  // POST systématique : les procédures authentifiées lisent le cookie de session
  // et évitent toute ambiguïté de méthode côté handler.
  method: "POST",
});

/** Direct typed client: await client.ping() */
export const client: AppRouterClient = createORPCClient(link);

/** TanStack Query helpers: useQuery(orpc.ping.queryOptions()) */
export const orpc = createTanstackQueryUtils(client);
