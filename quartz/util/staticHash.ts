import { createHash } from "crypto"

// A cache-busting token that is fixed for the lifetime of a single build
// process. The global stylesheet is emitted as `index.<STATIC_ASSET_HASH>.css`
// (quartz/plugins/emitters/componentResources.ts) and every page links that
// exact filename (quartz/components/renderPage.tsx). Both read this one constant,
// so within a build they always agree, and every build produces a fresh token.
//
// WHY THIS EXISTS. The stylesheet was emitted as an un-hashed `index.css` served
// `max-age=0, must-revalidate`. A browser holding a previous deploy's index.css
// could render this deploy's new hmi-v3-* markup against rules that no longer
// match — the homepage briefly rendered unstyled on bare burgundy. A per-build
// filename makes that structurally impossible: new markup references a filename
// the browser has never cached, so it can never apply a stale sheet. The hashed
// asset is safe to cache immutably (see vercel.json).
//
// A module constant (not emit-order state) is deliberate: Quartz runs emitters
// concurrently (Promise.all in processors/emit.ts), so the emitter cannot be
// relied on to set a shared value before renderPage reads it. A constant
// evaluated once at module load has no such race.
export const STATIC_ASSET_HASH: string = createHash("sha256")
  .update(`${Date.now()}:${process.pid}:${process.hrtime.bigint().toString()}`)
  .digest("hex")
  .slice(0, 10)

// The emitted stylesheet filename for this build (relative, no leading slash).
export const INDEX_CSS_NAME = `index.${STATIC_ASSET_HASH}.css`
