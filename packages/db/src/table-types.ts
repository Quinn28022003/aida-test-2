import type { Database } from "./database.types";

type PublicSchema = Database["public"];
type PublicTables = PublicSchema["Tables"];

// Compatibility aliases for existing consumers.
// Prefer `Tables<...>`, `TablesInsert<...>`, `TablesUpdate<...>` in new code.
export type ProfileRow = PublicTables["profiles"]["Row"];
export type ProfileInsert = PublicTables["profiles"]["Insert"];
export type ProfileUpdate = PublicTables["profiles"]["Update"];

/** agent_versions insert omitting version — DB trigger assigns max+1. */
export type AgentVersionInsertWithoutVersion = Omit<
  PublicTables["agent_versions"]["Insert"],
  "version"
>;

export type AgentVersionInsert = PublicTables["agent_versions"]["Insert"];
