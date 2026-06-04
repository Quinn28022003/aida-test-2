/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, describe, expect, it, vi } from "vitest";

import { createPrettyRequestLogger } from "./request-logger";

vi.mock("yoctocolors-cjs", () => ({
  red: (value: string) => `red(${value})`,
  yellow: (value: string) => `yellow(${value})`,
  green: (value: string) => `green(${value})`,
  blue: (value: string) => `blue(${value})`,
  magenta: (value: string) => `magenta(${value})`,
  cyan: (value: string) => `cyan(${value})`,
  gray: (value: string) => `gray(${value})`
}));

type HeaderValues = Record<string, string | undefined>;

type ContextOptions = {
  method?: string;
  path?: string;
  status?: number;
  reqHeaders?: HeaderValues;
  resHeaders?: HeaderValues;
};

function createHeaderMap(values: HeaderValues) {
  const map = new Map<string, string>();

  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) {
      map.set(key.toLowerCase(), value);
    }
  }

  return map;
}

function createContext({
  method = "GET",
  path = "/",
  status = 200,
  reqHeaders = {},
  resHeaders = {}
}: ContextOptions = {}) {
  const requestHeaders = createHeaderMap(reqHeaders);
  const responseHeaders = createHeaderMap(resHeaders);

  return {
    req: {
      method,
      path,
      header: (name: string) => requestHeaders.get(name.toLowerCase())
    },
    res: {
      status,
      headers: {
        get: (name: string) => responseHeaders.get(name.toLowerCase()) ?? null
      }
    }
  };
}

describe("pretty request logger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("logs info with forwarded IP and content length", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
    vi.spyOn(performance, "now").mockReturnValueOnce(1000).mockReturnValueOnce(1120);

    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const logger = createPrettyRequestLogger();
    const ctx = createContext({
      method: "GET",
      path: "/health",
      status: 200,
      reqHeaders: {
        "x-forwarded-for": "203.0.113.1, 203.0.113.2",
        "user-agent": "vitest"
      },
      resHeaders: {
        "content-length": "123"
      }
    });

    await logger(ctx as any, async () => undefined);

    expect(consoleSpy).toHaveBeenCalledTimes(1);

    const line = consoleSpy.mock.calls[0]?.[0] as string;

    expect(line).toContain("green([INFO])");
    expect(line).toContain("green(i)");
    expect(line).toContain("gray(2024-01-01T00:00:00.000Z)");
    expect(line).toContain("green(GET   )");
    expect(line).toContain("/health");
    expect(line).toContain("green(200)");
    expect(line).toContain("gray(120.00ms)");
    expect(line).toContain('gray(ip=203.0.113.1 bytes=123 ua="vitest")');
  });

  it("logs warn with x-real-ip fallback and defaults", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-02T00:00:00.000Z"));
    vi.spyOn(performance, "now").mockReturnValueOnce(10).mockReturnValueOnce(360);

    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const logger = createPrettyRequestLogger();
    const ctx = createContext({
      method: "POST",
      path: "/missing",
      status: 404,
      reqHeaders: {
        "x-real-ip": "198.51.100.10"
      }
    });

    await logger(ctx as any, async () => undefined);

    expect(consoleSpy).toHaveBeenCalledTimes(1);

    const line = consoleSpy.mock.calls[0]?.[0] as string;

    expect(line).toContain("yellow([WARN])");
    expect(line).toContain("yellow(!)");
    expect(line).toContain("blue(POST  )");
    expect(line).toContain("/missing");
    expect(line).toContain("yellow(404)");
    expect(line).toContain("yellow(350.00ms)");
    expect(line).toContain('gray(ip=198.51.100.10 bytes=- ua="-")');
  });

  it("appends requestId when getRequestId is provided", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-04T00:00:00.000Z"));
    vi.spyOn(performance, "now").mockReturnValueOnce(0).mockReturnValueOnce(50);

    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const logger = createPrettyRequestLogger({
      getRequestId: () => "550e8400-e29b-41d4-a716-446655440000"
    });
    const ctx = createContext({
      method: "GET",
      path: "/orgs",
      status: 200
    });

    await logger(ctx as any, async () => undefined);

    const line = consoleSpy.mock.calls[0]?.[0] as string;

    expect(line).toContain("gray(requestId=550e8400-e29b-41d4-a716-446655440000)");
  });

  it("logs error and rethrows", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-03T00:00:00.000Z"));
    vi.spyOn(performance, "now").mockReturnValueOnce(0).mockReturnValueOnce(1500);

    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const logger = createPrettyRequestLogger();
    const ctx = createContext({
      method: "PATCH",
      path: "/boom",
      status: 204
    });

    await expect(
      logger(ctx as any, async () => {
        throw new Error("boom");
      })
    ).rejects.toThrow("boom");

    expect(consoleSpy).toHaveBeenCalledTimes(1);

    const line = consoleSpy.mock.calls[0]?.[0] as string;

    expect(line).toContain("red([ERROR])");
    expect(line).toContain("red(x)");
    expect(line).toContain("magenta(PATCH )");
    expect(line).toContain("red(500)");
    expect(line).toContain("red(1500.00ms)");
    expect(line).toContain('gray(ip=local bytes=- ua="-")');
  });
});
