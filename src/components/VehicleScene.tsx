import { ContactShadows, OrbitControls, RoundedBox } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { Mesh, MeshPhysicalMaterial } from "three";
import * as THREE from "three";
import type { HitTestResult, VehicleState, WindowId } from "../core/contracts";

interface VehicleSceneProps {
  state: VehicleState;
  onPartClick: (hit: HitTestResult) => void;
}

export function VehicleScene({ state, onPartClick }: VehicleSceneProps) {
  const openWindows = useMemo(
    () => Object.values(state.windows).filter((item) => item.isOpen).length,
    [state.windows],
  );

  return (
    <section className="vehicle-stage" aria-label="3D 车模交互区域">
      <Canvas
        shadows
        camera={{ position: [0, 1.9, 7.6], fov: 38, near: 0.1, far: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
      >
        <color attach="background" args={["#10151b"]} />
        <fog attach="fog" args={["#10151b", 12, 26]} />
        <ambientLight intensity={1.25} />
        <directionalLight
          position={[6, 10, 8]}
          intensity={2.6}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight position={[-4, 3, -2]} intensity={0.8} />
        <CameraSetup />
        <group position={[0, -0.35, 0]}>
          <VehicleModel state={state} onPartClick={onPartClick} />
          <ContactShadows
            opacity={0.58}
            scale={12}
            blur={2.2}
            far={4}
            resolution={1024}
            position={[0, -1.68, 0]}
          />
        </group>
        <OrbitControls
          makeDefault
          enablePan={false}
          minDistance={5.6}
          maxDistance={10.5}
          minPolarAngle={0.72}
          maxPolarAngle={1.38}
          rotateSpeed={0.55}
          enableDamping
          dampingFactor={0.08}
          target={[0, 0.45, 0]}
        />
      </Canvas>
      <div className="vehicle-stage-badge" aria-hidden="true">
        <span>{openWindows}/4 窗口开启</span>
      </div>
    </section>
  );
}

function CameraSetup() {
  const { camera } = useThree();

  useEffect(() => {
    camera.lookAt(0, 0.2, 0);
  }, [camera]);

  return null;
}

interface VehicleModelProps {
  state: VehicleState;
  onPartClick: (hit: HitTestResult) => void;
}

function VehicleModel({ state, onPartClick }: VehicleModelProps) {
  const activeWindowId = useMemo(() => {
    const target = state.lastCommand?.target;

    if (!target || target === "all") {
      return null;
    }

    return target;
  }, [state.lastCommand]);

  return (
    <group rotation={[0, 0.18, 0]}>
      <CarBody />
      <WindowGlass
        id="frontLeft"
        state={state.windows.frontLeft}
        position={[-0.58, 0.5, 0.77]}
        size={[0.64, 0.38, 0.06]}
        isActive={activeWindowId === "frontLeft"}
        onPartClick={onPartClick}
      />
      <WindowGlass
        id="frontRight"
        state={state.windows.frontRight}
        position={[-0.58, 0.5, -0.77]}
        size={[0.64, 0.38, 0.06]}
        isActive={activeWindowId === "frontRight"}
        onPartClick={onPartClick}
      />
      <WindowGlass
        id="rearLeft"
        state={state.windows.rearLeft}
        position={[0.22, 0.48, 0.77]}
        size={[0.58, 0.36, 0.06]}
        isActive={activeWindowId === "rearLeft"}
        onPartClick={onPartClick}
      />
      <WindowGlass
        id="rearRight"
        state={state.windows.rearRight}
        position={[0.22, 0.48, -0.77]}
        size={[0.58, 0.36, 0.06]}
        isActive={activeWindowId === "rearRight"}
        onPartClick={onPartClick}
      />
    </group>
  );
}

function CarBody() {
  return (
    <group>
      <RoundedBox
        castShadow
        receiveShadow
        args={[4.28, 0.78, 1.82]}
        radius={0.18}
        smoothness={6}
        position={[0, -0.18, 0]}
      >
        <meshPhysicalMaterial
          color="#d3d9df"
          metalness={0.78}
          roughness={0.2}
          clearcoat={0.8}
          clearcoatRoughness={0.18}
        />
      </RoundedBox>

      <RoundedBox
        castShadow
        receiveShadow
        args={[2.18, 0.72, 1.44]}
        radius={0.16}
        smoothness={5}
        position={[-0.05, 0.42, 0]}
      >
        <meshPhysicalMaterial
          color="#aeb8c2"
          metalness={0.7}
          roughness={0.26}
          clearcoat={0.62}
          clearcoatRoughness={0.22}
        />
      </RoundedBox>

      <GlassPanel position={[-1.2, 0.55, 0]} size={[0.08, 0.46, 1.12]} />
      <GlassPanel position={[1.04, 0.52, 0]} size={[0.08, 0.4, 1.0]} />
      <GlassPanel position={[-0.04, 0.8, 0]} size={[1.08, 0.05, 1.0]} />

      <Wheel position={[-1.42, -0.48, 0.9]} />
      <Wheel position={[-1.42, -0.48, -0.9]} />
      <Wheel position={[1.4, -0.48, 0.9]} />
      <Wheel position={[1.4, -0.48, -0.9]} />

      <mesh castShadow receiveShadow position={[-1.7, -0.06, 0]}>
        <boxGeometry args={[0.18, 0.28, 1.42]} />
        <meshStandardMaterial color="#e4e8ec" metalness={0.44} roughness={0.22} />
      </mesh>
      <mesh castShadow receiveShadow position={[1.7, -0.06, 0]}>
        <boxGeometry args={[0.18, 0.28, 1.42]} />
        <meshStandardMaterial color="#e4e8ec" metalness={0.44} roughness={0.22} />
      </mesh>

      <mesh position={[0, 0.62, 0.72]}>
        <boxGeometry args={[0.76, 0.07, 0.1]} />
        <meshStandardMaterial color="#d5f3ff" emissive="#8be9ff" emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[0, 0.62, -0.72]}>
        <boxGeometry args={[0.76, 0.07, 0.1]} />
        <meshStandardMaterial color="#d5f3ff" emissive="#8be9ff" emissiveIntensity={1.1} />
      </mesh>

      <mesh position={[-2.12, -0.08, 0.45]}>
        <boxGeometry args={[0.08, 0.12, 0.46]} />
        <meshStandardMaterial color="#e8ffff" emissive="#b9ffff" emissiveIntensity={1.6} />
      </mesh>
      <mesh position={[2.13, -0.08, 0.45]}>
        <boxGeometry args={[0.08, 0.11, 0.38]} />
        <meshStandardMaterial color="#ff5263" emissive="#ff344a" emissiveIntensity={1.1} />
      </mesh>
    </group>
  );
}

interface WheelProps {
  position: [number, number, number];
}

function Wheel({ position }: WheelProps) {
  return (
    <group position={position} rotation={[Math.PI / 2, 0, 0]}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.42, 0.42, 0.28, 36]} />
        <meshStandardMaterial color="#101214" roughness={0.86} />
      </mesh>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.24, 0.24, 0.04, 32]} />
        <meshStandardMaterial color="#aeb7c1" metalness={0.6} roughness={0.28} />
      </mesh>
    </group>
  );
}

interface GlassPanelProps {
  position: [number, number, number];
  size: [number, number, number];
}

function GlassPanel({ position, size }: GlassPanelProps) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshPhysicalMaterial
        color="#9ddfff"
        transparent
        opacity={0.48}
        roughness={0.08}
        metalness={0.08}
        transmission={0.42}
      />
    </mesh>
  );
}

interface WindowGlassProps {
  id: WindowId;
  state: { isOpen: boolean; label: string };
  position: [number, number, number];
  size: [number, number, number];
  isActive: boolean;
  onPartClick: (hit: HitTestResult) => void;
}

function WindowGlass({
  id,
  state,
  position,
  size,
  isActive,
  onPartClick,
}: WindowGlassProps) {
  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<MeshPhysicalMaterial>(null);
  const openOffset = state.isOpen ? -0.28 : 0;
  const openOpacity = state.isOpen ? 0.25 : 0.7;

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.position.x = THREE.MathUtils.damp(
        meshRef.current.position.x,
        position[0],
        8,
        delta,
      );
      meshRef.current.position.y = THREE.MathUtils.damp(
        meshRef.current.position.y,
        position[1] + openOffset,
        8,
        delta,
      );
      }

      if (materialRef.current) {
        materialRef.current.opacity = THREE.MathUtils.damp(
          materialRef.current.opacity,
        openOpacity,
        8,
        delta,
        );
        materialRef.current.emissiveIntensity = THREE.MathUtils.damp(
          materialRef.current.emissiveIntensity,
          isActive ? 0.4 : 0,
          8,
          delta,
        );
      }
    });

  return (
    <mesh
      ref={meshRef}
      position={position}
      castShadow
      receiveShadow
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        onPartClick({ part: "window", windowId: id, objectName: state.label });
      }}
    >
      <boxGeometry args={size} />
      <meshPhysicalMaterial
        ref={materialRef}
        color="#aee8ff"
        transparent
        opacity={openOpacity}
        transmission={0.56}
        roughness={0.12}
        thickness={0.5}
        metalness={0.08}
        emissive={isActive ? "#8fe4ff" : "#000000"}
        emissiveIntensity={0}
      />
    </mesh>
  );
}
