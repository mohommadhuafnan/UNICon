// End-to-end test of the realtime voice agent against a RUNNING server (real Gemini Live + MongoDB).
// Usage: node scripts/testLiveAgent.js <speech16k.wav>   (16 kHz, 16-bit, mono WAV of the student's complaint)
import 'dotenv/config';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import WebSocket from 'ws';
import User from '../models/User.js';

const WS_URL = process.env.LIVE_WS || 'ws://localhost:5000/api/agent/live';
const API = process.env.LIVE_API || 'http://localhost:5000/api';
const wavPath = process.argv[2];

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

let passed = 0;
let failed = 0;
const check = (name, ok, extra = '') => {
  ok ? passed++ : failed++;
  console.log(`${ok ? '  PASS' : '  FAIL'}  ${name}${extra ? `  -> ${extra}` : ''}`);
};

const tokenFor = async (email) => {
  const u = await User.findOne({ email });
  return jwt.sign({ id: u._id }, process.env.JWT_SECRET || 'uniconnect_super_secret_jwt_key_2026_campus_intelligence', { expiresIn: '1h' });
};
const getJson = async (token, p) => (await fetch(`${API}${p}`, { headers: { Authorization: `Bearer ${token}` } })).json();

// WAV -> raw PCM (skip the 44-byte header; the generator writes a plain PCM header)
const pcmOf = (file) => {
  const b = fs.readFileSync(file);
  const dataAt = b.indexOf('data') + 8;
  return b.subarray(dataAt);
};

/** Opens a live session and returns helpers + an event log. */
const open = (start) =>
  new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    const log = { audioBytes: 0, user: '', bot: '', options: [], submitted: null, errors: [], notices: [], turns: 0, ready: null, ended: false };
    const waiters = [];
    const wake = () => waiters.splice(0).forEach((w) => w());
    ws.on('open', () => ws.send(JSON.stringify({ type: 'start', ...start })));
    ws.on('message', (data, isBinary) => {
      if (isBinary) {
        log.audioBytes += data.length;
        return wake();
      }
      const m = JSON.parse(data.toString());
      if (m.type === 'ready') {
        log.ready = m;
        resolve({ ws, log, waitFor, sendAudio });
      }
      if (m.type === 'transcript') log[m.role === 'user' ? 'user' : 'bot'] += m.text;
      if (m.type === 'options') log.options.push(m);
      if (m.type === 'submitted') log.submitted = m.submitted;
      if (m.type === 'error') {
        log.errors.push(m.message);
        if (!log.ready) resolve({ ws, log, waitFor, sendAudio });
      }
      if (m.type === 'notice') log.notices.push(m.message);
      if (m.type === 'turnComplete') log.turns++;
      wake();
    });
    ws.on('close', () => {
      log.ended = true;
      wake();
    });
    ws.on('error', reject);
    const waitFor = (cond, ms = 60000) =>
      new Promise((res) => {
        const t = setTimeout(() => res(false), ms);
        const check = () => {
          if (cond()) {
            clearTimeout(t);
            res(true);
          } else waiters.push(check);
        };
        check();
      });
    // Stream PCM like a microphone: 100 ms frames in real time
    const sendAudio = async (pcm) => {
      for (let i = 0; i < pcm.length && ws.readyState === 1; i += 3200) {
        ws.send(pcm.subarray(i, i + 3200));
        await new Promise((r) => setTimeout(r, 100));
      }
      // trailing silence so server-side VAD detects the end of speech
      for (let i = 0; i < 15; i++) {
        ws.send(Buffer.alloc(3200));
        await new Promise((r) => setTimeout(r, 100));
      }
    };
  });

const main = async () => {
  for (let i = 0; ; i++) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 20000 });
      break;
    } catch (e) {
      if (i > 4) throw e;
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  const student = await tokenFor('student@gmail.com');
  const studentName = (await User.findOne({ email: 'student@gmail.com' })).name;
  const librarian = await tokenFor('library@gmail.com');
  const security = await tokenFor('security@seu.ac.lk');

  console.log('\n== 1. Auth / protocol guards ==');
  const bad = await open({ token: 'not-a-token' });
  check('invalid token rejected', bad.log.errors.length > 0 && !bad.log.ready, bad.log.errors[0]);
  bad.ws.close();

  console.log('\n== 2. Spoken complaint -> routed + filed ==');
  const a = await open({ token: student, anonymous: false });
  check('session ready', !!a.log.ready?.sessionId, a.log.errors[0] || '');
  await a.waitFor(() => a.log.turns >= 1, 40000); // greeting
  check('assistant greets with audio', a.log.audioBytes > 0 && a.log.bot.length > 0, `${a.log.audioBytes} audio bytes, "${a.log.bot.trim().slice(0, 80)}"`);
  const greetingAudio = a.log.audioBytes;
  const pcm = pcmOf(wavPath);
  await a.sendAudio(pcm);
  let answers = 0;
  const followUpAnswers = ['It is the main library, second floor reading room, and it affects every student studying there.', 'Yes, it has been like this for three days.'];
  while (!a.log.submitted && answers <= followUpAnswers.length) {
    const turnsBefore = a.log.turns;
    const done = await a.waitFor(() => a.log.submitted || a.log.turns > turnsBefore, 60000);
    if (!done) break;
    await new Promise((r) => setTimeout(r, 1500));
    if (a.log.submitted) break;
    if (answers < followUpAnswers.length) a.ws.send(JSON.stringify({ type: 'text', text: followUpAnswers[answers++] }));
    else break;
  }
  await a.waitFor(() => a.log.submitted, 30000);
  console.log(`   heard: "${a.log.user.trim()}"`);
  console.log(`   said : "${a.log.bot.trim().slice(0, 300)}"`);
  check('speech was transcribed (understood the audio)', /library|air|condition|reading/i.test(a.log.user), a.log.user.trim().slice(0, 80));
  check('assistant replied with more audio', a.log.audioBytes > greetingAudio);
  check('report submitted via tool call', !!a.log.submitted, a.log.errors.concat(a.log.notices).join('; '));
  check('routed to Library Services', a.log.submitted?.department === 'Library Services', a.log.submitted?.department);
  check('priority assigned', ['Medium', 'High', 'Critical', 'Low'].includes(a.log.submitted?.priority), a.log.submitted?.priority);
  const ticket = a.log.submitted?.ticketNumber;
  if (ticket) {
    const v = await getJson(librarian, `/issues/${ticket}`);
    check('ticket exists in DB and visible to the Library officer', v.data?.ticketNumber === ticket && v.data?.routingDecision?.assignedUnit === 'Library Services');
    check('ticket carries the student identity (not anonymous)', v.data?.reporter?.name === studentName);
    // duplicates: a second submission attempt on the same session must not create another ticket
    a.ws.send(JSON.stringify({ type: 'text', text: 'Please submit that report again.' }));
    await new Promise((r) => setTimeout(r, 8000));
    const mine = await getJson(student, '/issues?myOnly=true&limit=100&search=reading');
    check('no duplicate ticket created', (mine.data || []).filter((c) => c.title === v.data.title).length === 1);
  }
  a.ws.close();
  await new Promise((r) => setTimeout(r, 1000));
  const resumed = await open({ token: student, sessionId: a.log.ready.sessionId });
  check('submitted session cannot be reopened', resumed.log.errors.length > 0, resumed.log.errors[0]);
  resumed.ws.close();

  console.log('\n== 3. Anonymous voice session with an image ==');
  const b = await open({ token: student, anonymous: true });
  check('anonymous session ready', !!b.log.ready);
  await b.waitFor(() => b.log.turns >= 1, 40000);
  b.ws.send(JSON.stringify({ type: 'image', data: Buffer.from('not an image at all, definitely').toString('base64') }));
  b.ws.send(JSON.stringify({ type: 'image', data: PNG.toString('base64'), clientId: 'x1' }));
  b.ws.send(
    JSON.stringify({
      type: 'text',
      text: 'My name is Kasun Perera and my registration number is TG/2022/1042. Someone has been stealing laptops from computer lab 2 in the Faculty of Technology after hours. I saw a person leaving with a bag around 8pm yesterday. Please keep me anonymous.',
    })
  );
  const followB = ['Computer lab 2, Faculty of Technology, yesterday around 8pm.', 'It has happened more than once this month.'];
  let nb = 0;
  while (!b.log.submitted && nb <= followB.length) {
    const tb = b.log.turns;
    if (!(await b.waitFor(() => b.log.submitted || b.log.turns > tb, 60000))) break;
    await new Promise((r) => setTimeout(r, 1500));
    if (b.log.submitted) break;
    if (nb < followB.length) b.ws.send(JSON.stringify({ type: 'text', text: followB[nb++] }));
    else break;
  }
  await b.waitFor(() => b.log.submitted, 30000);
  check('invalid image rejected', b.log.notices.some((n) => /not a valid image/i.test(n)), b.log.notices.join('|'));
  check('anonymous report submitted', !!b.log.submitted, b.log.errors.concat(b.log.notices).join('; '));
  check('anonymous flag set on result', b.log.submitted?.isAnonymous === true);
  check('image attached to the report', b.log.submitted?.imageCount === 1, String(b.log.submitted?.imageCount));
  const tb2 = b.log.submitted?.ticketNumber;
  if (tb2) {
    const dept = b.log.submitted.department;
    console.log(`   routed to: ${dept}`);
    const officer = dept === 'Security Division' ? security : await tokenFor('fo.eng@seu.ac.lk').catch(() => security);
    const asAdmin = await getJson(await tokenFor('admin@gmail.com'), `/issues/${tb2}`);
    const blob = JSON.stringify(asAdmin.data);
    check('admin view has no name / reg number', !/Kasun|Perera/i.test(blob) && !blob.includes(studentName) && !/TG\/2022\/1042/.test(blob));
    check('stored text has the typed identity scrubbed', !/Kasun|Perera|TG\/2022\/1042/i.test(`${asAdmin.data?.title} ${asAdmin.data?.description}`));
    void officer;
  }
  b.ws.close();

  console.log(`\nRESULT: ${passed} passed, ${failed} failed`);
  await mongoose.disconnect();
  process.exit(failed ? 1 : 0);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
