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
  - `send <jid> <text>`: connect, send one text message, exit 0 on success;
    exits 1 if the connection closes before the send completes.
- Logging goes to stdout (metadata only); the operator may redirect it,
  e.g. to a local `run/run.log`. Message contents are never logged.
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

## Limitations (observed live, 2026-11-05)
- Unofficial library: WhatsApp can restrict or ban accounts using it.
  A dedicated secondary number is recommended for regular use.
- Session revocation: the owner can unlink the device from the phone at any
  time; the session then dies immediately with disconnect 401 (loggedOut)
  and requires a fresh QR pairing. Rapid reconnect storms during testing may
  also trigger server-side invalidation.
- Archived / muted chats: real-time delivery gaps observed - a media message
  in an archived+muted group never reached the listener while connected.
  History sync pushes recent conversations (archived included, with archive
  flags) but the owner chose not to parse history; new messages only.
- Media: media messages arrive as typed stubs (imageMessage etc.) and are
  logged by type only; downloading media is possible but not implemented.
- A linked session dies if the phone unpairs the device or the session
  stays offline past WhatsApp's linked-device limits.

## Verification
Performed 2026-11-05 with the owner's approval on his own number, on a
functionally equivalent pre-release build (the repo code was restructured
into src/ and helper modules afterwards): pair via terminal QR -> connect as
own JID -> send to self -> receive live inbound (direct + group traffic) ->
LID->phone resolution. All passed. The owner later unlinked the device; the
session is revocable at any time (see Limitations).
