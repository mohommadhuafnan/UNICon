// Dev probe: checks a Gemini Live model supports audio out, transcription and function calling.
// Usage: node scripts/probeLive.mjs <model>
import 'dotenv/config';
import WebSocket from 'ws';

const model = process.argv[2] || 'gemini-2.5-flash-native-audio-latest';
const ws = new WebSocket(
  `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${process.env.GEMINI_API_KEY}`
);
let audio = 0;
ws.on('open', () =>
  ws.send(
    JSON.stringify({
      setup: {
        model: `models/${model}`,
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } } },
        },
        systemInstruction: { parts: [{ text: 'You are a campus assistant. Be brief. When the user reports a problem call report_problem.' }] },
        tools: [
          {
            functionDeclarations: [
              { name: 'report_problem', description: 'File a report', parameters: { type: 'OBJECT', properties: { title: { type: 'STRING' } }, required: ['title'] } },
            ],
          },
        ],
        inputAudioTranscription: {},
        outputAudioTranscription: {},
      },
    })
  )
);
ws.on('message', (d) => {
  const m = JSON.parse(d.toString());
  if (m.setupComplete) {
    console.log('setupComplete');
    ws.send(JSON.stringify({ realtimeInput: { text: 'The library air conditioner is broken, please file a report.' } }));
    return;
  }
  const sc = m.serverContent;
  if (sc?.modelTurn) for (const p of sc.modelTurn.parts) if (p.inlineData) audio += p.inlineData.data.length;
  if (sc?.outputTranscription) console.log('out:', sc.outputTranscription.text);
  if (sc?.turnComplete) {
    console.log('turnComplete, audio base64 chars =', audio);
    setTimeout(() => process.exit(0), 300);
  }
  if (m.toolCall) {
    console.log('toolCall', JSON.stringify(m.toolCall));
    ws.send(JSON.stringify({ toolResponse: { functionResponses: m.toolCall.functionCalls.map((c) => ({ id: c.id, name: c.name, response: { ok: true } })) } }));
  }
});
ws.on('close', (c, r) => {
  console.log('closed', c, r.toString());
  process.exit(0);
});
ws.on('error', (e) => console.log('err', e.message));
setTimeout(() => process.exit(0), 40000);
