# Combat v4 – release checklist (PR #76)

## Safety and scope
- Live v3 remains active until the admin explicitly selects v4.
- All new PvP attacks copy `combat_engine` into their immutable `ruleVersion`; existing airborne missions retain v1/v2/v3.
- v4 is a compact typed-array/sparse-hit implementation of current target priorities, shield/hull calculations, simultaneous rounds and orbital opening strike. **No Rapid Fire, carrier or target-lock mechanics in this release.**
- Combat v3 remains available via the admin switch; historical v3 logs are unchanged.
- The 110,000-unit benchmark is a runtime/size test, **not** proof of gameplay parity.
- v4 aggregate logs cannot be viewed with the v3 per-shot reader: version-aware UI included.

## Deploy order – after all CI jobs pass
1. Review & merge the PR. Keep v3 selected throughout deployment.
2. In Supabase SQL Editor execute `supabase/combat-engine-control-v4.sql` and `supabase/combat-hybrid-v4.sql`. Both are re-runnable. **Never run older combat-log SQL migrations after these** without reapplying the v4 migration.
3. Download the `combat-v4-deployment-<run-id>` artifact from the successful **Package Combat v4 Game Command** Actions run. Extract `game-command-v4.ts`.
4. Replace the contents of the **existing** Supabase Edge Function `swift-handler` with the complete generated `game-command-v4.ts` and deploy. Do not create a second function.
5. Publish the PR website changes (GitHub Pages) and refresh.
6. Check one v3 battle while v3 remains the default, especially repairs and battle report. Then use the PvP settings admin selector to enable v4.
7. Check a small v4 battle: grouped report, repairs, defender partners, orbital round 0, debris and salvage. Run a mixed large battle only after this test is successful.

## Rollback
- Admin selects **v3** to ensure all **new** attacks use the old engine again.
- Attacks already launched with v4 retain v4, so **do not immediately deploy an older game command** that lacks the v4 resolver. Wait until all v4 missions have resolved and returned.
- Keep the v4-capable SQL logging migration so historical v4 reports remain readable. Never delete existing battle logs.
- The old v3 reports remain visible in the version-aware interface.

## Follow-up releases
- v7 Rapid Fire and per-shot target locks for both engines.
- v8 carrier and swarm coordination for both engines.
