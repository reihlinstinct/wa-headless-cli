# Security policy

- Never commit `auth/`, `run/`, `*.log` or `buffer.json` (enforced via
  .gitignore; CI checks for accidental credential files).
- Session credentials are WhatsApp account keys: treat `auth/` like a
  password. Mode 0700, local volumes only.
- Report vulnerabilities by opening a private security advisory on GitHub,
  not a public issue.
