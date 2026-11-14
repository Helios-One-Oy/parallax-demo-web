// Type shims for the @nbd packages served from the Parallax sink registry.
declare module "@nbd/telemetry-utils" {
  export function event(
    name: string,
    props?: Record<string, unknown>
  ): { name: string; ts: string; props: Record<string, unknown> };
  export function redact(
    obj: Record<string, unknown>,
    keys?: string[]
  ): Record<string, unknown>;
}

declare module "@nbd/release-notes" {
  export function parseCommit(line: string): {
    type: string;
    scope: string | null;
    subject: string;
  };
  export function notes(commits: string[]): string;
}

declare module "@nbd/date-range" {
  export function eachDay(start: string | Date, end: string | Date): Date[];
  export function inRange(
    date: string | Date,
    start: string | Date,
    end: string | Date
  ): boolean;
}

// Declared ahead of time so the `deps/add-retry-fetch` replay branch only has to
// touch package.json, the lockfile and one import line. Not installed on main.
declare module "@nbd/retry-fetch" {
  function retryFetch(
    url: string,
    opts?: RequestInit,
    cfg?: { retries?: number; backoffMs?: number }
  ): Promise<Response>;
  export = retryFetch;
}
