# Customer Feedback Previewer — Updated Summary (with your answers)

## Decisions (answers applied)

1. GitHub repo + Pages previews: **PUBLIC**
2. Auth: **Start with NO AUTH** (anonymous). Use **honeypot + rate limits** to reduce bots.
3. Comments: **ONLY Firestore** (no mirroring to GitHub).
4. “Needs info”: **Not a status/state**. Instead: the LLM can ask **1 quick follow-up question inline** during submission; then we still create the issue.
5. Duplicates: LLM shows **possible duplicates list**; user can **upvote an existing item** instead of creating a new one. No follow/watch for now.

---

## Core Idea

A public feedback portal where:

- Users submit feature/bug feedback via an LLM-styled input.
- LLM returns a structured draft + may ask **1 clarifying question**.
- Before final submit, show **possible duplicates**; user can upvote an existing item.
- Submitted items appear in a list with status, comments, preview link, merged history.
- GitHub Issues + labels drive status. PR previews deploy to GitHub Pages and surface preview URL back into the item.
- Votes + comments stored in Firestore.

---

## End-to-end Flow

1. User opens site → sees a **centered page** with an AI-style composer.
2. User types feedback.
3. Backend calls LLM to produce:
   - Draft: title + summary (+ repro/expected/actual if bug)
   - Optional: **one follow-up question** (inline)
4. UI shows draft with inline controls:
   - Edit / Submit
5. Duplicate detection runs (on title+summary):
   - Show “Possible duplicates” inline with actions:
     - Open item
     - **Upvote this instead**
     - Create anyway
6. Submit creates:
   - Firestore feedback doc (authorless/anonymous, votes/comments)
   - GitHub Issue with labels (GitHub = state source of truth)
7. Item appears in list; users can comment + vote.
8. Admin assigns GitHub Issue to Copilot; Copilot creates PR linked to issue.
9. PR workflow deploys preview to GitHub Pages:
   - https://<user>.github.io/<repo>/pull/<PR_NUMBER>/
   - Action comments PR with the preview URL
10. Site sync picks up preview URL and updates Firestore feedback item (status → Preview).
11. PR merge → site marks item **Merged**; item remains viewable in “Merged” tab.

---

## UI (MVP)

### Main page (single view)

- Centered layout
- AI-style composer at top
- Feedback list below (cards)

### Composer (inline controls)

- User input
- Assistant response includes:
  - Draft ticket (editable)
  - (Optional) one follow-up question
  - Duplicates suggestions list
- Buttons:
  - Submit / Edit
  - For each duplicate: Open / Upvote instead / Create anyway

### Feedback list cards

- Title
- Type badge (Feature/Bug)
- Status badge (New/Planned/In progress/Preview/Merged)
- Votes (simple)
- Comment count
- Last updated
- Preview button if previewUrl exists

### Item detail (drawer/modal)

- Full description
- Status + preview link
- Comments thread (read + write)
- Vote button

### Visibility rules

- Show: Active + Merged
- Hide: “Closed/removed but not merged” (your rule)

---

## Data ownership / sources of truth

- Firestore: feedback item record + votes + comments + previewUrl cached
- GitHub: issue state/status via labels (drives what site shows)

---

## Status via GitHub labels (example)

- cf:public
- cf:type/feature | cf:type/bug
- cf:status/new | planned | in-progress | preview | merged | wontfix | duplicate

Rule: one cf:status/\* at a time.

---

## Duplicates (MVP behavior)

- LLM shows top 3–5 potential matches before submit.
- User can upvote an existing item instead of creating a new one.
- No “merge duplicates” admin tooling in MVP (optional later).

---

## Spam Protection (no auth)

- Honeypot field on submission form
- Rate limits:
  - submissions/day per IP (and/or cookie fingerprint)
  - votes/minute per IP/cookie
- Optional “suspicious mode” captcha later
- Server-side sanity checks (drop empty/too-long/repeated payloads)

---

## Stack

- Frontend: React + Vite (+ TanStack Router optional)
- Data fetching: TanStack Query (nice-to-have)
- Backend: Firebase
  - Firestore: votes/comments/items
  - Cloud Functions: call LLM, create GitHub issues, receive GitHub webhooks
- GitHub:
  - Issues/labels for status
  - Actions + Pages for PR previews (public)

---

## Remaining (small) uncertainties to decide later

- How to identify “one vote per user” without auth:
  - cookie + localStorage + IP rate-limit (MVP)
- How preview URL gets into Firestore:
  - parse PR comment OR action calls backend endpoint (cleaner)
- Do we keep a minimal admin-only UI, or admin does everything in GitHub only?
