import "server-only";
import { env } from "@/server/env";
import { FsReleaseStore } from "./fs-release-store";
import { MemoryReleaseStore } from "./memory-release-store";
import type { ReleaseStore } from "./release-store";

export type { ReleaseStore, ReleaseIndex, ReleaseMeta } from "./release-store";
export { ImmutableReleaseError } from "./release-store";

let instance: ReleaseStore | null = null;

/** Composition root for the release store. */
export function getReleaseStore(): ReleaseStore {
  if (instance) return instance;
  instance = env.RELEASE_STORE_DRIVER === "memory" ? new MemoryReleaseStore() : new FsReleaseStore();
  return instance;
}
