import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, Rotate3D, Volume2 } from "lucide-react";
import { VehicleScene } from "./components/VehicleScene";
import type {
  HitTestResult,
  VehicleControlAction,
  VehicleControlCommand,
  VehicleState,
  WindowTarget,
} from "./core/contracts";
import { createBrowserVoiceControl } from "./core/browserVoiceControl";
import { createCommandParser } from "./core/commandParser";
import { createInitialVehicleState } from "./core/initialState";
import { createVehicleStateStore } from "./core/vehicleStore";

export function App() {
  const parser = useMemo(() => createCommandParser(), []);
  const voiceControl = useMemo(() => createBrowserVoiceControl(), []);
  const voiceSupported = useMemo(() => voiceControl.isSupported(), [voiceControl]);
  const storeRef = useRef(createVehicleStateStore(createInitialVehicleState()));
  const [vehicleState, setVehicleState] = useState<VehicleState>(
    storeRef.current.getState(),
  );
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    return storeRef.current.subscribe((nextState) => {
      setVehicleState(nextState);
    });
  }, []);

  const dispatchCommand = (command: VehicleControlCommand) => {
    storeRef.current.dispatch(command);
  };

  const handleClickCommand = (
    action: VehicleControlAction,
    target: WindowTarget = "all",
  ) => {
    dispatchCommand({
      action,
      target,
      source: "click",
      requestedAt: Date.now(),
    });
  };

  const handlePartClick = (hit: HitTestResult) => {
    const command = parser.parseClickInput(hit);

    if (command) {
      dispatchCommand(command);
    }
  };

  const handleVoiceCommand = async () => {
    if (!voiceSupported) {
      storeRef.current.recordVoiceInput({
        status: "unsupported",
        transcript: "",
        message: "当前浏览器不支持语音识别，请使用点击控车。",
      });
      return;
    }

    setIsListening(true);
    const voiceInput = await voiceControl.startListening();
    storeRef.current.recordVoiceInput(voiceInput);
    setIsListening(false);

    const command = parser.parseVoiceInput(voiceInput);

    if (command) {
      dispatchCommand(command);
      return;
    }

    storeRef.current.recordVoiceInput({
      ...voiceInput,
      status: voiceInput.status === "recognized" ? "unrecognized" : voiceInput.status,
      message: voiceInput.message ?? "没有匹配到可执行的车窗指令。",
    });
  };

  const openWindowCount = Object.values(vehicleState.windows).filter(
    (windowState) => windowState.isOpen,
  ).length;

  return (
    <main className="app-shell">
      <section className="hero-bar">
        <div>
          <p className="eyebrow">Vibe Coding Interview Demo</p>
          <h1>3D 仿真车模 Demo</h1>
        </div>
        <div className="system-status" aria-label="系统状态">
          <span>{openWindowCount}/4 车窗打开</span>
        </div>
      </section>

      <section className="workspace">
        <VehicleScene state={vehicleState} onPartClick={handlePartClick} />

        <aside className="control-panel" aria-label="车辆控制面板">
          <div className="panel-section">
            <div className="section-title">
              <Rotate3D size={18} />
              <h2>交互状态</h2>
            </div>
            <dl className="state-list">
              {Object.values(vehicleState.windows).map((windowState) => (
                <div key={windowState.id}>
                  <dt>{windowState.label}</dt>
                  <dd>{windowState.isOpen ? "已打开" : "已关闭"}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="panel-section">
            <div className="section-title">
              <Volume2 size={18} />
              <h2>车窗控制</h2>
            </div>
            <div className="button-grid">
              <button type="button" onClick={() => handleClickCommand("open")}>
                打开全部
              </button>
              <button type="button" onClick={() => handleClickCommand("close")}>
                关闭全部
              </button>
              <button type="button" onClick={() => handleClickCommand("toggle", "frontLeft")}>
                切换左前
              </button>
              <button type="button" onClick={() => handleClickCommand("toggle", "frontRight")}>
                切换右前
              </button>
              <button type="button" onClick={() => handleClickCommand("toggle", "rearLeft")}>
                切换左后
              </button>
              <button type="button" onClick={() => handleClickCommand("toggle", "rearRight")}>
                切换右后
              </button>
            </div>
          </div>

          <div className="panel-section">
            <div className="section-title">
              <Mic size={18} />
              <h2>语音控车</h2>
            </div>
            <button
              className="voice-button"
              type="button"
              disabled={isListening || !voiceSupported}
              onClick={handleVoiceCommand}
            >
              {isListening ? "正在聆听" : voiceSupported ? "语音控车" : "语音不可用"}
            </button>
            <p className="feedback-line">
              {vehicleState.lastVoiceInput?.transcript ||
                vehicleState.lastVoiceInput?.message ||
                "等待语音输入"}
            </p>
          </div>

          <div className="panel-section">
            <h2>执行反馈</h2>
            <p className="result-message">
              {vehicleState.lastResult?.message || vehicleState.lastVoiceInput?.message || "等待操作"}
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
