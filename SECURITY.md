# Security policy

- Never commit `auth/`, `run/`, `*.log`, `buffer.json` or any session
  credential. Enforced two ways: .gitignore excludes them, and CI runs a
  privacy scan on every push/PR that fails if credential/session filenames
  are tracked or if phone-number patterns appear in tracked files
  (best-effort, see .github/workflows/ci.yml).
- Session credentials are WhatsApp account keys: treat `auth/` like a
  password. Mode 0700, local volumes only.
- Report vulnerabilities by opening a private security advisory on GitHub,
  not a public issue.
