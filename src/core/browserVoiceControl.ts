import type { VoiceControlPort, VoiceInputResult } from "./contracts";

interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultLike {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternativeLike;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike extends Event {
  results: {
    readonly length: number;
    item(index: number): SpeechRecognitionResultLike;
    [index: number]: SpeechRecognitionResultLike;
  };
}

interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export function createBrowserVoiceControl(): VoiceControlPort {
  let activeRecognition: SpeechRecognitionLike | null = null;

  return {
    isSupported() {
      return Boolean(resolveSpeechRecognitionConstructor());
    },

    startListening() {
      const SpeechRecognition = resolveSpeechRecognitionConstructor();

      if (!SpeechRecognition) {
        return Promise.resolve({
          status: "unsupported",
          transcript: "",
          message: "当前浏览器不支持语音识别，请使用点击控车演示。",
        });
      }

      return new Promise<VoiceInputResult>((resolve) => {
        const recognition = new SpeechRecognition();
        activeRecognition = recognition;
        recognition.lang = "zh-CN";
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event) => {
          const firstResult = event.results[0]?.[0];

          resolve({
            status: firstResult?.transcript ? "recognized" : "unrecognized",
            transcript: firstResult?.transcript?.trim() ?? "",
            confidence: firstResult?.confidence,
          });
        };

        recognition.onerror = () => {
          resolve({
            status: "error",
            transcript: "",
            message: "语音识别失败，请检查浏览器权限或改用点击控车。",
          });
        };

        recognition.onend = () => {
          activeRecognition = null;
        };

        recognition.start();
      });
    },

    stopListening() {
      activeRecognition?.stop();
      activeRecognition = null;
    },
  };
}

function resolveSpeechRecognitionConstructor(): SpeechRecognitionConstructor | undefined {
  return window.SpeechRecognition ?? window.webkitSpeechRecognition;
}
