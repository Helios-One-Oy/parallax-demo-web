import { notes } from "@nbd/release-notes";

export const VERSION = "1.3.0";

// Conventional-commit lines for the current release.
export const CHANGELOG = [
  "feat(api): shipment tracking and event history endpoints",
  "feat(eta): ETA-window coverage check",
  "fix(eta): clamp the ETA window to UTC days",
  "chore(deps): refresh service dependencies",
];

export function releaseNotes(): string {
  return notes(CHANGELOG);
}
