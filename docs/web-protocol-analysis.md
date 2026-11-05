# WhatsApp Web protocol - static bundle analysis (2026-11-05)

Source: public static JS bundles served to any browser at
https://web.whatsapp.com/ (no login). 704 chunks fetched from
static.whatsapp.net/rsrc.php/...; the app-state sync machinery lives in the
WAWebProtobufsProtocol / sync chunks, e.g.:
- https://static.whatsapp.net/rsrc.php/v4/yV/r/pSsDcQKry-Z.js
- https://static.whatsapp.net/rsrc.php/v4/yk/r/UCqkwXoYSpK.js
Read-only analysis of public files; no session, no pairing, no sends.

## How chat state syncs (archive / pin / mute / read)

Chat state is NOT part of messages. It syncs as **app-state mutations**
(SyncActionValue protobufs) in five LTHash-verified collections:

    REGULAR=1, REGULAR_LOW=2, REGULAR_HIGH=3,
    CRITICAL_BLOCK=4, CRITICAL_UNBLOCK_LOW=5

Relevant mutation actions found verbatim in the bundles:

    ARCHIVE_CHAT_ACTION:"archive"        PIN_ACTION:"pin_v1"
    MUTE_ACTION:"mute"                   MARK_CHAT_AS_READ_ACTION:"markChatAsRead"
    CLEAR_CHAT_ACTION:"clearChat"        DELETE_CHAT_ACTION:"deleteChat"
    STAR_ACTION:"star"                   DELETE_MESSAGE_FOR_ME_ACTION:"deleteMessageForMe"
    UNARCHIVE_CHATS_SETTING:"setting_unarchiveChats"
    LABEL_* (label_message/label_edit/label_jid)

So "archived" is a per-chat flag maintained by `archive` mutations in an
app-state collection; the initial value arrives inside history sync, and
later changes arrive as live mutations on the same socket as messages.

## Contact source: WhatsApp-internal storage (owner context)

The owner's WhatsApp has NO phone-address-book permission; his contacts are
saved in WhatsApp's own contact storage. Consequence: names do NOT come from
an OS address book on the linked device. They arrive only as:

- CONTACT_ACTION / LID_CONTACT_ACTION app-state mutations (the same
  collection sync as above) -> Baileys emits `contacts.upsert` with
  {id, name, username, lid, phoneNumber} (see processContactAction in
  lib/Utils/sync-action-utils.js), plus `lid-mapping.update` for LID-PN pairs
  learned from those mutations;
- per-message `pushname` -> Baileys emits `contacts.update` {id, notify}.

Both are already merged into the CLI's local names DB, and the CLI also
subscribes `lid-mapping.update` to keep the live LID->phone map current.
No history sync is needed for this path: app-state patches flow on every
connect. Caveat: contacts never mutated after linking may only appear via
history sync or their first incoming message (pushname).

## How contact names sync

- CONTACT_ACTION ("contact") mutations carry address-book names.
- LID_CONTACT_ACTION (proto field 61) and OUT_CONTACT_ACTION (79) extend this
  to LID-only / username-era contacts (no phone number exposed).
- PUSH_NAME_SETTING ("setting_pushName") carries the account's own display
  name; per-message `pushname` carries the sender's.
- PN<->LID mapping is maintained in a dedicated lid-mapping key store and
  via pnForLid chat actions; web logs explicitly warn on
  "missing-pn-lid-mapping" in 1:1 messages with usernames.

## What Baileys already decodes (lib/Utils/chat-utils.js, v7.0.0-rc14)

Baileys parses the same collections and mutations and emits:

| Web mechanism                    | Baileys event                                  |
|----------------------------------|------------------------------------------------|
| archive mutation                 | chats.update {id, archived: true/false}        |
| pin_v1 / mute / markChatAsRead   | chats.update {id, pinned/muteEndTime/unreadCount} |
| contact / lidContact actions     | contacts.update / contacts.upsert {id, name}   |
| per-message pushname             | contacts.update {id, notify} (automatic)       |
| setting_unarchiveChats           | creds.update {accountSettings.unarchiveChats}  |
| star / deleteMessageForMe        | messages.update / messages.delete              |
| clearChat / deleteChat           | chats.delete                                   |
| PN<->LID store                   | Signal/lid-mapping.js (persisted lid-mapping-* files) |

## What this CLI now does with it

- `chats.update` -> logs live CHAT-STATE transitions (archived/unarchived,
  pinned, muted, marked-read) with resolved contact name. Metadata only.
- `contacts.update` + `contacts.upsert` -> merged into the local names DB
  (address-book + display + LID contact names), used for JID/LID resolution.
- Synthetic unit tests cover chatUpdateSummary and the name resolver.

## Open questions (tracked in issues)

- #5 archived/muted real-time gap: archive state does NOT gate message
  delivery on the wire (it is display state), so the 2026-11-05 miss is more
  likely server-side batching/deferral for muted+archived groups or a
  reconnect gap. Needs a controlled repro: message posted to an archived
  group while the listener is up, watching for any upsert/notification.
- #6 group subject resolution via read-only groupMetadata.
