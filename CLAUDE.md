# CLAUDE.md — MotorPortalWEB

This repo is part of the 4-repo Motor Portal system (MotorPortalAPI,
MotorPortalWEB, MotorPortalDB, MotorPortalDOC).

- Build the real, working system — no stubs, no placeholder logic, no
  "TODO: implement later".
- Keep going until it compiles and runs. Fix your own errors without
  asking for permission to proceed.
- Never end a turn with uncommitted changes. Stage, commit with a
  Conventional Commit message, and push to origin main before stopping.
  Commit in small logical chunks, not one mega-commit.
- Update README.md after every phase of work: what changed, how to
  run/test it, and the progress checklist.
- Do not rename the 15 core entities, the product/process lists, the
  batch status lifecycle values, or the agreed folder structure — other
  repos and prompts assume these exact names.

## This repo

Angular SPA (standalone components) — all operator-facing screens.
Every component has separate .ts/.html/.css files. Talks to MotorPortalAPI
over HTTPS/JWT. Theme: navy `#00305B` background, orange gradient
`#EE7B2E → #C1402C` navbar, accent orange `#EC6608`, white cards.
