import type {
  CommandParser,
  HitTestResult,
  VehicleControlCommand,
  VoiceInputResult,
  WindowTarget,
} from "./contracts";

export function createCommandParser(): CommandParser {
  return {
    parseVoiceInput(input: VoiceInputResult) {
      if (input.status !== "recognized") {
        return null;
      }

      const target = parseWindowTarget(input.transcript);
      const action = input.transcript.includes("关") ? "close" : "open";

      if (!input.transcript.includes("车窗")) {
        return null;
      }

      if (!input.transcript.includes("开") && !input.transcript.includes("关")) {
        return null;
      }

      return {
        action,
        target,
        source: "voice",
        rawText: input.transcript,
        requestedAt: Date.now(),
      };
    },

    parseClickInput(input: HitTestResult) {
      if (input.part !== "window" || !input.windowId) {
        return null;
      }

      return {
        action: "toggle",
        target: input.windowId,
        source: "click",
        requestedAt: Date.now(),
      };
    },
  };
}

function parseWindowTarget(text: string): WindowTarget {
  if (text.includes("全部") || text.includes("所有") || text.includes("全车")) {
    return "all";
  }

  if (text.includes("左前")) {
    return "frontLeft";
  }

  if (text.includes("右前")) {
    return "frontRight";
  }

  if (text.includes("左后")) {
    return "rearLeft";
  }

  if (text.includes("右后")) {
    return "rearRight";
  }

  return "all";
}
