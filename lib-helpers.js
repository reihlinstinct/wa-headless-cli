'use strict';
// Pure helpers shared by cli.js, kept network-free for unit tests.
function extractText(message) {
  if (!message) return null;
  if (typeof message.conversation === 'string') return message.conversation;
  if (message.extendedTextMessage && typeof message.extendedTextMessage.text === 'string') {
    return message.extendedTextMessage.text;
  }
  return null;
}
function isGroupJid(jid) { return typeof jid === 'string' && jid.endsWith('@g.us'); }
function isStatusBroadcast(jid) { return jid === 'status@broadcast'; }
function phoneToJid(phone) {
  const digits = String(phone).replace(/[^0-9]/g, '');
  if (!digits) throw new Error('empty phone number');
  return digits + '@s.whatsapp.net';
}
// Resolve a JID (phone or LID, with optional device suffix) to a contact name
// using the names DB (address-book names from contacts.upsert, display names)
// and the session's LID->phone mapping. Pure: data in, name or null out.
function makeNameResolver(namesDb, lidToPhone) {
  const names = namesDb || {};
  const lids = lidToPhone || {};
  return function resolveName(jid) {
    if (!jid) return null;
    const id = String(jid).split('@')[0].split(':')[0];
    if (names[jid]) return names[jid];
    if (names[id]) return names[id];
    const phone = lids[id];
    if (phone && (names[phone] || names[phone + '@s.whatsapp.net'])) return names[phone] || names[phone + '@s.whatsapp.net'];
    return null;
  };
}
// Summarize a Baileys chats.update entry (from app-state mutations: archive,
// pin, mute, mark-read) into a metadata-only string. Pure; no contents.
function chatUpdateSummary(u) {
  if (!u || typeof u !== 'object') return null;
  const parts = [];
  if (u.archived === true) parts.push('archived');
  if (u.archived === false) parts.push('unarchived');
  if (u.pinned != null) parts.push(u.pinned ? 'pinned' : 'unpinned');
  if (u.muteEndTime != null) parts.push(Number(u.muteEndTime) > 0 ? 'muted' : 'unmuted');
  if (u.unreadCount === 0) parts.push('marked-read');
  return parts.length ? parts.join(',') : null;
}
module.exports = { chatUpdateSummary, extractText, isGroupJid, isStatusBroadcast, phoneToJid, makeNameResolver };
