# US-05 Item Detail View

**Status: Done**

## Summary

A detail view (drawer or modal) for a single feedback item, showing the full description, status, preview link, comments, and voting.

## User Story

As a visitor browsing feedback,  
I want to open a specific item to see its full details and discussion,  
so that I can understand the context and decide whether to vote or comment.

## Details

- Triggered from:
  - Clicking a card in the feedback list.
  - Clicking an “Open item” action from duplicate suggestions.
- Presentation:
  - Implemented as a drawer or modal on top of the main page.
  - Does not navigate away from the list; closing returns to the same scroll position.
- Content:
  - Title.
  - Type and status badges.
  - Full description/summary (including structured bug details when present).
  - Preview link button when `previewUrl` is available (opens PR preview in new tab).
  - Vote button with current vote count.
  - Comments thread:
    - List of comments, newest last or first (consistent choice).
    - Simple text input + submit to add a new comment.
- Status is derived from GitHub labels and mirrored into Firestore.

## Acceptance Criteria

- Clicking a feedback card opens a detail drawer or modal with full item information.
- The detail view shows status, type, description, preview button (when `previewUrl` exists), vote count, and comments.
- Users can close the detail view and return to the list without losing their place.
- Users can add a new comment from the detail view (US-07).
- Users can vote from the detail view (US-06).

