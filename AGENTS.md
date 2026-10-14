<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Seat, waitlist, shuttle, check-in and group-approval logic lives in security-definer Postgres functions (reserve_seat, cancel_reservation, book_shuttle, check_in, decide_group_request); the browser calls them via RPC — keeps capacity rules atomic and server-enforced.
- Staff access = any row in user_roles (admin/crew); the first account to sign up becomes admin via a trigger — avoids hardcoding an admin.
- Signed-in pages live under src/routes/_authenticated (client-only gate redirecting to /auth).
- Shared display helpers (Pacific time formatting, shuttle loop generation, image keys) live in src/lib/show.ts.
- Bookable capacity = effective_capacity() (capacity + overbook %) in SQL, mirrored by effectiveCapacity() in src/lib/show.ts — keep both in sync so the site and the seat rules agree.
- Analytics are first-party: PageTracker in __root logs anonymous rows to page_views; only admins can read them.
- Guest releases are signed through a public token link (/release/$token) using get_release/sign_release RPCs, so guests don't need an account.
- Finance data (income, expenses, partners, sponsors, invoices, rentals, budgets, campaigns) is admin-only via has_role RLS; files go in the private "finance" bucket opened with signed URLs. The generic Crud component in src/components/finance drives every ledger tab.
- Studio A rentals: pricing in public.rental_price() mirrored by quote() in src/lib/rentals.ts (keep in sync); bookings go through book_rental RPC which blocks taping days/overlaps and creates the balance invoice; triggers post paid deposits/balances/hour packs to income — keeps rental money flowing to Finance without double entry.
- Roles: is_staff() and useAuth().isStaff count only admin/crew; "volunteer" is a non-staff role granted by join_volunteers RPC — keeps volunteers out of crew tools.
- Shift claiming goes through claim_shift/release_shift RPCs (slot limits enforced in SQL); volunteer docs live in private "volunteer-docs" bucket under <user_id>/, readable by admins only.
- Ticket-holder announcements are rows in taping_messages shown on My Tickets; SMS opt-in is stored on reservations, actual texting needs a provider connection.
- Crew/admin access is granted only via add_staff/remove_staff RPCs (admin-checked); emails without an account wait in staff_invites and are applied by a trigger on signup — avoids editing roles by hand.
- Door self check-in uses a staff-only per-taping code (door_code RPC) embedded in the printed QR; self_check_in validates code, account reservation and a ±3h window — so the public taping data never exposes the code.
