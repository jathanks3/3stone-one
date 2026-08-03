// A tiny decoupling point so any page (the Dashboard's daily debrief card,
// eventually others) can open the floating AiAssistant with a pre-filled
// question, without importing/knowing about its internal open/closed
// state. AiAssistant.tsx is the only listener.
const EVENT_NAME = "3stone:ask-assistant";

export interface AskAssistantDetail {
  prompt: string;
}

export function askAssistant(prompt: string): void {
  window.dispatchEvent(new CustomEvent<AskAssistantDetail>(EVENT_NAME, { detail: { prompt } }));
}

export function onAskAssistant(handler: (detail: AskAssistantDetail) => void): () => void {
  function listener(e: Event) {
    handler((e as CustomEvent<AskAssistantDetail>).detail);
  }
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}
