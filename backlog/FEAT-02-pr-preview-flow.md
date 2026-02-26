# FEAT-02 PR Preview Flow via GitHub Pages

## Summary

Provide a preview URL for work-in-progress changes by deploying pull request builds to GitHub Pages and surfacing the preview link back into the feedback item.

## Feature Description

When a GitHub pull request is opened and linked to a feedback issue, the CI pipeline should deploy a preview of the app to GitHub Pages under a PR-specific URL. That URL should be written back to the corresponding feedback item so users can click a “Preview” button.

## Details

- GitHub Actions workflow:
  - On PR open/update:
    - Build the app.
    - Deploy to GitHub Pages under a deterministic URL, e.g.:
      - `https://<user>.github.io/<repo>/pull/<PR_NUMBER>/`
  - After deployment:
    - The workflow either:
      - Posts a comment on the PR containing the preview URL, or
      - Calls a backend endpoint directly with the preview URL (preferred for cleanliness).
- Backend integration:
  - If using PR comments:
    - A GitHub webhook or scheduled job parses PR comments to find the preview URL.
    - The backend writes the `previewUrl` into the corresponding Firestore feedback document.
  - If using a direct callback:
    - GitHub Action calls a secure backend endpoint with:
      - Issue number (or another identifier).
      - `previewUrl`.
    - Backend updates the appropriate Firestore document.
- Status updates:
  - When a `previewUrl` is set for an item, its status label in GitHub should move to `cf:status/preview`.
  - When the PR is merged:
    - The linked issue’s status label becomes `cf:status/merged`.
    - The UI continues to show the item in a “Merged” tab/view.

## Acceptance Criteria

- Opening a PR linked to a feedback issue results in a deployed preview at:
  - `https://<user>.github.io/<repo>/pull/<PR_NUMBER>/` (or equivalent stable pattern).
- The preview URL is written into the corresponding Firestore feedback document.
- Items with a `previewUrl`:
  - Show a Preview button in the list and detail view.
  - Display `Preview` as the status label (from GitHub).
- When the PR is merged:
  - The item’s status becomes `Merged`.
  - The item remains visible in a merged/archived view per the visibility rules.

