# Activate Personal Finance V1

Apply the three new migrations before using `/finanzas/personal`. They are additive: existing business rows and quotes remain intact. No remote database changes have been executed as part of implementation.

## Quick path

1. Back up the database, review migration history and verify existing schema prerequisites. Apply only `20261008000000_personal_finance.sql`, `20261008010000_personal_finance_seed.sql`, and `20261008020000_wonder_pending_extra.sql` in that order through an authorized Supabase SQL connection. Do not reset the database or replay historical business migrations.
2. Sign in as the verified Laureano owner and select **Cargar datos iniciales** once. The SQL seed is restricted to Clerk ID `user_3Jhi2ofDzdnN0wrxodZ3KGFja8S`; a changed identity requires a reviewed migration, not an automatic reassignment. `FINANCE_INITIAL_OWNER_ID` can additionally restrict the action, but cannot bypass the SQL identity check.
3. Update the MEP exchange rate, verify actual opening balances, and complete unknown prices/dates before recording receipts/payments.

## What the migration does

| Area            | Behavior                                                                                                                                                                                                                                                    |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Personal ledger | Extends `movements`; owner-scoped accounts, categories, schedules, obligations and goals. Legacy rows are not assigned to an arbitrary user.                                                                                                                |
| Security        | Clerk authentication and owner role on page, actions and DAL. RLS without public policies, service-role-only RPC execution, composite owner/currency foreign keys.                                                                                          |
| Money           | One transactional RPC for money changes, serialized per owner. Balances derive from opening balance and posted ledger; pending commitments do not spend cash.                                                                                               |
| Payments        | One ledger entry for a debt payment or collection; cancellation retains history and reverses its effect. Linked payments cannot be edited as ordinary income/expense.                                                                                       |
| Savings         | Contributions reserve existing same-currency account cash; they are not income/outflow. Actual expenses remain allowed; the UI warns when tracked reservations are no longer backed by account cash.                                                        |
| FX              | DolarAPI MEP selling price, ARS per USD, cached in DB for one hour. Refresh explicitly. Manual override persists until explicitly switched to automatic; failed provider requests preserve prior quote. Backdated ARS requires an explicit historical rate. |
| Business        | No invoice import or automatic withdrawal. Existing Wonder USD 500 payment is untouched; guarded business-only quote represents approximate USD 250 unpaid extras, linked to the verified existing client/project.                                          |

The seed stores a durable version marker, so refreshing or deleting an initial record does not recreate it. It refuses initial account seeding if accounts already exist, avoiding accidental double opening balances. SQL errors roll back the entire mutation. Unsupported cross-currency transfers are not silently converted.

## Initial data and uncertainties

- Approximate opening balances: Takenos USD 372, AstroPay USD 36 / ARS 55,000, Mercado Pago ARS 0. These are not income.
- Expected insurance ARS 366,000 monthly has no invented receipt date. Housing ARS 1,500,000 covers October 15–November 15, pending and nonrecurring.
- Netflix, YouTube Premium and Apple prices unknown; Instagram ARS 25,000 approximate. Dates need confirmation.
- Jeremías USD 1,500 targets November without an invented day. Avalian ARS 700,000 is joint/approximate and excluded from exact personal wealth. Card monthly ARS 131,000 starts November; total/day unknown.
- Egypt USD 15,000 due November 25, emergency USD 1,000 without date, monthly personal-income target USD 10,000. Savings start at zero. October USD 4,000 and November USD 5,000 milestones are descriptive months; late-November milestone needs reconciliation with the November 25 departure.
- No personal receivables seeded. Business reserve/distribution is intentionally manual; no automatic extraction of business cash.

## Verification and rollback

Once an obligation has any payment history (including cancelled payments), its monthly installment amount and next date/month are read-only. Payments advance the period and cancellation recomputes it; normal concept edits and completing an unknown original total remain allowed when the total covers existing payments. V1 intentionally does not version or retroactively rebase payment plans.

Run `node --test scripts/personal-finance.test.mjs`, scoped ESLint, TypeScript and a production build. Test SQL RPCs against a disposable database with existing schema prerequisites and Supabase roles; do not substitute mocks for monetary transaction validation. Test owner isolation, retries, partial/full payments, cancellation, FX snapshots and seed repeat calls.

Do not drop these tables after real use: that would remove financial history. Roll back the UI deployment first; export personal ledger and dependents before any schema rollback. Remote activation and authenticated production UX remain pending until a database administrator applies the migrations.
