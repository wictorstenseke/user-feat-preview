# US-03 LLM Draft Generation

## Summary

Backend logic that calls an LLM to turn raw user feedback into a structured draft ticket with an optional single clarifying question.

## User Story

As the system owner,  
I want the backend to transform raw feedback into a consistent ticket format using an LLM,  
so that all created issues have clear titles, summaries, and, for bugs, basic repro information.

## Details

- Implemented as a Firebase Cloud Function (or equivalent backend endpoint).
- Inputs:
  - Raw user text from the composer.
  - Optional metadata (e.g., inferred type: feature vs bug).
- LLM prompt behavior:
  - Produce a concise title.
  - Produce a short summary.
  - For bug reports, include structured sections: steps to reproduce, expected behavior, actual behavior (when possible).
  - Optionally include **at most one** clarifying question if critical information is missing.
- Outputs:
  - `type`: feature | bug (inferred when possible).
  - `title`: string.
  - `summary`: string.
  - `details`: optional structured fields for bugs.
  - `followUpQuestion`: optional string (undefined when not needed).
- Error handling:
  - Gracefully handle LLM failures with a user-visible error state in the composer.
  - Do not create any feedback item on draft failure.

## Acceptance Criteria

- Given raw feedback text, the backend returns a structured draft object with title and summary.
- For bug-like feedback, the draft attempts to include repro/expected/actual sections when possible.
- The backend never returns more than one follow-up question.
- When the LLM call fails, the endpoint responds with an error and no partial item is created.
- The frontend composer (US-02) can consume this response and render the draft + optional question.

