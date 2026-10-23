# Planet Command V2 — Admin A/B rollout plan

## Current verified database constraints (2026-10-22)
- `public.game_saves(user_id, state jsonb, revision, updated_at)` is still the **authoritative** store for buildings, construction jobs, production and resources.
- `public.imperium_pvp_commit` delegates to global-epoch commit logic. Running another Edge Function against the same global state does **not** remove lock contention.
- Existing browser build action is `{type:'build', key, planet}`; the server's `act()` advances time, validates building prerequisites, pays resources and schedules `p.build`.
- Administrator status is currently included as `pvp.isAdmin`, backed by `public.pvp_admins`. **Never trust that frontend flag for authorization.**
- New transactional tables do not yet exist.

## Essential invariants
1. At any instant, exactly **one** implementation owns each planet's resources, construction slot and upgrade level. No asynchronous two-way mirroring.
2. Browser only supplies `planetId`, `buildingKey`, `requestId`. Server time and authoritative cost/duration formulas determine the transaction.
3. Under concurrent requests: at most one build succeeds per planet, resources are deducted once, and retries return the same result.
4. The ordinary Game Command must not overwrite V2-managed state. Until this is guaranteed, V2 must remain admin-only and **must not mutate live saves**.
5. Use an RLS-protected private schema or appropriately hardened RPC for the new implementation. Verify auth server-side against `pvp_admins`.
6. Record duration (client network, function, DB), bytes transferred, revision and method, without personally sensitive identifiers in analytics.

## Proposed rollout
1. Build separate V2 transactional persistence plus one authoritative routing mechanism for selected **admin planets** (not whole admin accounts).
2. Share tested game rules (`buildInfo`, `pay`, production timing) instead of writing inconsistent copies.
3. Add `planet-command` RPC/function, idempotent request ledger and exact response delta.
4. Add two build buttons to mine cards for verified admins only: `V1: Game Command` and `V2: Planet Command`. Both must be real actions on one consistent canonical state, not disconnected forks.
5. Test with disposable cloned admin planet / isolated realm before allowing operations on main.
6. Prove no resource duplication, negative balance, lost production, stale revisions, concurrent build/race with legacy sync, and offline/reconnect correctness.
7. Only then enable V2 for selected admin planets behind server-side feature flag; ordinary players remain on V1.

## Acceptance tests
- Same initial mine/energy/resources on V1 and V2 -> same price, deadline, effects.
- Repeated identical `requestId` -> one debit and one order.
- Two different `requestId` values concurrently -> only one order.
- Existing active build -> V2 refuses without debiting.
- Insufficient resources and prerequisites -> no mutation.
- Legacy sync during V2 transaction -> no lost write or rollback.
- Build completion after an offline interval -> exactly one level increase.
- V2 access by ordinary or anonymous user -> forbidden even if frontend is modified.
- Measured p50/p95 latency and payload size on representative admin test data.

**Release guard:** Do not deploy a second production writer to `game_saves` until the global writer/sync conflict is explicitly resolved.
