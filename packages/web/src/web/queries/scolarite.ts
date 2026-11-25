import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";
import { createScolariteRow, type ScolariteModule, type ScolariteSnapshot } from "../lib/scolarite";

/** Dossiers réels de l'établissement de l'utilisateur connecté. */
export function useScolariteSnapshot() {
  return useQuery({
    ...orpc.scolarite.snapshot.queryOptions(),
    staleTime: 10_000,
  });
}

/** Référentiels réels : années, périodes, matières, salles, paramètres. */
export function useReferentielSnapshot() {
  return useQuery({
    ...orpc.referentiel.snapshot.queryOptions(),
    staleTime: 10_000,
  });
}

/** Évaluations, notes et bulletins réels. */
export function usePedagogieSnapshot() {
  return useQuery({
    ...orpc.pedagogie.snapshot.queryOptions(),
    staleTime: 10_000,
  });
}

/** Emploi du temps réel, créneaux et conflits. */
export function usePlanningSnapshot() {
  return useQuery({
    ...orpc.planning.snapshot.queryOptions(),
    staleTime: 10_000,
  });
}

/** Feuille d'appel réelle pour une classe et une date. */
export function useAttendanceSnapshot(
  input: { classId?: string; date: string },
  enabled = true,
) {
  return useQuery({
    ...orpc.vieScolaire.attendanceSnapshot.queryOptions({ input }),
    enabled,
    staleTime: 5_000,
  });
}

/** Incidents et suivi éducatif réels. */
export function useDisciplineSnapshot(enabled = true) {
  return useQuery({
    ...orpc.vieScolaire.disciplineSnapshot.queryOptions(),
    enabled,
    staleTime: 10_000,
  });
}

/** Frais, encaissements, soldes et clôtures de caisse. */
export function useFinanceSnapshot(enabled = true) {
  return useQuery({
    ...orpc.finance.snapshot.queryOptions(),
    enabled,
    staleTime: 5_000,
  });
}

/** Notifications internes de l'utilisateur connecté. */
export function useNotificationsSnapshot(enabled = true) {
  return useQuery({
    ...orpc.notifications.snapshot.queryOptions(),
    enabled,
    staleTime: 5_000,
  });
}

/** Cahier de textes : séances de cours et devoirs. */
export function useLessonsSnapshot(enabled = true) {
  return useQuery({
    ...orpc.lessons.snapshot.queryOptions(),
    enabled,
    staleTime: 10_000,
  });
}

/** Examens et délibérations. */
export function useExamsSnapshot(enabled = true) {
  return useQuery({
    ...orpc.exams.snapshot.queryOptions(),
    enabled,
    staleTime: 10_000,
  });
}

/** Documents administratifs générés et numérotés. */
export function useAdministrativeDocumentsSnapshot(enabled = true) {
  return useQuery({
    ...orpc.documents.snapshot.queryOptions(),
    enabled,
    staleTime: 5_000,
  });
}

/** Annonces publiées et brouillons visibles selon le rôle. */
export function useCommunicationSnapshot(enabled = true) {
  return useQuery({
    ...orpc.communication.snapshot.queryOptions(),
    enabled,
    staleTime: 5_000,
  });
}

/** Journal d'audit global (direction, administration, plateforme). */
export function useAuditLogs(enabled: boolean) {
  return useQuery({
    ...orpc.audit.list.queryOptions({ input: { limit: 100 } }),
    enabled,
    staleTime: 5_000,
  });
}

export function useCreateScolariteRow(snapshot?: ScolariteSnapshot) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ module, values }: { module: ScolariteModule; values: Record<string, string> }) =>
      createScolariteRow(module, values, snapshot),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.scolarite.snapshot.queryKey() }),
  });
}
