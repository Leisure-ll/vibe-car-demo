export type WindowId =
  | "frontLeft"
  | "frontRight"
  | "rearLeft"
  | "rearRight";

export type WindowTarget = WindowId | "all";

export type VehiclePart =
  | "body"
  | "window"
  | "wheel"
  | "light"
  | "door"
  | "trunk"
  | "sunroof";

export type VehicleControlAction = "open" | "close" | "toggle";

export type ControlSource = "click" | "voice" | "system";

export type CommandStatus = "idle" | "pending" | "success" | "failed";

export type VoiceRecognitionStatus =
  | "unsupported"
  | "idle"
  | "listening"
  | "recognized"
  | "unrecognized"
  | "error";

export interface VehicleWindowState {
  id: WindowId;
  label: string;
  isOpen: boolean;
}

export interface VehicleState {
  windows: Record<WindowId, VehicleWindowState>;
  selectedPart: VehiclePart | null;
  lastCommand: VehicleControlCommand | null;
  lastResult: ControlResult | null;
  lastVoiceInput: VoiceInputResult | null;
}

export interface VehicleControlCommand {
  action: VehicleControlAction;
  target: WindowTarget;
  source: ControlSource;
  rawText?: string;
  requestedAt: number;
}

export interface ControlResult {
  status: CommandStatus;
  command: VehicleControlCommand | null;
  message: string;
  completedAt?: number;
  errorCode?: string;
}

export interface VoiceInputResult {
  status: VoiceRecognitionStatus;
  transcript: string;
  confidence?: number;
  message?: string;
}

export interface HitTestResult {
  part: VehiclePart;
  windowId?: WindowId;
  objectName?: string;
}

export interface VehicleModelAsset {
  id: string;
  name: string;
  sourceUrl: string;
  format: "glb" | "gltf";
  previewImageUrl?: string;
}

export interface SceneViewState {
  cameraMode: "default" | "front" | "side" | "rear";
  isDragging: boolean;
  selectedPart: VehiclePart | null;
}

export interface CommandParser {
  parseVoiceInput(input: VoiceInputResult): VehicleControlCommand | null;
  parseClickInput(input: HitTestResult): VehicleControlCommand | null;
}

export interface VehicleStateStore {
  getState(): VehicleState;
  dispatch(command: VehicleControlCommand): ControlResult;
  recordVoiceInput(input: VoiceInputResult): void;
  subscribe(listener: VehicleStateListener): Unsubscribe;
}

export interface VehicleStateListener {
  (state: VehicleState, result: ControlResult | null): void;
}

export interface Unsubscribe {
  (): void;
}

export interface VehicleRendererPort {
  loadModel(asset: VehicleModelAsset): Promise<void>;
  applyVehicleState(state: VehicleState): void;
  focusPart(part: VehiclePart | null): void;
  getSceneViewState(): SceneViewState;
}

export interface VehicleInteractionPort {
  onPartClick(listener: VehiclePartClickListener): Unsubscribe;
  onDragStart(listener: SceneDragListener): Unsubscribe;
  onDragEnd(listener: SceneDragListener): Unsubscribe;
}

export interface VehiclePartClickListener {
  (hit: HitTestResult): void;
}

export interface SceneDragListener {
  (viewState: SceneViewState): void;
}

export interface VoiceControlPort {
  isSupported(): boolean;
  startListening(): Promise<VoiceInputResult>;
  stopListening(): void;
}

export interface VehicleControlPanelPort {
  renderState(state: VehicleState): void;
  renderResult(result: ControlResult): void;
  renderVoiceInput(input: VoiceInputResult): void;
}

export interface DemoAppPorts {
  renderer: VehicleRendererPort;
  interaction: VehicleInteractionPort;
  voiceControl: VoiceControlPort;
  controlPanel: VehicleControlPanelPort;
  parser: CommandParser;
  store: VehicleStateStore;
}
