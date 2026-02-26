# US-06 Voting

## Summary

Allow users to upvote feedback items, both from the list and from the item detail view, while enforcing a “one vote per user” rule without authentication.

## User Story

As a visitor to the feedback portal,  
I want to upvote feedback items I care about,  
so that maintainers can see which requests are most important to users.

## Details

- Voting model:
  - Vote counts are stored in Firestore on the feedback item.
  - A user’s vote is tracked using a combination of:
    - Browser cookie and/or localStorage identifier.
    - IP-based rate limiting to reduce abuse.
  - No formal authentication in MVP.
- UI behavior:
  - Each list card shows the current vote count and a vote button/toggle.
  - The item detail view shows the same vote control and count.
  - The control clearly indicates whether the current user has voted.
- Constraints:
  - Users can vote at most once per item (may allow unvote/toggle in MVP or decide “upvote only”).
  - Rate limit votes/minute per IP/cookie to mitigate spam (see US-08).

## Acceptance Criteria

- Users can upvote an item from both the list and the detail view.
- The vote count updates visually after voting.
- The UI indicates whether the current user has already voted on an item.
- A user cannot register more than one vote per item in Firestore.
- Excessive voting attempts from the same IP/cookie are rejected according to rate-limiting rules.

