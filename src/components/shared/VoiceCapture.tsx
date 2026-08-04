"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Mic, Square } from "lucide-react";
import { Button } from "@/ui/Button";

type SpeechResultEvent = {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function speechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const browserWindow = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition ?? null;
}

function joinTranscript(existing: string, addition: string) {
  return [existing.trim(), addition.trim()].filter(Boolean).join(existing.trim() ? " " : "");
}

export function VoiceCaptureButton({ onTranscript, label = "Speak", className = "" }: {
  onTranscript: (text: string) => void;
  label?: string;
  className?: string;
}) {
  const [recording, setRecording] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const transcriptRef = useRef("");

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  function finish() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setRecording(false);
    if (transcriptRef.current.trim()) onTranscript(transcriptRef.current.trim());
    transcriptRef.current = "";
  }

  function toggle() {
    if (recording) return finish();
    const Recognition = speechRecognitionConstructor();
    if (!Recognition) return setSupported(false);
    transcriptRef.current = "";
    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || "en-US";
    recognition.onresult = (event) => {
      let finalText = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        if (event.results[index].isFinal) finalText += event.results[index][0].transcript;
      }
      if (finalText) transcriptRef.current = joinTranscript(transcriptRef.current, finalText);
    };
    recognition.onerror = finish;
    recognition.onend = () => {
      if (recognitionRef.current === recognition) finish();
    };
    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
  }

  if (!supported) return <span className="text-[11.5px] text-ink-3">Voice input needs Chrome, Edge, or Safari microphone support.</span>;
  return (
    <button type="button" onClick={toggle} aria-label={recording ? "Stop voice input" : label} className={`flex h-9 items-center gap-1.5 rounded-[9px] border px-3 text-[12.5px] font-semibold ${recording ? "border-critical bg-critical-wash text-critical" : "border-line-strong text-ink-2 hover:bg-surface-raised"} ${className}`}>
      {recording ? <Square size={13} fill="currentColor" /> : <Mic size={14} />}
      {recording ? "Stop" : label}
    </button>
  );
}

export function MeetingRecorder({ onSave }: { onSave: (transcript: string) => Promise<void> | void }) {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [error, setError] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const activeRef = useRef(false);

  useEffect(() => () => {
    recognitionRef.current?.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  async function start() {
    const Recognition = speechRecognitionConstructor();
    if (!Recognition || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Meeting recording needs microphone access in Chrome, Edge, or Safari.");
      return;
    }
    setError("");
    setTranscript("");
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };
      recorderRef.current = recorder;

      const recognition = new Recognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = navigator.language || "en-US";
      recognition.onresult = (event) => {
        let finalText = "";
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          if (event.results[index].isFinal) finalText += event.results[index][0].transcript;
        }
        if (finalText) setTranscript((current) => joinTranscript(current, finalText));
      };
      recognition.onend = () => {
        if (activeRef.current) {
          try { recognition.start(); } catch { /* The browser may still be finalizing the previous recognition session. */ }
        }
      };
      recognitionRef.current = recognition;
      recorder.start(1000);
      activeRef.current = true;
      recognition.start();
      setRecording(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Microphone permission was not granted.");
    }
  }

  function stop() {
    activeRef.current = false;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    if (recorderRef.current?.state !== "inactive") recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-[13.5px] font-semibold text-ink-1">Record and transcribe</p><p className="mt-0.5 text-[11.5px] text-ink-3">Only starts after you approve microphone access. Tell everyone before recording.</p></div>
        <Button variant={recording ? "secondary" : "primary"} onClick={recording ? stop : start}>{recording ? <Square size={13} fill="currentColor" /> : <Mic size={14} />}{recording ? "Stop recording" : "Start recording"}</Button>
      </div>
      {error ? <p className="mt-3 text-[12.5px] text-critical">{error}</p> : null}
      {recording ? <p className="mt-3 animate-pulse text-[12.5px] font-medium text-critical">Recording and transcribing…</p> : null}
      {transcript ? <textarea value={transcript} onChange={(event) => setTranscript(event.target.value)} rows={7} className="mt-3 w-full rounded-[9px] border border-line-strong bg-bg px-3 py-2 text-[13px] leading-relaxed text-ink-1 outline-none focus:border-accent" aria-label="Meeting transcript" /> : null}
      {!recording && transcript ? <div className="mt-3 flex flex-wrap gap-2"><Button variant="primary" onClick={() => onSave(transcript)}>Save transcript as note</Button>{audioUrl ? <a href={audioUrl} download={`meeting-recording-${new Date().toISOString().slice(0, 10)}.webm`} className="inline-flex h-9 items-center gap-1.5 rounded-[9px] border border-line-strong px-3 text-[12.5px] font-semibold text-ink-2 hover:bg-surface-raised"><Download size={14} /> Download recording</a> : null}</div> : null}
    </div>
  );
}
