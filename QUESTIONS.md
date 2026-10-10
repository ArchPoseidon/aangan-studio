# Open questions and decisions taken

Each item is where the spec was silent or reality differed. The simplest reading was taken and is listed here to confirm or reverse.

## Decided differently from the spec because of what the systems allow
1. **Freshsales "Leads" is not available to this API key** (every `/leads` call returns 403 Access Denied; Contacts and Deals work). A qualified lead is therefore mirrored as a **Contact (keyed on phone) plus a linked Deal**. Closed Won = that deal moved to the pipeline stage whose `forecast_type` is "Closed Won", which is **"Won"** in "Default Pipeline". If you enable the Leads module for the key, `lib/freshsales.ts` is the only file to change.
2. **Freshsales Contacts require an email**, and the call does not collect one. Contacts are created with a placeholder `<phone>@no-email.invalid` (a reserved, undeliverable domain). Replace once the real email is collected.
3. **Freshsales has one user (Vasudeva K)**, so the 14 dummy designers cannot map to owners. Everything is owned by that user and the designer name is a tag on the contact (`Designer: Name`). The designer's notes are also written as Freshsales notes.
4. **Booking uses Cal.com**: it is the only calendar Vaani documents an integration with. It is configured inside Vaani (Settings, Integrations, Cal.com), not in this app. Needs a Cal.com API key and an event type (not yet provided).
5. **Vaani delivers post-call data by webhook** (`call_postprocessing` carries the transcript). A polling fallback exists at `POST /api/vaani/sync`. Vaani's `/api/call-history` currently returns a 500 for this account ("Invalid client_id format"), so the caller's phone cannot be read from history yet; see 7.
6. **Database: Neon** (serverless Postgres, simplest on Vercel). Locally the app falls back to embedded PGlite when `DATABASE_URL` is unset. The value supplied for Neon was an Auth JWKS URL, not a connection string, so Neon is **not yet connected**.

## Assumptions to confirm
7. **Phone number**: WebRTC calls have no caller ID. The agent prompt asks for the number once; Gemini extracts it. If none is captured the lead is created with a flag and is **not synced to Freshsales** until a phone is known (there is no UI yet to add one). A repeat caller with the same phone updates the existing lead instead of duplicating it. A bare 10-digit number is treated as Indian (+91).
8. **Meeting time**: only date and AM/PM are captured. The calendar shows the AM/PM label, not a clock time.
9. **Mandatory fields for "Make a Project"**: designer, deal value, and a note (as in the spec's assumptions).
10. **24-hour clock** starts when the lead lands. Overdue = deal value or note still empty after 24h; shown as a flag on the lead and a notification in the sidebar bell. There is no email/push.
11. **Moving a project back out of Completion** returns the lead to "project" in the dashboard but does **not** revert the Freshsales deal from Won.
12. **Duplicate surnames** give identical card names ("Mehta Residence"), as agreed.
13. **PINs**: 4 to 8 digits, hashed with bcrypt, created at first login. There is no PIN reset flow.
14. **Card sizes**: Compact, Standard (default) and Editorial are a toggle above the board. Quick actions (call, message) use `tel:` and `sms:` links.
15. **Seed data**: 8 showcase projects (flats and villas across all four stages) are inserted directly, without Gemini or Freshsales. Mehta and Kapoor are real pipeline runs from stored transcripts; running `npm run db:seed` on a new database creates their Freshsales contact/deal again (the contact is reused by phone, the deal is new).
16. **Gemini model**: `gemini-3.8-flash`. `gemini-2.5-flash` is closed to new keys on this account.
17. **Images**: generated with `gemini-2.5-flash-image` (6 flats, 6 villas), compressed to JPEG, shipped in `public/projects/`. Drop new `flat-N.jpg` / `villa-N.jpg` files there to replace or add; assignment is `lead id mod count`.
18. **Secrets**: the Vaani, Gemini and Freshsales keys were pasted in chat. Rotate them before go-live.
