# US-04 Duplicate Detection

**Status: Done**

## Summary

Detect potential duplicate feedback items before final submission and let users upvote an existing item instead of creating a new one.

## User Story

As a visitor submitting feedback,  
I want to see possible duplicates before I create a new item,  
so that I can avoid cluttering the list and instead upvote an existing request.

## Details

- Duplicate detection runs after the LLM draft is generated and before final submit.
- Matching is based on:
  - Draft title.
  - Draft summary.
- The system queries existing feedback items (from Firestore / search index) to find similar items.
- UI behavior:
  - Show a “Possible duplicates” section beneath the draft.
  - Display the top 3–5 matches with at least:
    - Title.
    - Type.
    - Status.
    - Current vote count.
  - For each suggested duplicate, provide actions:
    - **Open item** (detail view).
    - **Upvote this instead** (records a vote on the existing item and does not create a new one).
    - **Create anyway** (proceeds with new item creation).

## Acceptance Criteria

- After generating a draft, the composer displays a “Possible duplicates” section when similar items exist.
- No more than 5 duplicate suggestions are shown at once.
- Selecting “Open item” opens the item detail (US-05) without losing the current draft.
- Selecting “Upvote this instead”:
  - Registers a vote on the existing item.
  - Does not create a new feedback item.
- Selecting “Create anyway” proceeds with submission and creates a new item even if duplicates were shown.

