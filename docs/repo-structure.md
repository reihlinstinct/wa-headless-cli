# Repository structure (enforced by CI)

- `src/cli.js` - CLI entrypoint (listen/send, QR, session, event handlers)
- `src/lib-helpers.js` - pure, network-free helpers (unit-tested)
- `test/` - node:test unit + smoke tests
- `docs/design.md` - design and privacy model
- `docs/web-protocol-analysis.md` - protocol findings and Baileys mapping
- `Containerfile` - container build (podman/docker)
- `.github/workflows/ci.yml` - CI
- `README.md`, `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`
