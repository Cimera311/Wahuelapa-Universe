# PvP sync audit — 2026-10-14

## Observed (Supabase project Wahuelapa, 2026-10-13 14:00–2026-10-14 13:59 UTC)

- 10,358 REST `imperium_pvp_snapshot` requests, including 14 HTTP 500.
- 10,302 REST `imperium_pvp_commit` requests, including 18 HTTP 500.
- 9,602 POSTs to `swift-handler`; an additional ~9,000 OPTIONS/CORS requests.
- 33 PostgreSQL `57014` cancellations/timeouts in the same window (not necessarily identical to each HTTP 500). Logged statements included waiting on the `pvp_control` row, updating game saves and processing reports.
- 1 separate `42703` developer SQL query error; do not count it as a game bug.

At inspection time there were **13 save rows, 51 galaxy planets and 63 PvP attack records**.
The *cumulative* PostgreSQL row-update counters (not daily counts) were approximately
2.40 million `galaxy_planets`, 1.31 million `pvp_attacks`,
521 thousand `game_saves`, and 47 thousand `pvp_control`.

The reported 138.44 GB **Log Query usage** is *log data scanned by queries*, not database
storage, nor the number of API calls. These findings do not prove which log scans
consumed that allowance.

## Root cause in code

The browser checked every five seconds and sent an authoritative `sync` every
15 seconds while open, regardless of game activity or tab visibility. Each sync
takes a worldwide snapshot, advances all players' worlds and commits the world,
serializing through `pvp_control`.

The commit function also unconditionally updated **every** galaxy-planet row and
**every** stored attack, including unchanged records. The social wrapper updated
`partner_world` every time as well. The rows often remained logically identical,
but still incurred locks, WAL writes, triggers and work for Postgres.

## Change and rollout

1. Foreground, no active PvP: ~30 seconds between syncs.
2. Foreground with incoming warnings or outgoing attacks: keep ~15 seconds.
3. Hidden authoritative tabs do not poll; the next foreground sync catches up.
4. After a successful game command or login, do not immediately repeat a redundant sync.
5. Unchanged planet, mission, attack and partner rows no longer receive UPDATE.
6. **Keep** the epoch increment and global lock ordering to preserve atomic
   operations, idempotency, and existing world-advance semantics.
7. Legacy cloud saves retain their behavior in hidden tabs.

The SQL-only optimization is in `supabase/pvp-sync-performance.sql` and **must be
run manually in Supabase after merging**. Existing `partnerships.sql` must already
be installed. It is repeatable and leaves the game command (`swift-handler`)
unchanged. Frontend changes take effect when the merged Pages build is live.

## Verification

- GitHub CI: `npm test` and `npm run build`.
- SQL integration test: applies the migration twice, compares `xmin` for
  unchanged global rows across identical syncs, and verifies epoch progression.
- Monitor HTTP 500/503, Postgres timeout counts and cumulative UPDATE rates
  after rollout. Lower absolute call counts depend on active sessions.

**Known design boundary:** World events are applied deterministically at their
scheduled game timestamps *when a client next syncs*. No server scheduler runs
while everyone is offline. This PR intentionally does not change that rule.
