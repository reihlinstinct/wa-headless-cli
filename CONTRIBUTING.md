# Contributing

- One issue per change; branch per issue; PR references the issue; squash merge.
- Run `npm test` before pushing; CI must be green (unit tests + CLI smoke test
  inside the container image).
- Never commit credentials, session data, logs, real phone numbers or message
  contents. CI runs a best-effort privacy scan; `auth/`, `run/`, `*.log` and
  `buffer.json` are git-ignored.
- Commits are signed; PRs get an independent review before merge.
