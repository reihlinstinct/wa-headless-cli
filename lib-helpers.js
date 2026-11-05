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
module.exports = { extractText, isGroupJid, isStatusBroadcast, phoneToJid, makeNameResolver };
