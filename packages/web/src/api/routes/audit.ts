import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../database";
import { auditLogs } from "../database/schema";
import { authed, requireRole } from "../auth/guards";
import { assertTrustedOrigin } from "../auth/origin";

/** Consultation du journal d'audit (§39). */
export const auditApi = {
  list: authed
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(200).default(100),
        })
        .default({ limit: 100 }),
    )
    .handler(async ({ context, input }) => {
      assertTrustedOrigin(context.headers);
      if (context.user.role !== "platform") {
        requireRole(context.user.role, ["direction", "administration"]);
      }
      const rows = await db
        .select()
        .from(auditLogs)
        .where(
          context.user.role === "platform"
            ? undefined
            : eq(auditLogs.establishmentId, context.user.establishmentId ?? ""),
        )
        .orderBy(desc(auditLogs.createdAt))
        .limit(input.limit);
      return rows;
    }),
};
