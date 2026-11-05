# wa-headless-cli - Design

## Goal
Use WhatsApp Web from a Linux terminal with no browser UI: pair with a QR
rendered as terminal text, listen to incoming messages in real time, and send
messages from the command line. Runs on a bare Linux box or in a container
(podman/docker); nothing is installed on the host beyond the container runtime.

## Approach
- Engine: `@whiskeysockets/baileys` (pure JavaScript implementation of the
  WhatsApp Web multi-device protocol over WebSocket). No Chrome, no Puppeteer,
  no native modules. Chosen after `whatsmeow-node` (N-API bindings over the Go
  whatsmeow library) failed to install: its prebuilt binary for linux-x64
  404s at release v0.1.3.
- Pairing: WhatsApp emits QR strings over the socket; `qrcode-terminal`
  renders them in the terminal (and `qrcode` writes a PNG for relay).
  Scan with the phone: Settings > Linked devices > Link a device.
  A pairing-code flow (8-char code typed on the phone) is a planned option.
- Session: `useMultiFileAuthState` persists credentials + signal keys in
  `auth/`; reconnects need no QR. `auth/` is git-ignored and mode 0700.
- Commands:
  - `listen` (default): connect, print QR if unpaired, log every incoming /
    synced-outgoing message as it arrives.
  - `send <jid> <text>`: connect, send one text message, exit.
- Addressing: a contact is a JID, `<international number without +>@s.whatsapp.net`.
  Newer accounts/contacts may appear as `<lid>@lid`; the session's
  `lid-mapping-*` files map LID <-> phone. Groups are `<id>@g.us` with the
  sender in `key.participant` and the display name in `pushName`.

## Privacy model (hard requirements from the owner)
- The persistent log (`run/run.log`) records metadata only: timestamp,
  direction, JID, group participant, pushName. Never message contents.
- Contents live only in a small in-memory-style rolling buffer
  (`run/buffer.json`, last 20, mode 0600) so "read me that message" requests
  can be served during an interactive session; it is local, private, and
  never committed (git-ignored).
- Nothing is sent unless the owner explicitly instructs a specific message.
- Session credentials are never committed or uploaded anywhere.

## Limitations
- Unofficial library: WhatsApp can restrict or ban accounts using it.
  A dedicated secondary number is recommended for regular use.
- History: on pairing WhatsApp pushes recent history (archived chats
  included, with archive flags). Full history sync is optional
  (`syncFullHistory`), off by default.
- A linked session dies if the phone unpairs the device or the session
  stays offline past WhatsApp's linked-device limits.

## Verification (done 2026-11-05, owner's own number, with his approval)
Pair via terminal QR -> connect as own JID -> send to self -> receive live
inbound (direct + group traffic) -> LID->phone resolution. All passed.
