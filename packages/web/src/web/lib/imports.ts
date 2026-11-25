import { client } from "./api";

export type StudentImportResult = Awaited<
  ReturnType<typeof client.imports.importStudents>
>;

export async function importStudents(
  rows: Array<{ name: string; className: string; guardianName: string }>,
) {
  return client.imports.importStudents({ rows });
}
