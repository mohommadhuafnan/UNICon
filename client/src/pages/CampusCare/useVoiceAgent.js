import { useRef, useState, useCallback, useEffect } from 'react';
import api from '../../api/client';

// Mic capture worklet: downsamples to 16 kHz mono PCM16 and posts ~100 ms frames (+ RMS level).
const WORKLET_SRC = `
class Capture extends AudioWorkletProcessor {
  constructor() {
    super();
    this.ratio = sampleRate / 16000;
    this.phase = 0; this.sum = 0; this.cnt = 0;
    this.out = new Int16Array(1600); this.n = 0; this.energy = 0;
  }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;
    for (let i = 0; i < ch.length; i++) {
      this.sum += ch[i]; this.cnt++; this.phase += 1;
      if (this.phase >= this.ratio) {
        this.phase -= this.ratio;
        const v = Math.max(-1, Math.min(1, this.sum / this.cnt));
        this.sum = 0; this.cnt = 0;
        this.out[this.n++] = v < 0 ? v * 32768 : v * 32767;
        this.energy += v * v;
        if (this.n === this.out.length) {
          this.port.postMessage({ pcm: this.out.buffer, rms: Math.sqrt(this.energy / this.n) }, [this.out.buffer]);
          this.out = new Int16Array(1600); this.n = 0; this.energy = 0;
        }
      }
    }
    return true;
  }
}
registerProcessor('capture', Capture);
`;

const liveUrl = () => {
  const base = api.defaults.baseURL || '/api';
  const path = `${base.replace(/\/+$/, '')}/agent/live`;
  if (/^https?:/i.test(path)) return path.replace(/^http/i, 'ws');
  return `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}${path}`;
};

const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

/**
 * Realtime voice session with the Gemini Live agent (through the server proxy).
 * handlers: onReady, onTranscript(role, text), onTurnEnd(kind), onOptions(opts), onSubmitted(data),
 *           onNotice(message), onError(message), onClosed()
 */
export const useVoiceAgent = (handlers) => {
  const [status, setStatus] = useState('idle'); // idle | connecting | listening | speaking
  const [muted, setMuted] = useState(false);
  const h = useRef(handlers);
  h.current = handlers;
  const mutedRef = useRef(false);
  const r = useRef({ sources: new Set(), nextTime: 0, level: 0 });

  const teardown = useCallback((drain = false) => {
    const s = r.current;
    s.ready = false;
    try {
      s.ws?.readyState === 1 && s.ws.send(JSON.stringify({ type: 'end' }));
      s.ws?.close();
    } catch {
      /* already closed */
    }
    s.ws = null;
    s.stream?.getTracks().forEach((t) => t.stop());
    s.stream = null;
    s.node?.disconnect();
    s.micCtx?.close().catch(() => {});
    s.node = null;
    s.micCtx = null;
    const finishPlayback = () => {
      s.playCtx?.close().catch(() => {});
      s.playCtx = null;
      setStatus('idle');
    };
    if (drain && s.sources.size) {
      s.onDrained = finishPlayback; // close once the last queued audio has played
      setStatus('speaking');
    } else {
      s.sources.forEach((src) => {
        src.onended = null;
        try {
          src.stop();
        } catch {
          /* not started */
        }
      });
      s.sources.clear();
      finishPlayback();
    }
  }, []);

  useEffect(() => () => teardown(false), [teardown]);

  const interrupt = () => {
    const s = r.current;
    s.sources.forEach((src) => {
      src.onended = null;
      try {
        src.stop();
      } catch {
        /* not started */
      }
    });
    s.sources.clear();
    s.nextTime = 0;
    setStatus((st) => (st === 'speaking' ? 'listening' : st));
  };

  const play = (buf) => {
    const s = r.current;
    const ctx = s.playCtx;
    if (!ctx) return;
    const even = buf.byteLength - (buf.byteLength % 2);
    const i16 = new Int16Array(buf.slice(0, even));
    const f32 = new Float32Array(i16.length);
    for (let i = 0; i < i16.length; i++) f32[i] = i16[i] / 32768;
    const ab = ctx.createBuffer(1, f32.length, 24000);
    ab.copyToChannel(f32, 0);
    const src = ctx.createBufferSource();
    src.buffer = ab;
    src.connect(s.analyser);
    const when = Math.max(ctx.currentTime + 0.03, s.nextTime);
    src.start(when);
    s.nextTime = when + ab.duration;
    s.sources.add(src);
    src.onended = () => {
      s.sources.delete(src);
      if (s.sources.size === 0) {
        if (s.onDrained) {
          const done = s.onDrained;
          s.onDrained = null;
          done();
        } else setStatus('listening');
      }
    };
    setStatus('speaking');
  };

  const start = useCallback(
    async ({ sessionId, anonymous }) => {
      const s = r.current;
      if (s.ws) return;
      setStatus('connecting');
      try {
        s.stream = await navigator.mediaDevices.getUserMedia({
          audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
      } catch {
        setStatus('idle');
        h.current.onError?.('Microphone access was blocked. Allow the microphone in your browser settings to talk to the assistant.');
        return;
      }
      try {
        s.micCtx = new AudioContext();
        await s.micCtx.resume();
        const url = URL.createObjectURL(new Blob([WORKLET_SRC], { type: 'application/javascript' }));
        await s.micCtx.audioWorklet.addModule(url);
        URL.revokeObjectURL(url);
        s.node = new AudioWorkletNode(s.micCtx, 'capture');
        s.micCtx.createMediaStreamSource(s.stream).connect(s.node);
        s.node.port.onmessage = ({ data }) => {
          s.inLevel = data.rms;
          if (s.ready && !mutedRef.current && s.ws?.readyState === 1) s.ws.send(data.pcm);
        };

        s.playCtx = new AudioContext({ sampleRate: 24000 });
        await s.playCtx.resume();
        s.analyser = s.playCtx.createAnalyser();
        s.analyser.fftSize = 256;
        s.analyser.connect(s.playCtx.destination);
        s.analyserData = new Uint8Array(s.analyser.fftSize);
        s.nextTime = 0;

        const ws = new WebSocket(liveUrl());
        ws.binaryType = 'arraybuffer';
        s.ws = ws;
        ws.onopen = () =>
          ws.send(JSON.stringify({ type: 'start', token: localStorage.getItem('uniconnect_token'), sessionId, anonymous }));
        ws.onmessage = (e) => {
          if (typeof e.data !== 'string') return play(e.data);
          const m = JSON.parse(e.data);
          switch (m.type) {
            case 'ready':
              s.ready = true;
              setStatus('listening');
              h.current.onReady?.(m);
              break;
            case 'transcript':
              h.current.onTranscript?.(m.role, m.text);
              break;
            case 'interrupted':
              interrupt();
              h.current.onTurnEnd?.('interrupted');
              break;
            case 'turnComplete':
              h.current.onTurnEnd?.('turnComplete');
              break;
            case 'options':
              h.current.onOptions?.(m);
              break;
            case 'submitted':
              h.current.onSubmitted?.(m.submitted);
              break;
            case 'notice':
              h.current.onNotice?.(m.message);
              break;
            case 'error':
              h.current.onError?.(m.message);
              break;
            default:
          }
        };
        ws.onclose = () => {
          if (!r.current.ws) return; // closed by us
          teardown(true);
          h.current.onClosed?.();
        };
        ws.onerror = () => h.current.onError?.('Could not reach the voice service. Please use text chat.');
      } catch (err) {
        console.error('[voice]', err);
        teardown(false);
        h.current.onError?.('Could not start voice. Please use text chat.');
      }
    },
    [teardown]
  );

  const stop = useCallback((drain = false) => teardown(drain), [teardown]);

  const sendJson = (obj) => r.current.ws?.readyState === 1 && r.current.ws.send(JSON.stringify(obj));
  const sendText = (text) => sendJson({ type: 'text', text });
  const sendAnonymous = (value) => sendJson({ type: 'anonymous', value });
  const sendImage = async (file) => sendJson({ type: 'image', data: await toBase64(file), mimeType: file.type, clientId: file.name });

  const toggleMute = () => {
    mutedRef.current = !mutedRef.current;
    setMuted(mutedRef.current);
  };

  /** 0..1 loudness of whoever is currently talking (for the orb animation). Read from rAF, no re-render. */
  const getLevel = () => {
    const s = r.current;
    if (s.sources.size && s.analyser) {
      s.analyser.getByteTimeDomainData(s.analyserData);
      let sum = 0;
      for (const v of s.analyserData) sum += ((v - 128) / 128) ** 2;
      return Math.min(1, Math.sqrt(sum / s.analyserData.length) * 3);
    }
    return mutedRef.current ? 0 : Math.min(1, (s.inLevel || 0) * 6);
  };

  return { status, muted, start, stop, sendText, sendAnonymous, sendImage, toggleMute, getLevel };
};
