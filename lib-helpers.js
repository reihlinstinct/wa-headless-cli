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
module.exports = { extractText, isGroupJid, isStatusBroadcast, phoneToJid };
