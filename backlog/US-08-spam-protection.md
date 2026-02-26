# US-08 Spam Protection (No Auth)

**Status: Done**

## Summary

Protect the feedback portal from basic spam and abuse without requiring user authentication.

## User Story

As the system owner,  
I want lightweight spam protection on submissions and votes without forcing users to log in,  
so that the portal remains usable and not overwhelmed by bots.

## Details

- Honeypot:
  - Add an invisible honeypot field to submission forms (feedback, comments).
  - Submissions with the honeypot filled are silently dropped.
- Rate limits:
  - Limit feedback submissions per IP and/or cookie per day.
  - Limit votes per minute per IP/cookie.
  - Optionally apply separate limits to comments.
- Server-side validation:
  - Reject empty payloads.
  - Reject excessively long payloads.
  - Reject obvious repeated payloads from the same IP/cookie in a short window.
- Future “suspicious mode”:
  - Leave room to introduce a captcha or stronger challenge for suspicious traffic in later iterations (not required in MVP).

## Acceptance Criteria

- Submissions with the honeypot field filled are dropped and do not create feedback, votes, or comments.
- Users cannot exceed configured submission and voting rate limits; excess requests are rejected with a clear error.
- Empty, too-long, or clearly repeated payloads are rejected by the backend.
- The system does not require sign-in for normal usage in the MVP.

