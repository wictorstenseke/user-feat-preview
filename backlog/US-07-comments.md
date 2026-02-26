# US-07 Comments

## Summary

Allow users to read and write comments on feedback items, stored anonymously in Firestore.

## User Story

As a visitor to the feedback portal,  
I want to read and add comments on feedback items,  
so that I can clarify details, share context, or discuss potential solutions.

## Details

- Comments storage:
  - Comments are stored in Firestore under each feedback item.
  - No mirroring of comments to GitHub in the MVP (GitHub is used for issues and status only).
  - Each comment includes:
    - Text body.
    - Timestamp.
    - Lightweight anonymous identifier (e.g., generated nickname or hash) if desired.
- UI behavior (item detail view, US-05):
  - A comments section lists existing comments for the item.
  - A simple text input + submit button lets users add a new comment.
  - Basic validation: non-empty, reasonable max length.
- Ordering:
  - Comments are displayed in a consistent order (e.g., oldest first or newest first).

## Acceptance Criteria

- Opening an item detail view shows a comments section with all existing comments for that item.
- Users can submit a new comment, which appears in the list without a full page reload.
- Comments are saved only in Firestore, not in GitHub.
- Empty or excessively long comments are rejected by the backend.
- Abusive or spammy comments are subject to the same spam protection and rate limiting as submissions (US-08) where applicable.

