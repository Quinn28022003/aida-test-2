import { describe, expect, it } from "vitest";
import { redactSensitiveFields } from "./redaction";

describe("redaction", () => {
  it("redacts representative secrets and customer payload fields", () => {
    expect(
      redactSensitiveFields({
        SUPABASE_SERVICE_ROLE_KEY: "service-role",
        AWS_ACCESS_KEY_ID: "aws-access",
        AWS_SECRET_ACCESS_KEY: "aws-secret",
        RESEND_API_KEY: "resend",
        oauthToken: "oauth",
        prompt: "raw prompt",
        messageBody: "full body",
        documentExcerpt: "document text",
        signedUrl: "https://signed.example",
        toolOutput: { customer: "data" },
        safeCount: 2
      })
    ).toEqual({
      SUPABASE_SERVICE_ROLE_KEY: "[REDACTED]",
      AWS_ACCESS_KEY_ID: "[REDACTED]",
      AWS_SECRET_ACCESS_KEY: "[REDACTED]",
      RESEND_API_KEY: "[REDACTED]",
      oauthToken: "[REDACTED]",
      prompt: "[REDACTED]",
      messageBody: "[REDACTED]",
      documentExcerpt: "[REDACTED]",
      signedUrl: "[REDACTED]",
      toolOutput: "[REDACTED]",
      safeCount: 2
    });
  });

  it("summarises arrays and long strings without exposing content", () => {
    const result = redactSensitiveFields({
      ids: ["one", "two"],
      notes: "x".repeat(200)
    });

    expect(result).toEqual({
      ids: { type: "array", length: 2 },
      notes: {
        type: "string",
        length: 200,
        previewHash: expect.any(String)
      }
    });
  });
});
