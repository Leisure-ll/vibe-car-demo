import type {
  ControlResult,
  VehicleControlCommand,
  VehicleState,
  VehicleStateListener,
  VehicleStateStore,
  WindowId,
} from "./contracts";

export function createVehicleStateStore(initialState: VehicleState): VehicleStateStore {
  let state = initialState;
  const listeners = new Set<VehicleStateListener>();

  const notify = (): void => {
    listeners.forEach((listener) => listener(state, state.lastResult));
  };

  return {
    getState() {
      return state;
    },

    dispatch(command: VehicleControlCommand) {
      const affectedWindows = resolveAffectedWindows(command.target);
      const nextWindows = { ...state.windows };

      affectedWindows.forEach((windowId) => {
        const currentWindow = state.windows[windowId];
        nextWindows[windowId] = {
          ...currentWindow,
          isOpen: resolveNextWindowOpenState(currentWindow.isOpen, command.action),
        };
      });

      const result: ControlResult = {
        status: "success",
        command,
        message: createResultMessage(command, nextWindows),
        completedAt: Date.now(),
      };

      state = {
        ...state,
        windows: nextWindows,
        selectedPart: "window",
        lastCommand: command,
        lastResult: result,
      };

      notify();
      return result;
    },

    recordVoiceInput(input) {
      state = {
        ...state,
        lastVoiceInput: input,
      };

      notify();
    },

    subscribe(listener) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };
}

function resolveAffectedWindows(target: VehicleControlCommand["target"]): WindowId[] {
  if (target === "all") {
    return ["frontLeft", "frontRight", "rearLeft", "rearRight"];
  }

  return [target];
}

function resolveNextWindowOpenState(
  currentIsOpen: boolean,
  action: VehicleControlCommand["action"],
): boolean {
  if (action === "open") {
    return true;
  }

  if (action === "close") {
    return false;
  }

  return !currentIsOpen;
}

function createResultMessage(
  command: VehicleControlCommand,
  windows: VehicleState["windows"],
): string {
  const targetText = command.target === "all" ? "全部车窗" : windows[command.target].label;
  const sourceText = command.source === "voice" ? "语音" : "点击";
  const stateText =
    command.target === "all"
      ? createAllWindowsStateText(windows)
      : windows[command.target].isOpen
        ? "已打开"
        : "已关闭";

  return `${sourceText}控车成功：${targetText}${stateText}`;
}

function createAllWindowsStateText(windows: VehicleState["windows"]): string {
  const openCount = Object.values(windows).filter((windowState) => windowState.isOpen).length;

  if (openCount === 4) {
    return "已全部打开";
  }

  if (openCount === 0) {
    return "已全部关闭";
  }

  return `当前 ${openCount}/4 打开`;
}
