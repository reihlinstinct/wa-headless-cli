#!/usr/bin/env node
/* wa-headless CLI: listen | send <jid> <text> */
const path = require('path');
const fs = require('fs');
const qrcodeTerminal = require('qrcode-terminal');
const QR = require('qrcode');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
} = require('@whiskeysockets/baileys');

const AUTH_DIR = process.env.WA_AUTH_DIR || path.join(__dirname, 'auth');
const RUN_DIR = process.env.WA_RUN_DIR || path.join(__dirname, 'run');

// --- contact-name resolution (metadata only) ---
const NAMES_FILE = path.join(RUN_DIR, 'names.json');
let namesDb = {};
try { namesDb = JSON.parse(fs.readFileSync(NAMES_FILE, 'utf8')); } catch (e) {}
function loadLidMaps() {
  const m = {};
  try {
    for (const f of fs.readdirSync(AUTH_DIR)) {
      const r = /^lid-mapping-(.+)_reverse\.json$/.exec(f);
      if (r) { try { m[r[1]] = JSON.parse(fs.readFileSync(path.join(AUTH_DIR, f), 'utf8')); } catch (e) {} }
    }
  } catch (e) {}
  return m;
}
const lidToPhone = loadLidMaps();
function resolveName(jid) {
  if (!jid) return null;
  const id = String(jid).split('@')[0].split(':')[0];
  if (namesDb[jid]) return namesDb[jid];
  if (namesDb[id]) return namesDb[id];
  const phone = lidToPhone[id];
  if (phone && (namesDb[phone] || namesDb[phone + '@s.whatsapp.net'])) return namesDb[phone] || namesDb[phone + '@s.whatsapp.net'];
  return null;
}
const log = (...a) => console.log(new Date().toISOString(), ...a);

async function connect({ onOpen, keepAlive }) {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();
  log('using WA version', version.join('.'));
  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    browser: ['wa-headless-cli', 'CLI', '0.1.0'],
    syncFullHistory: false,
  });
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', async (u) => {
    const { qr, connection, lastDisconnect } = u;
    if (qr) {
      fs.writeFileSync(path.join(RUN_DIR, 'qr.txt'), qr + '\n' + new Date().toISOString() + '\n');
      await QR.toFile(path.join(RUN_DIR, 'qr.png'), qr, { scale: 8, margin: 2 });
      log('QR-EVENT fresh QR written to run/qr.txt and run/qr.png');
      console.log('--- scan this QR (WhatsApp > Linked devices > Link a device) ---');
      qrcodeTerminal.generate(qr, { small: true });
    }
    if (connection === 'open') {
      const me = sock.user && sock.user.id;
      log('CONNECTED as', me || '(unknown)');
      fs.writeFileSync(path.join(RUN_DIR, 'status.txt'), 'connected ' + (me || '') + ' ' + new Date().toISOString() + '\n');
      if (onOpen) await onOpen(sock);
    }
    if (connection === 'close') {
      const code = lastDisconnect && lastDisconnect.error && lastDisconnect.error.output && lastDisconnect.error.output.statusCode;
      log('CLOSED, statusCode =', code);
      if (code !== DisconnectReason.loggedOut) log('(will exit; rerun to reconnect)');
      process.exit(0);
    }
  });
  const BUFFER = path.join(RUN_DIR, 'buffer.json');
  sock.ev.on('contacts.upsert', (cs) => { let ch = 0; for (const c of cs) { const id = c.id || c.jid; const n = c.name || c.notify; if (id && n && !namesDb[id]) { namesDb[id] = n; ch++; } } if (ch) fs.writeFileSync(NAMES_FILE, JSON.stringify(namesDb, null, 1), { mode: 0o600 }); });
  sock.ev.on('messages.upsert', (m) => {
    let buf = [];
    try { buf = JSON.parse(fs.readFileSync(BUFFER, 'utf8')); } catch (e) {}
    log('UPSERT type=' + m.type + ' count=' + m.messages.length);
    for (const msg of m.messages) {
      const from = msg.key.remoteJid;
      if (!msg.message) log('NOMESSAGE', from, 'stub=' + msg.messageStubType, 'type=' + m.type);
      const fromMe = !!msg.key.fromMe;
      const text = extractText(msg.message);
      const isGroup = String(from).endsWith('@g.us');
      const mediaType = msg.message ? (Object.keys(msg.message).find(k => /Message$/.test(k) && k !== 'extendedTextMessage' && k !== 'messageContextInfo') || null) : null;
      const stub = msg.messageStubType != null ? ' stub=' + msg.messageStubType : '';
      // metadata-only persistent log; direct-chat text lives only in the small private rolling buffer
      const meta = (msg.key.participant ? ' participant=' + msg.key.participant : '') + (msg.pushName ? ' name=' + msg.pushName : '');
      const cname = resolveName(from) || resolveName(msg.key.participant);
      log('MSG', fromMe ? 'OUT' : 'IN', from + meta + (cname ? ' contact=' + cname : '') + (mediaType ? ' media=' + mediaType : '') + stub);
      if (text && !isGroup) {
        buf.push({ ts: new Date().toISOString(), dir: fromMe ? 'OUT' : 'IN', jid: from, name: cname || msg.pushName || null, text: String(text).slice(0, 500) });
        buf = buf.slice(-20);
        fs.writeFileSync(BUFFER, JSON.stringify(buf, null, 1), { mode: 0o600 });
      }
    }
  });
  return sock;
}

async function main() {
  const [cmd, ...args] = process.argv.slice(2);
  if (cmd === 'send') {
    const [jid, ...textParts] = args;
    const text = textParts.join(' ');
    await connect({
      onOpen: async (sock) => {
        await sock.sendMessage(jid, { text });
        log('SENT to', jid, ':', text.slice(0, 200));
        setTimeout(() => process.exit(0), 3000);
      },
    });
  } else if (cmd === 'listen' || !cmd) {
    log('listening... (QR will appear below if not paired)');
    await connect({});
  } else {
    console.error('usage: cli.js [listen] | send <jid> <text>');
    process.exit(1);
  }
}
main().catch((e) => { console.error('FATAL', e); process.exit(1); });
