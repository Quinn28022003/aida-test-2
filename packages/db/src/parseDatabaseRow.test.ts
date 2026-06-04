import { describe, expect, it } from "vitest";
import { z } from "zod";

import { parseDatabaseRow } from "./parseDatabaseRow";

const profileId = "550e8400-e29b-41d4-a716-446655440001";
const authUserId = "550e8400-e29b-41d4-a716-446655440002";

const rowSchema = z.object({
  authUserId: z.uuid(),
  avatarUrl: z.string().nullable(),
  createdAt: z.iso.datetime(),
  id: z.uuid(),
});

describe("parseDatabaseRow", () => {
  it("converts snake_case keys to camelCase", () => {
    const parsed = parseDatabaseRow(
      {
        auth_user_id: authUserId,
        avatar_url: null,
        created_at: "2026-01-01T00:00:00Z",
        id: profileId,
      },
      rowSchema,
    );

    expect(parsed).toEqual({
      authUserId,
      avatarUrl: null,
      createdAt: "2026-01-01T00:00:00Z",
      id: profileId,
    });
  });

  it("preserves already simple keys and null values", () => {
    const parsed = parseDatabaseRow({ id: profileId, name: null }, z.object({
      id: z.uuid(),
      name: z.null(),
    }));

    expect(parsed).toEqual({ id: profileId, name: null });
  });

  it("fails when the converted object does not match the schema", () => {
    expect(() =>
      parseDatabaseRow({ auth_user_id: authUserId }, rowSchema),
    ).toThrow();
  });

  it("rejects invalid uuid values after key conversion", () => {
    expect(() =>
      parseDatabaseRow(
        {
          auth_user_id: "not-a-uuid",
          avatar_url: null,
          created_at: "2026-01-01T00:00:00Z",
          id: profileId,
        },
        rowSchema,
      ),
    ).toThrow();
  });
});
