'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { extractText, isGroupJid, isStatusBroadcast, phoneToJid } = require('../lib-helpers');

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
