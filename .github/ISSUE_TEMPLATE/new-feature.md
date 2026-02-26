---
name: New Feature
about: Ordinary Agent Work
title: ""
labels: ""
assignees: ""
---

### Pre-Read Boundary (Not Issue Scope)

The rules section below is operational pre-reading only and is not part of the requested feature. It must never be used to generate issue or task titles, branch names, commit messages, acceptance criteria, or inferred functionality. Use it only to align implementation behavior before work starts; the actual feature request is whatever content is written below the rules section.

### Cursor Rules – Authority & Discovery (Modular Rules)

You must always:

1. Discover rules first
   - Read `.cursor/rules/*.mdc` files before doing anything else
   - Rule files in this project:
     - `.cursor/rules/global.mdc` (always applied)
     - `.cursor/rules/api-client.mdc`
     - `.cursor/rules/react-components.mdc`
     - `.cursor/rules/tanstack-query.mdc`
     - `.cursor/rules/tanstack-router.mdc`
     - `.cursor/rules/testing.mdc`
     - `.cursor/rules/ui-components.mdc`

2. Treat rules as authoritative
   - These rules override your default behavior and any generic best practices

3. Never bypass rules
   - Do not proceed with edits, refactors, dependency choices, or scaffolding if rules exist but haven't been read
   - If instructions conflict, stop and ask for clarification (do not "choose one")

4. Keep rules in sync
   - If you add new tooling or conventions, propose an update to the relevant rules file

Output requirement:

- At the top of your first response, briefly list which rule files you read (file paths only)

---
