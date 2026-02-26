# US-01 Feedback List

## Summary

A public list of feedback items shown as cards beneath the AI-style composer, giving a quick overview of feature and bug requests and their current status.

## User Story

As a visitor to the feedback portal,  
I want to see a list of existing feedback items with key metadata,  
so that I can understand what already exists and whether something is planned, in progress, or merged.

## Details

- Display as a vertically stacked list of cards on the main page, below the composer.
- Each card shows:
  - Title.
  - Type badge: Feature or Bug.
  - Status badge: New, Planned, In progress, Preview, or Merged.
  - Vote count (simple integer).
  - Comment count.
  - Last updated timestamp.
  - Preview button when a `previewUrl` is available.
- Items are loaded from Firestore, with GitHub labels as the source of truth for status.
- Visibility rules:
  - Show active items and merged items.
  - Hide items that are closed/removed but not merged.

## Acceptance Criteria

- The main page shows a list of feedback cards beneath the composer.
- Each card displays title, type badge, status badge, votes, comment count, last updated, and preview button (when `previewUrl` exists).
- Items marked as closed/removed but not merged are not shown in the list.
- Items with status Merged are visible and clearly indicated as such.
- Updating an item's status in GitHub (via label changes) is reflected in the list after a reasonable sync delay.

