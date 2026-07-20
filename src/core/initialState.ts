import type { VehicleState } from "./contracts";

export function createInitialVehicleState(): VehicleState {
  return {
    windows: {
      frontLeft: {
        id: "frontLeft",
        label: "左前车窗",
        isOpen: false,
      },
      frontRight: {
        id: "frontRight",
        label: "右前车窗",
        isOpen: false,
      },
      rearLeft: {
        id: "rearLeft",
        label: "左后车窗",
        isOpen: false,
      },
      rearRight: {
        id: "rearRight",
        label: "右后车窗",
        isOpen: false,
      },
    },
    selectedPart: null,
    lastCommand: null,
    lastResult: null,
    lastVoiceInput: null,
  };
}
