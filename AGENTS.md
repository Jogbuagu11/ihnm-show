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
