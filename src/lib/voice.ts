import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchSpeech, transcribeAudio } from './api';
import { toWav16k } from './wav';

// 면접 답변 녹음. MediaRecorder 로 받고 파형 레벨(0~1)과 경과 초를 화면에 줍니다. (design/04_면접.png 4번)
export type RecorderState = 'idle' | 'recording' | 'processing';

export function useRecorder(maxSeconds: number) {
  const [state, setState] = useState<RecorderState>('idle');
  const [seconds, setSeconds] = useState(0);
  const [levels, setLevels] = useState<number[]>(() => Array(32).fill(0.08));
  const [error, setError] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const stream = useRef<MediaStream | null>(null);
  const audioCtx = useRef<AudioContext | null>(null);
  const raf = useRef(0);
  const timer = useRef(0);
  const resolveStop = useRef<((b: Blob) => void) | null>(null);

  const cleanup = useCallback(() => {
    cancelAnimationFrame(raf.current);
    window.clearInterval(timer.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    void audioCtx.current?.close();
    audioCtx.current = null;
  }, []);
  useEffect(() => cleanup, [cleanup]);

  const supported = typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';

  const stop = useCallback((): Promise<Blob> => {
    return new Promise((resolve) => {
      if (!recorder.current || recorder.current.state === 'inactive') {
        resolve(new Blob(chunks.current, { type: 'audio/webm' }));
        return;
      }
      resolveStop.current = resolve;
      recorder.current.stop();
    });
  }, []);

  const start = useCallback(async () => {
    setError(null);
    if (!supported) {
      setError('이 브라우저는 녹음을 지원하지 않아요. 글로 답해 주세요.');
      return;
    }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError('마이크 권한이 필요해요. 글로 답해도 괜찮아요.');
      return;
    }
    chunks.current = [];
    const rec = new MediaRecorder(stream.current);
    recorder.current = rec;
    rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
    rec.onstop = () => {
      cleanup();
      setState('processing');
      resolveStop.current?.(new Blob(chunks.current, { type: rec.mimeType || 'audio/webm' }));
      resolveStop.current = null;
    };
    rec.start(250);
    setState('recording');
    setSeconds(0);
    timer.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    // 파형
    try {
      const ctx = new AudioContext();
      audioCtx.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      ctx.createMediaStreamSource(stream.current).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        setLevels([...data].map((v) => Math.max(0.08, v / 255)));
        raf.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // 파형이 없어도 녹음은 됩니다.
    }
  }, [cleanup, supported]);

  // 최대 시간이 되면 자동으로 멈춥니다.
  useEffect(() => {
    if (state === 'recording' && seconds >= maxSeconds) void stop();
  }, [seconds, maxSeconds, state, stop]);

  const finish = useCallback(() => setState('idle'), []);
  return { state, seconds, levels, error, supported, start, stop, finish };
}

// 녹음을 wav 로 바꿔 /api/stt 에 보냅니다. 서버가 없거나 키가 없으면 체험 대본 답변이 옵니다.
export async function recordingToText(blob: Blob, turn: number): Promise<{ text: string; demo: boolean }> {
  let wav: Blob;
  try {
    wav = await toWav16k(blob);
  } catch {
    wav = blob;
  }
  return transcribeAudio(wav, turn);
}

// 질문 읽어 주기. ChatKHU TTS 가 없으면 브라우저 음성 합성을 씁니다.
let current: HTMLAudioElement | null = null;
export async function speak(text: string, muted: boolean): Promise<void> {
  stopSpeaking();
  if (muted || !text) return;
  const clean = text.replace(/^Q\d+(-\d+)?\.\s*/, '');
  const audio = await fetchSpeech(clean);
  if (audio) {
    current = new Audio(URL.createObjectURL(audio));
    try {
      await current.play();
    } catch {
      // 자동 재생이 막히면 조용히 넘어갑니다.
    }
    return;
  }
  if ('speechSynthesis' in window) {
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = 'ko-KR';
    u.rate = 1;
    window.speechSynthesis.speak(u);
  }
}
export function stopSpeaking(): void {
  current?.pause();
  current = null;
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}
