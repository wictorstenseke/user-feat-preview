# FEAT-01 GitHub Integration for Feedback Items

## Summary

Integrate feedback submissions with GitHub Issues so that GitHub acts as the source of truth for item status via labels, while Firestore stores user-facing metadata such as votes, comments, and cached preview URLs.

## Feature Description

When a user submits feedback from the composer, the system should create:

- A Firestore feedback document containing the structured feedback, votes, comments, and cached status/preview data.
- A corresponding GitHub Issue with standardized labels that drive the item’s lifecycle.

## Details

- On submit (from US-02/US-03/US-04):
  - Backend Cloud Function creates a GitHub Issue in the configured repository.
  - Issue content includes:
    - Title and description from the LLM-structured draft (US-03).
    - Any structured bug fields (repro/expected/actual) in a readable format.
  - Labels:
    - `cf:public` for all feedback created through this portal.
    - `cf:type/feature` or `cf:type/bug`.
    - Exactly one `cf:status/*` label at a time, starting with `cf:status/new`.
- Firestore document:
  - Stores:
    - GitHub issue number and URL.
    - Basic fields for display (title, type, summary, etc.).
    - Status mirrored from GitHub labels.
    - Vote count and comments (Firestore-only).
    - Optional `previewUrl` (set by FEAT-02).
- Syncing state:
  - GitHub → Firestore:
    - Use GitHub webhooks or a scheduled sync to:
      - Mirror status label changes (`cf:status/*`) into Firestore.
      - Optionally detect `wontfix` or `duplicate` labels and update visibility.
  - Firestore remains the read model for the UI; GitHub remains the source of truth for status.

## Acceptance Criteria

- Submitting feedback creates both:
  - A Firestore feedback document.
  - A GitHub Issue in the target repository.
- Each created GitHub Issue has:
  - `cf:public`.
  - Exactly one `cf:type/*` label (feature or bug).
  - Exactly one `cf:status/*` label, starting at `new`.
- Status changes applied in GitHub (by updating `cf:status/*` labels) are reflected in Firestore and in the UI list/status badges within a reasonable timeframe.
- Deleting or closing an issue in GitHub is handled according to the visibility rules:
  - Merged items remain visible as “Merged”.
  - Closed-but-not-merged items are hidden from the main list.

