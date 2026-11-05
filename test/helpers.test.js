'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { extractText, isGroupJid, isStatusBroadcast, phoneToJid } = require('../src/lib-helpers');

test('extractText reads plain conversation', () => {
  assert.strictEqual(extractText({ conversation: 'hi' }), 'hi');
});
test('extractText reads extended text', () => {
  assert.strictEqual(extractText({ extendedTextMessage: { text: 'yo' } }), 'yo');
});
test('extractText returns null for non-text', () => {
  assert.strictEqual(extractText({ imageMessage: {} }), null);
  assert.strictEqual(extractText(null), null);
});
test('group and broadcast JIDs', () => {
  assert.ok(isGroupJid('120363@g.us'));
  assert.ok(!isGroupJid('9725@s.whatsapp.net'));
  assert.ok(isStatusBroadcast('status@broadcast'));
  assert.ok(!isStatusBroadcast('120363@g.us'));
});
test('phoneToJid normalizes', () => {
  assert.strictEqual(phoneToJid('+1 (555) 010-0199'), '15550100199@s.whatsapp.net');
  assert.throws(() => phoneToJid('---'));
});

// Contact-name resolution (synthetic data only)
const { makeNameResolver } = require('../src/lib-helpers');
const names = { '15550100001': 'Ima Example', '15550100002@s.whatsapp.net': 'Abba Example' };
const lids = { '900000000001': '15550100001' };
const resolve = makeNameResolver(names, lids);

test('resolves phone JID with device suffix', () => {
  assert.strictEqual(resolve('15550100001:3@s.whatsapp.net'), 'Ima Example');
});
test('resolves JID keyed with full jid entry', () => {
  assert.strictEqual(resolve('15550100002@s.whatsapp.net'), 'Abba Example');
});
test('resolves LID via mapping to address-book name', () => {
  assert.strictEqual(resolve('900000000001@lid'), 'Ima Example');
});
test('unknown JID and empty input resolve to null', () => {
  assert.strictEqual(resolve('15550999999@s.whatsapp.net'), null);
  assert.strictEqual(resolve(null), null);
});
test('resolver tolerates missing maps', () => {
  const r = makeNameResolver();
  assert.strictEqual(r('15550100001@s.whatsapp.net'), null);
});

// Chat-state mutation summaries (synthetic)
const { chatUpdateSummary } = require('../src/lib-helpers');
test('chatUpdateSummary: archive/pin/mute/read transitions', () => {
  assert.strictEqual(chatUpdateSummary({ archived: true }), 'archived');
  assert.strictEqual(chatUpdateSummary({ archived: false }), 'unarchived');
  assert.strictEqual(chatUpdateSummary({ pinned: 5 }), 'pinned');
  assert.strictEqual(chatUpdateSummary({ pinned: null, muteEndTime: 1893456000 }), 'muted');
  assert.strictEqual(chatUpdateSummary({ muteEndTime: 0 }), 'unmuted');
  assert.strictEqual(chatUpdateSummary({ unreadCount: 0 }), 'marked-read');
  assert.strictEqual(chatUpdateSummary({ archived: true, pinned: 1 }), 'archived,pinned');
  assert.strictEqual(chatUpdateSummary({ conversationTimestamp: 123 }), null);
  assert.strictEqual(chatUpdateSummary(null), null);
});
