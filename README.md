# wa-headless-cli

Headless WhatsApp Web on Linux - no browser UI. Pair with a QR printed as
terminal text, listen to messages in real time, send from the shell.
Built on [Baileys](https://github.com/WhiskeySockets/Baileys) (pure JS
WhatsApp Web protocol): no Chrome, no native modules.

![CI](../../actions/workflows/ci.yml/badge.svg)

> Unofficial library. WhatsApp may restrict accounts that use it.
> Prefer a dedicated secondary number. See `docs/design.md`.

## Run (container, nothing installed on the host)

```sh
podman build -t wa-headless .
podman run --rm -it -v wa-auth:/app/auth -v wa-run:/app/run wa-headless
```

Scan the terminal QR: WhatsApp > Settings > Linked devices > Link a device.
The session persists in the `wa-auth` volume; later runs need no QR.

## Run (bare metal)

```sh
npm ci
node cli.js listen                       # pair + listen
node cli.js send 9725XXXXXXX@s.whatsapp.net "hello"
```

## Features

- Pair with a QR printed as terminal text (PNG also written); session
  persists and reconnects without a QR
- `listen`: logs every message as it arrives - time, direction, direct vs
  group, media type - with sender names resolved from WhatsApp display
  names (pushName), live address-book contact sync (contacts.upsert), and
  the session's LID-to-phone mapping
- `send <jid> <text>`: one-off send from the shell
- No browser, no native modules; runs in a container

## Privacy

Metadata-only logs; message contents are held at most in a local 20-message
rolling buffer (mode 0600) for interactive "read it" requests and are never
committed. `auth/` and `run/` are git-ignored. No message is ever sent
unless explicitly instructed. Details: `docs/design.md`.

## Development

```sh
npm test          # node:test unit tests
```

CI runs the tests inside the container image. Issues and PRs: one issue per
change, branch + PR, squash merge.
