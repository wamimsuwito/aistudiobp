/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, 
  Square, 
  AlertOctagon, 
  Settings, 
  Database, 
  Droplets, 
  Weight, 
  Zap, 
  Activity, 
  History, 
  CheckCircle2, 
  AlertCircle,
  Menu,
  ChevronRight,
  RefreshCcw,
  BarChart3,
  Power,
  Bell,
  User,
  Package,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LoginModal } from "./components/admin/LoginModal";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { MixingSequence } from "./components/admin/MixingSequenceConfig";
import { BatchConfigModal } from "./components/BatchConfigModal";
import { webSerialService } from "./lib/webSerial";

// --- Types ---

type MaterialType = 'pasir' | 'batu' | 'semen' | 'air';

interface ScaleData {
  id: MaterialType;
  label: string;
  actual: number;
  target: number;
  unit: string;
  isActive: boolean;
  isComplete: boolean;
}

interface BatchLog {
  id: string;
  timestamp: Date;
  recipeName: string;
  data: {
    pasir: number;
    batu: number;
    semen: number;
    air: number;
  };
  status: 'sukses' | 'gagal';
  volume?: number;
  mixingCycles?: number;
  slump?: string;
  siloSemen?: string;
  mixingTime?: number;
  pelanggan?: string;
  lokasi?: string;
  noKendaraan?: string;
  sopir?: string;
}

interface Recipe {
  id: string;
  name: string;
  targets: Record<MaterialType, number>;
}

// --- Constants ---

const INITIAL_SCALES: Record<MaterialType, ScaleData> = {
  pasir: { id: 'pasir', label: 'Pasir', actual: 0, target: 400, unit: 'kg', isActive: false, isComplete: false },
  batu: { id: 'batu', label: 'Batu', actual: 0, target: 400, unit: 'kg', isActive: false, isComplete: false },
  semen: { id: 'semen', label: 'Semen', actual: 0, target: 300, unit: 'kg', isActive: false, isComplete: false },
  air: { id: 'air', label: 'Air', actual: 0, target: 150, unit: 'kg', isActive: false, isComplete: false },
};

const RECIPES: Recipe[] = [
  { id: 'k225', name: 'Beton K-225', targets: { pasir: 400, batu: 400, semen: 300, air: 150 } },
  { id: 'k250', name: 'Beton K-250', targets: { pasir: 425, batu: 425, semen: 350, air: 160 } },
  { id: 'k300', name: 'Beton K-300', targets: { pasir: 450, batu: 450, semen: 400, air: 180 } },
];

// --- Components ---

const TargetAndScaleBlock = ({ 
  label, 
  actual, 
  target, 
  unit = "kg", 
  isActive, 
  isComplete 
}: { 
  label: string; 
  actual: number; 
  target: number; 
  unit?: string; 
  isActive: boolean; 
  isComplete: boolean; 
}) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      {/* Top Box: TARGET (Indigo Blue) */}
      <div className="bg-[#132247] border border-[#1b3469] rounded-[4px] px-3 py-1.5 flex flex-col justify-center min-h-[55px] shadow-sm select-none">
        <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-[#7dd3fc]">TARGET</span>
        <div className="font-mono text-xl font-bold tracking-tight text-white flex items-baseline justify-between">
          <span>{target} <span className="text-[10px] font-sans font-semibold text-[#38bdf8] uppercase">{unit}</span></span>
          <div className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]/55" />
        </div>
      </div>

      {/* Bottom Box: Material Weights (Fluorescent Electric Green on Dark Slate) */}
      <div className="bg-[#101622] border border-[#1e293b] rounded-[4px] px-3 py-2 flex flex-col justify-center min-h-[65px] relative overflow-hidden shadow-inner select-none group">
        <span className="text-[9px] font-sans font-black uppercase tracking-wider text-[#94a3b8]">{label}</span>
        <div className="font-mono text-2xl font-black tracking-tighter text-[#00ff9c] flex items-baseline justify-between leading-none mt-1">
          <span className={isActive ? 'text-[#00ffd0]' : isComplete ? 'text-[#00ff9c]' : 'text-[#02c383]'}>
            {actual.toFixed(0)} <span className="text-[10px] font-sans font-bold text-[#64748b] uppercase">{unit}</span>
          </span>
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-[#00ffd0] shadow-[0_0_8px_#00ffd0]' : isComplete ? 'bg-[#00ff9c]' : 'bg-[#1e293b]'}`} />
        </div>
        
        {/* Fill level line underneath */}
        <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#1e293b]">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (actual / (target || 1)) * 100)}%` }}
            className={`h-full ${isComplete ? 'bg-[#00ff9c]' : isActive ? 'bg-[#00ffd0]' : 'bg-slate-600'}`}
            transition={{ duration: 0.1 }}
          />
        </div>
      </div>
    </div>
  );
};

const FarikaLogo = () => {
  return (
    <div className="w-14 h-14 bg-white rounded-full border border-slate-700 flex items-center justify-center p-0.5 shadow-md relative shrink-0">
      <div className="w-full h-full rounded-full border-2 border-blue-600 flex flex-col items-center justify-center relative overflow-hidden bg-white">
        {/* Outer Circular Text Arc */}
        <div className="text-[5.5px] font-black text-blue-900 tracking-tighter absolute top-1 uppercase scale-90 leading-none">
          PT. FARIKA
        </div>
        {/* Red Center Wing Emblem */}
        <div className="w-7 h-5 flex items-center justify-center relative overflow-hidden my-0.5">
          {/* Custom vector representation of wing/emblem inside */}
          <div className="absolute w-6 h-1 bg-red-600 rotate-12 rounded-full" />
          <div className="absolute w-6 h-1 bg-red-500 -rotate-12 rounded-full" />
          <span className="text-[6px] font-black text-blue-950 z-10 leading-none tracking-tighter bg-white/70 px-0.5 rounded">FARIKA</span>
        </div>
        {/* Outer Circular Text Bottom Arc */}
        <div className="text-[4px] font-black text-blue-900 tracking-tighter absolute bottom-0.5 uppercase scale-95 leading-none">
          RIAU PERKASA
        </div>
      </div>
    </div>
  );
};

const getIndonesianDate = (date: Date) => {
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const dayName = days[date.getDay()];
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${dayName}, ${day}/${month}/${year}`;
};

const ControlButton = ({ 
  onClick, 
  icon: Icon, 
  label, 
  activeColor, 
  disabled = false,
  variant = 'primary'
}: { 
  onClick: () => void; 
  icon: any; 
  label: string; 
  activeColor: string; 
  disabled?: boolean;
  variant?: 'primary' | 'danger' | 'warning';
}) => {
  const baseClasses = "flex flex-col items-center justify-center gap-1.5 px-3 py-3 rounded-[4px] font-bold uppercase tracking-tight transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed border-none shadow-md active:scale-95";
  
  const variants = {
    primary: "bg-[#444] text-white hover:bg-[#555]",
    danger: "bg-accent-red text-white hover:opacity-90",
    warning: "bg-accent-yellow text-black hover:opacity-90",
    start: "bg-accent-green text-black hover:opacity-90"
  };

  const currentVariant = variant === 'primary' && activeColor.includes('green') ? 'start' : variant;

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseClasses} ${variants[currentVariant as keyof typeof variants]}`}
    >
      <Icon size={18} />
      <span className="text-[10px] text-center leading-tight">{label}</span>
    </button>
  );
};

const ScadaDiagram = ({ 
  isRunning, 
  currentStep, 
  isDone, 
  truckImage, 
  onTruckClick,
  scales,
  startBatch,
  stopBatch,
  isAuto,
  setIsAuto,
  moistureControl,
  setMoistureControl,
  quarryAggregate,
  setQuarryAggregate,
  isPrint,
  setIsPrint,
  onHelpClick,
  productionState = 'IDLE',
  currentCycle = 1,
  totalCycles = 1,
  gatePasirSiloOpen = false,
  gatePasir1SiloOpen = false,
  gatePasir2SiloOpen = false,
  gateBatuSiloOpen = false,
  gateBatu1SiloOpen = false,
  gateBatu2SiloOpen = false,
  screwSemenActive = false,
  valveWaterActive = false,
  gatePasirHopperOpen = false,
  gateBatuHopperOpen = false,
  gateSemenHopperOpen = false,
  gateWaterHopperOpen = false,
  conveyorBottomActive = false,
  conveyorUpperActive = false,
  mixerShaftActive = false,
  mixerDoorPercent = 0,
  mixerDoorStateText = "CLOSED",
  concreteDischargeActive = false,
  mixingCountdown = 0,
  dischargeTimeSec = 0,
  activeMixingTime = 10,
  ampere = null,
  relayLogs = [],
  isPaused = false,
  activeSiloSemen = "Silo 3 - 28.290 kg"
}: { 
  isRunning: boolean; 
  currentStep: string; 
  isDone: boolean; 
  truckImage: string | null; 
  onTruckClick: () => void; 
  scales: Record<MaterialType, ScaleData>;
  startBatch: () => void;
  stopBatch: () => void;
  isAuto: boolean;
  setIsAuto: (v: boolean) => void;
  moistureControl: boolean;
  setMoistureControl: (v: boolean) => void;
  quarryAggregate: boolean;
  setQuarryAggregate: (v: boolean) => void;
  isPrint: boolean;
  setIsPrint: (v: boolean) => void;
  onHelpClick: () => void;
  productionState?: string;
  currentCycle?: number;
  totalCycles?: number;
  gatePasirSiloOpen?: boolean;
  gatePasir1SiloOpen?: boolean;
  gatePasir2SiloOpen?: boolean;
  gateBatuSiloOpen?: boolean;
  gateBatu1SiloOpen?: boolean;
  gateBatu2SiloOpen?: boolean;
  screwSemenActive?: boolean;
  valveWaterActive?: boolean;
  gatePasirHopperOpen?: boolean;
  gateBatuHopperOpen?: boolean;
  gateSemenHopperOpen?: boolean;
  gateWaterHopperOpen?: boolean;
  conveyorBottomActive?: boolean;
  conveyorUpperActive?: boolean;
  mixerShaftActive?: boolean;
  mixerDoorPercent?: number;
  mixerDoorStateText?: string;
  concreteDischargeActive?: boolean;
  mixingCountdown?: number;
  dischargeTimeSec?: number;
  activeMixingTime?: number;
  ampere?: number | null;
  relayLogs?: { id: string; timestamp: Date; message: string; type: 'on' | 'off' | 'info' | 'done' }[];
  isPaused?: boolean;
  activeSiloSemen?: string;
}) => {
  const theme = {
    outline: "#00e5ff",
    flow: "#00ff9c",
    pipe: "#3d3d3d",
    mixer: "#f39c12",
    text: "#e0e0e0",
    red: "#ff1744",
    accentBlue: "#2979ff",
    accentGreen: "#00e676"
  };

  const isPasirActive = isRunning && !isPaused ? (gatePasirSiloOpen || currentStep === 'pasir') : false;
  const isBatuActive = isRunning && !isPaused ? (gateBatuSiloOpen || currentStep === 'batu') : false;
  const isSemen = isRunning && !isPaused ? (screwSemenActive || currentStep === 'semen') : false;
  const isAir = isRunning && !isPaused ? (valveWaterActive || currentStep === 'air') : false;
  const isAggregat = isRunning && !isPaused ? (conveyorBottomActive || conveyorUpperActive || isPasirActive || isBatuActive) : false;

  // Extract cement silo number
  const siloMatch = activeSiloSemen ? activeSiloSemen.match(/Silo\s*(\d+)/i) : null;
  const selectedSiloNumber = siloMatch ? parseInt(siloMatch[1], 10) : 3;

  // Dynamic state selectors for flow pathways
  const isWaterOpen = isAir;
  const isAdditiveOpen = isAir;
  const isMixerRotating = mixerShaftActive && !isPaused;

  // Real-time sand and stone particle tracking state for physical conveyor belt constraint simulation
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    if (!isRunning) {
      if (particles.length > 0) setParticles([]);
      return;
    }

    let animationFrameId: number;
    let lastTime = performance.now();
    let particleIdCounter = 0;

    const updateLoop = (now: number) => {
      // Cap delta time to prevent massive jumps when browser tab is inactive
      const delta = Math.min(0.04, (now - lastTime) / 1000);
      lastTime = now;

      setParticles((prevParticles) => {
        let nextParticles = prevParticles.map((p) => {
          if (p.stage === 'flat') {
            if (conveyorBottomActive) {
              const nextX = p.x + p.speed * 115 * delta;
              // Transition to transition_drop near the end of flat conveyor (wheels centered at 378, extends to 385+)
              if (nextX >= 383) {
                return {
                  ...p,
                  stage: 'drop_flat_to_inclined',
                  x: nextX,
                  y: p.y,
                  vx: p.speed * 115,
                  vy: 5, // slight downward start velocity
                };
              }
              return { ...p, x: nextX };
            } else {
              // Flat belt is stopped, but keep particles resting on it
              return p;
            }
          } else if (p.stage === 'drop_flat_to_inclined') {
            // RED ZONE: falling parabola curve from flat belt end to inclined belt start
            const nextVy = (p.vy ?? 5) + 245 * delta; // accelerate vertically under gravity
            const nextX = p.x + (p.vx ?? 115) * delta;
            const nextY = p.y + nextVy * delta;

            // The inclined conveyor starts at (400, 450) and goes up to (612.5, 290)
            // Linear equation: beltY = 450 - m * (x - 400), with m = (450 - 290) / (612.5 - 400) = 160 / 212.5 = 0.75294
            const beltY = 450 - 0.75294 * (nextX - 400);

            // If the particle drops below the slope plane or past the start pulley point, it lands on the inclined conveyor
            if (nextY >= beltY && nextX >= 400) {
              if (conveyorUpperActive) {
                // Map the contact position smoothly to a relative progress value along the inclined belt (0 to 1)
                const mappedProgress = Math.max(0, Math.min(1, (nextX - 400) / 212.5));
                return {
                  ...p,
                  stage: 'inclined',
                  progress: mappedProgress,
                  x: 400 + 212.5 * mappedProgress,
                  y: 450 - 160 * mappedProgress,
                };
              } else {
                return null; // disappear if the inclined conveyor is stopped
              }
            }

            // Boundary safeguard: if the particle drops too low without contact, remove it
            if (nextY > 500) {
              return null;
            }

            return {
              ...p,
              x: nextX,
              y: nextY,
              vy: nextVy,
            };
          } else if (p.stage === 'inclined') {
            if (conveyorUpperActive) {
              const nextProgress = (p.progress ?? 0) + (p.speed * 0.45 * delta);
              if (nextProgress >= 1.0) {
                // Reach the end of inclined conveyor pulley (612.5, 290)
                return {
                  ...p,
                  stage: 'falling',
                  x: 612.5,
                  y: 286,
                  vx: 28 + Math.random() * 12, // controlled horizontal arch over the pulley forward
                  vy: 8,
                };
              }
              const x = 400 + (612.5 - 400) * nextProgress;
              const y = 450 + (290 - 450) * nextProgress;
              return { ...p, x, y, progress: nextProgress };
            } else {
              // Inclined belt stopped, keep particles in place
              return p;
            }
          } else if (p.stage === 'falling') {
            // YELLOW ZONE: chute constraints and gravity-controlled waterfall curve drop
            const nextVy = (p.vy ?? 8) + 260 * delta;
            const nextX = p.x + (p.vx ?? 35) * delta;
            const nextY = p.y + nextVy * delta;

            // Absolute boundary line: once hit inner mixer line (y = 350), delete immediately from state
            if (nextY >= 350) {
              return null;
            }

            // Constrain particles tightly inside the chute using physical boundary clamping (y: 320 to 350)
            let clampedX = nextX;
            if (nextY >= 320) {
              const ratio = (nextY - 320) / 30;
              const left_limit = 607.5 + ratio * 30;
              const right_limit = 747.5 - ratio * 30;
              if (clampedX < left_limit + 1) clampedX = left_limit + 1;
              if (clampedX > right_limit - 1) clampedX = right_limit - 1;
            }

            return { 
              ...p, 
              x: clampedX, 
              y: nextY, 
              vy: nextVy 
            };
          }
          return p;
        }).filter(Boolean) as any[];

        // GREEN ZONE: Spawn sand and stone particles ONLY if respective gates are open
        if (conveyorBottomActive) {
          const spawnCount = Math.random() < 0.5 ? 1 : 2;

          // Sand (PASIR) stream under TIMBANGAN PASIR (Discharges from center cx=143)
          if (gatePasirHopperOpen) {
            for (let i = 0; i < spawnCount; i++) {
              particleIdCounter++;
              nextParticles.push({
                id: particleIdCounter + Math.random(),
                type: 'sand',
                x: 143 + (Math.random() - 0.5) * 14,
                y: 412 + (Math.random() - 0.5) * 3,
                speed: 0.95 + Math.random() * 0.35,
                stage: 'flat',
                size: 1.5 + Math.random() * 1.5,
              });
            }
          }

          // Stone (BATU) stream under TIMBANGAN BATU (Discharges from center cx=303)
          if (gateBatuHopperOpen) {
            for (let i = 0; i < spawnCount; i++) {
              particleIdCounter++;
              nextParticles.push({
                id: particleIdCounter + Math.random(),
                type: 'stone',
                x: 303 + (Math.random() - 0.5) * 14,
                y: 411 + (Math.random() - 0.5) * 4,
                speed: 0.95 + Math.random() * 0.35,
                stage: 'flat',
                size: 2.5 + Math.random() * 2.0,
              });
            }
          }
        }

        return nextParticles;
      });

      animationFrameId = requestAnimationFrame(updateLoop);
    };

    animationFrameId = requestAnimationFrame(updateLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isRunning, conveyorBottomActive, conveyorUpperActive, gatePasirHopperOpen, gateBatuHopperOpen]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-[#05080c] overflow-hidden rounded-[4px]">
      <svg viewBox="-120 -30 1250 640" className="w-full h-full max-h-full" preserveAspectRatio="xMidYMin meet">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <clipPath id="pasir-clip">
            <path d="M68 335 L218 335 L168 385 L118 385 Z" />
          </clipPath>
          <clipPath id="batu-clip">
            <path d="M228 335 L378 335 L328 385 L278 385 Z" />
          </clipPath>
          <clipPath id="mixer-funnel-clip">
            <path d="M595 280 L760 280 L718 350 L637 350 Z" />
          </clipPath>
          <clipPath id="semen-clip">
            <path d="M622.5 220 L722.5 220 L700 270 L672.5 292 L645 270 Z" />
          </clipPath>
          <clipPath id="air-clip">
            <path d="M760 220 L840 220 L820 260 L800 278 L780 260 Z" />
          </clipPath>
        </defs>

        {/* Weighing Monitor panel removed from SVG and rendered as native React components in layout */}
        {/* --- AGGREGATE SECTION (LEFT) --- */}
        <g id="aggregate-bins">
          {[
            { x: 68, label: "PASIR 1", isPasir: true, active: isRunning && gatePasir1SiloOpen },
            { x: 148, label: "PASIR 2", isPasir: true, active: isRunning && gatePasir2SiloOpen },
            { x: 228, label: "BATU 1", isPasir: false, active: isRunning && gateBatu1SiloOpen },
            { x: 308, label: "BATU 2", isPasir: false, active: isRunning && gateBatu2SiloOpen }
          ].map((bin, i) => (
            <g key={bin.label}>
              <rect x={bin.x} y="175" width="70" height="100" fill="#2c3e50" stroke={theme.outline} strokeWidth="1.5" />
              <path d={`M${bin.x} 275 L${bin.x + 35} 305 L${bin.x + 70} 275`} fill="#2c3e50" stroke={theme.outline} strokeWidth="1.5" />
              <text x={bin.x + 35} y="210" textAnchor="middle" fill="#94a3b8" fontSize="7.5" fontWeight="black" letterSpacing="1.5">BIN</text>
              <text x={bin.x + 35} y="230" textAnchor="middle" fill="#00e5ff" fontSize="10" fontWeight="bold">{bin.label.replace(" 1", " #1").replace(" 2", " #2")}</text>
              <text x={bin.x + 35} y="248" textAnchor="middle" fill="#888" fontSize="10">100%</text>
              {/* Gate Valve: Blinks when active flow is open */}
              <rect 
                x={bin.x + 25} 
                y="305" 
                width="20" 
                height="6" 
                fill={bin.active ? theme.flow : theme.red} 
                stroke="#000" 
                className=""
              />
              
              {/* Particle Stream falling from silo/bin gate down to scales hopper when bin gate is active */}
              {bin.active && (
                <g>
                  {[...Array(6)].map((_, idx) => (
                     <motion.circle
                      key={idx}
                      cx={bin.x + 35 + (Math.sin(idx) * 2.5)}
                      cy={311}
                      r={bin.isPasir ? 1.5 : 2.5}
                      fill={bin.isPasir ? "#d2b48c" : "#808080"}
                      animate={{ cy: [311, 335], opacity: [1, 1, 0] }}
                      transition={{ 
                        duration: 0.25 + Math.random() * 0.15, 
                        repeat: Infinity, 
                        delay: idx * 0.04, 
                        ease: "linear" 
                      }}
                    />
                  ))}
                </g>
              )}
            </g>
          ))}
        </g>

        {/* Aggregate Hoppers with Sliding Gates */}
        <g id="hoppers">
          {[
            { 
              x: 68, 
              label: "TIMBANGAN PASIR", 
              isPasir: true, 
              isWeighing: isPasirActive, 
              isOpen: gatePasirHopperOpen, 
              clipId: "pasir-clip", 
              fillColor: "#d2b48c", 
              boxH: 50, 
              boxY: 385, 
              actual: scales.pasir.actual, 
              target: scales.pasir.target, 
              cx: 143 
            },
            { 
              x: 228, 
              label: "TIMBANGAN BATU", 
              isPasir: false, 
              isWeighing: isBatuActive, 
              isOpen: gateBatuHopperOpen, 
              clipId: "batu-clip", 
              fillColor: "#808080", 
              boxH: 50, 
              boxY: 385, 
              actual: scales.batu.actual, 
              target: scales.batu.target, 
              cx: 303 
            }
          ].map((h) => {
            const fillRatio = Math.min(1, Math.max(0, h.actual / (h.target || 1)));
            const rectH = fillRatio * h.boxH;
            return (
              <g key={h.label}>
                {/* Hopper Body Background */}
                <path d={`M${h.x} 335 L${h.x + 150} 335 L${h.x + 100} 385 L${h.x + 50} 385 Z`} fill="#0f131a" stroke={theme.outline} strokeWidth="1.5" />
                
                {/* Realtime Smooth Level Fill */}
                <rect 
                  x={h.x} 
                  y={h.boxY - rectH} 
                  width="150" 
                  height={rectH} 
                  fill={h.fillColor} 
                  clipPath={`url(#${h.clipId})`} 
                  opacity="0.8" 
                />
                
                {/* Re-render the outline above of the level fill so it looks clean */}
                <path d={`M${h.x} 335 L${h.x + 150} 335 L${h.x + 100} 385 L${h.x + 50} 385 Z`} fill="none" stroke={theme.outline} strokeWidth="1.5" />
                <text x={h.x + 75} y="352" textAnchor="middle" fill="#00e5ff" fontSize="8" fontWeight="black" letterSpacing="0.5" className="select-none">TIMBANGAN</text>
                <text x={h.x + 75} y="363" textAnchor="middle" fill="#00e5ff" fontSize="8" fontWeight="black" letterSpacing="0.5" className="select-none">{h.isPasir ? "PASIR" : "BATU"}</text>

                {/* Sliding Gate Pneumatic mechanism */}
                <g>
                  {/* Pneumatic Cylinder actuator */}
                  <rect x={h.cx - 42} y="380" width="18" height="6" rx="1.5" fill="#475569" stroke={h.isOpen ? theme.flow : "#334155"} strokeWidth="1" />
                  <line x1={h.cx - 24} y1="383" x2={h.isOpen ? h.cx - 25 : h.cx - 15} y2="383" stroke="#cbd5e1" strokeWidth="2" />
                  
                  {/* Slits/Guides */}
                  <line x1={h.cx - 25} y1="386" x2={h.cx + 25} y2="386" stroke="#475569" strokeWidth="1.5" />
                  
                  {/* Sliding Gate Blade */}
                  <rect 
                     x={h.isOpen ? h.cx - 35 : h.cx - 15} 
                     y="385" 
                     width="30" 
                     height="3" 
                     fill={h.isOpen ? theme.flow : theme.red} 
                     stroke="#000" 
                     strokeWidth="0.5" 
                  />
                  
                  {/* Gate status and indicators */}
                  <text x={h.cx} y="402" textAnchor="middle" fill={h.isOpen ? theme.flow : theme.red} fontSize="7.5" fontWeight="black" className="">
                     {h.isOpen ? "DISCHARGING" : "GATE CLOSED"}
                  </text>
                  <circle cx={h.cx} cy="375" r="3.5" fill={h.isOpen ? theme.flow : theme.red} />
                </g>

                {/* Aggregate Cascade Particles falling from hoppers down to bottom belt conveyor when discharge is active */}
                {h.isOpen && (
                  <g>
                    {[...Array(8)].map((_, idx) => (
                      <motion.circle
                        key={idx}
                        cx={h.cx - 12 + (idx * 3.2) + Math.sin(idx) * 2}
                        cy={389}
                        r={h.isPasir ? 1.5 : 2.5}
                        fill={h.isPasir ? "#d2b48c" : "#808080"}
                        animate={{ cy: [389, 415], opacity: [1, 1, 0] }}
                        transition={{ 
                          duration: 0.25 + Math.random() * 0.15, 
                          repeat: Infinity, 
                          delay: idx * 0.04, 
                          ease: "linear" 
                        }}
                      />
                    ))}
                  </g>
                )}
              </g>
            );
          })}
        </g>

        {/* Conveyor */}
        <g id="conveyor">
          <rect x="68" y="415" width="325" height="15" fill="#111" stroke={theme.outline} strokeWidth="1" />
          <circle cx="83" cy="422.5" r="7" stroke={theme.outline} strokeWidth="1" />
          <circle cx="378" cy="422.5" r="7" stroke={theme.outline} strokeWidth="1" />
          <motion.line 
            x1="93" y1="422.5" x2="368" y2="422.5" 
            stroke={(isRunning && !isPaused && conveyorBottomActive) ? theme.flow : theme.pipe} 
            strokeWidth="3" 
            strokeDasharray="5 5"
            animate={{ strokeDashoffset: (isRunning && !isPaused && conveyorBottomActive) ? [20, 0] : 0 }}
            transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
          />
        </g>

        {/* Main Conveyor to Mixer (Feeder) */}
        <g id="feeder-conveyor">
          {/* Solid Body with Outline - Shifted up corresponding to aggregate conveyor */}
          <line x1="400" y1="450" x2="612.5" y2="290" stroke={theme.outline} strokeWidth="17" strokeLinecap="round" />
          <line x1="400" y1="450" x2="612.5" y2="290" stroke="#111" strokeWidth="15" strokeLinecap="round" />
          
          {/* Roller Circles integrated into the ends */}
          <circle cx="400" cy="450" r="8" fill="#111" stroke={theme.outline} strokeWidth="1" />
          <circle cx="612.5" cy="290" r="8" fill="#111" stroke={theme.outline} strokeWidth="1" />
          
          <motion.line 
            x1="400" y1="450" x2="612.5" y2="290" 
            stroke={(isRunning && !isPaused && conveyorUpperActive) ? theme.flow : theme.pipe} 
            strokeWidth="3" 
            strokeDasharray="5 5"
            animate={{ strokeDashoffset: (isRunning && !isPaused && conveyorUpperActive) ? [20, 0] : 0 }}
            transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
          />
        </g>

        {/* PHYSICAL AGGREGATE LAYER ON BELTS & CASCADE INTO MIXER */}
        <g id="conveyor-aggregates-layer">
          {/* Non-falling particles (moving on bottom, dropping, or moving up the inclined conveyor) */}
          {particles.filter(p => p.stage !== 'falling').map((p) => (
            <circle
              key={p.id}
              cx={p.x}
              cy={p.y}
              r={p.size}
              fill={p.type === 'sand' ? '#d2b48c' : '#808080'}
              opacity={0.95}
            />
          ))}

          {/* Falling particles constrained absolutely inside the chute drop boundary */}
          <g clipPath="url(#mixer-funnel-clip)">
            {particles.filter(p => p.stage === 'falling').map((p) => (
              <circle
                key={p.id}
                cx={p.x}
                cy={p.y}
                r={p.size}
                fill={p.type === 'sand' ? '#d2b48c' : '#808080'}
                opacity={0.9}
              />
            ))}
          </g>
        </g>

        {/* --- SILO SECTION (TOP RIGHT) --- */}
        <g id="silos">
          {[...Array(6)].map((_, i) => {
            const siloX = 550 + i * 45 + 15;
            const siloY = 150;
            const isThisSiloSelected = selectedSiloNumber === (i + 1);
            const isThisSiloActive = isSemen && isThisSiloSelected;
            
            return (
              <g key={i}>
                {/* Cylinder main body */}
                <rect 
                  x={550 + i * 45} 
                  y="30" 
                  width="30" 
                  height="100" 
                  fill={isThisSiloSelected ? "#0e1a2f" : "#0f1419"} 
                  stroke={isThisSiloSelected ? "#10b981" : theme.outline} 
                  strokeWidth={isThisSiloSelected ? "1.5" : "1"} 
                />
                {/* Cone tip funnel */}
                <path 
                  d={`M${550 + i * 45} 130 L${550 + i * 45 + 15} 150 L${550 + i * 45 + 30} 130`} 
                  fill={isThisSiloSelected ? "#0e1a2f" : "#0f1419"} 
                  stroke={isThisSiloSelected ? "#10b981" : theme.outline} 
                  strokeWidth={isThisSiloSelected ? "1.5" : "1"} 
                />
                
                {/* Cement Flow Path (Orthogonal lines with elbows) */}
                <motion.path 
                  d={`M${siloX} ${siloY} V200 H${650 + (i * 10)} V220`}
                  fill="none" 
                  stroke={isThisSiloActive ? theme.flow : theme.pipe} 
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  animate={{ strokeDashoffset: isThisSiloActive ? [20, 0] : 0 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />

                {/* Butterfly Valve at cone tip */}
                <g transform={`translate(${siloX}, ${siloY})`}>
                  <path 
                    d="M-6 -4 L6 4 V-4 L-6 4 Z" 
                    fill={isThisSiloActive ? theme.flow : theme.red} 
                    stroke="#000" 
                    strokeWidth="1" 
                  />
                  <circle r="2" fill="#000" />
                </g>

                <text 
                  x={siloX} 
                  y="175" 
                  textAnchor="middle" 
                  fill={isThisSiloSelected ? "#34d399" : "#64748b"} 
                  fontSize="7.5" 
                  fontWeight="black"
                  className=""
                >
                  SILO {i + 1}
                </text>
                
                <text 
                  x={siloX} 
                  y="55" 
                  textAnchor="middle" 
                  fill={isThisSiloActive ? "#00ffd0" : isThisSiloSelected ? "#34d399" : "#3d5a80"} 
                  fontSize="8.5" 
                  fontWeight="black"
                >
                  {isThisSiloActive ? scales.semen.actual.toFixed(0) : "0.0"}
                </text>
              </g>
            );
          })}
        </g>

        {/* Cement Scale Hopper (Rounded Aesthetic) */}
        <g id="cement-scale-hopper">
          {/* Hopper Body Background */}
          <path 
            d="M622.5 220 L722.5 220 L700 270 L672.5 292 L645 270 Z" 
            fill="#0f1419" 
            stroke={theme.outline} 
            strokeWidth="1.5" 
            strokeLinejoin="round" 
            strokeLinecap="round" 
          />
          
          {/* Cement Level Filling Animation */}
          {(() => {
            const r = Math.min(1, Math.max(0, scales.semen.actual / (scales.semen.target || 1)));
            const rectH = r * 72;
            return (
              <rect 
                x="620" 
                y={292 - rectH} 
                width="110" 
                height={rectH} 
                fill="#808080" 
                clipPath="url(#semen-clip)" 
                opacity="0.8" 
              />
            );
          })()}

          {/* Re-render Outline so it borders the fill beautifully */}
          <path 
            d="M622.5 220 L722.5 220 L700 270 L672.5 292 L645 270 Z" 
            fill="none" 
            stroke={theme.outline} 
            strokeWidth="1.5" 
            strokeLinejoin="round" 
            strokeLinecap="round" 
          />
          <line x1="655" y1="270" x2="690" y2="270" stroke={theme.outline} strokeWidth="1" opacity="0.3" strokeLinecap="round" />
          
          <text x="672.5" y="243" textAnchor="middle" fill={theme.outline} fontSize="7" fontWeight="black" letterSpacing="0.5">TIMBANGAN</text>
          <text x="672.5" y="253" textAnchor="middle" fill={theme.outline} fontSize="7" fontWeight="black" letterSpacing="0.5">SEMEN</text>
          
          <circle cx="672.5" cy="292" r="8" fill="#0a0f14" stroke={theme.outline} strokeWidth="1" />
          <circle cx="672.5" cy="292" r="5" fill={gateSemenHopperOpen ? theme.flow : theme.red} />
          
          {/* Output to mixer */}
          <motion.path 
            d="M672.5 300 V320"
            fill="none" stroke={gateSemenHopperOpen ? theme.flow : theme.pipe} strokeWidth="3"
            strokeDasharray="4 4"
            animate={{ strokeDashoffset: gateSemenHopperOpen ? [20, 0] : 0 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          />

          {/* Animated Gray Cement Dust Plume inside mixer feeding funnel */}
          {gateSemenHopperOpen && (
            <g>
              {[...Array(5)].map((_, idx) => (
                <motion.ellipse
                  key={idx}
                  cx={672.5 + (Math.sin(idx) * 4)}
                  cy={305}
                  rx={4 + idx * 2.5}
                  ry={3 + idx * 1.5}
                  fill="#9cb4c2"
                  opacity={0.5}
                  animate={{ 
                    cy: [305, 335], 
                    rx: [4, 15], 
                    ry: [3, 10], 
                    opacity: [0.6, 0.4, 0] 
                  }}
                  transition={{ 
                    duration: 0.4 + Math.random() * 0.3, 
                    repeat: Infinity, 
                    delay: idx * 0.08, 
                    ease: "easeOut" 
                  }}
                />
              ))}
            </g>
          )}
        </g>

        {/* --- LIQUID TANKS (FAR RIGHT STYLE) --- */}
        <g id="liquid-tanks">
          {[
            { x: 860, label: "TANK AIR", color: theme.accentBlue },
            { x: 920, label: "ADDITIVE", color: theme.accentGreen }
          ].map((t) => {
            const isTankAir = t.label === "TANK AIR";
            const isOpen = isTankAir ? isWaterOpen : isAdditiveOpen;
            return (
              <g key={t.label}>
                <ellipse cx={t.x + 20} cy="40" rx="20" ry="8" fill="#2c3e50" stroke={theme.outline} />
                <rect x={t.x} y="40" width="40" height="60" fill="#2c3e50" stroke={theme.outline} />
                <ellipse cx={t.x + 20} cy="100" rx="20" ry="8" fill="#2c3e50" stroke={theme.outline} />
                
                {/* Active liquid level visually filling up and emptying */}
                {isOpen && (
                  <rect x={t.x + 5} y="60" width="30" height="35" fill={isTankAir ? "rgba(41,121,255,0.4)" : "rgba(0,230,118,0.35)"} />
                )}
                
                <text x={t.x + 20} y="123" textAnchor="middle" fill="#888" fontSize="8">{t.label}</text>
                
                {/* Pneumatic Butterfly Valve at outtake line */}
                <g>
                  <rect x={t.x + 10} y="126" width="20" height="6" rx="1" fill="#475569" stroke={isOpen ? theme.flow : "#334155"} strokeWidth="1" />
                  <line x1={t.x + 20} y1="132" x2={t.x + 20} y2="134" stroke="#cbd5e1" strokeWidth="2" />
                  
                  {/* Flange butterfly body */}
                  <path 
                    d={`M${t.x + 11} 134 L${t.x + 29} 144 V134 L${t.x + 11} 144 Z`} 
                    fill={isOpen ? theme.flow : theme.red} 
                    stroke="#000" 
                    strokeWidth="1" 
                  />
                  <circle cx={t.x + 20} cy="139" r="2.5" fill="#000" />
                  
                  {/* Valve mini label indicator */}
                  <text x={t.x + 20} y="152" textAnchor="middle" fill={isOpen ? theme.flow : theme.red} fontSize="6" fontWeight="bold">
                    {isOpen ? "OPEN" : "CLOSED"}
                  </text>
                </g>
                
                {/* Pipes conveying liquids to water scale hopper */}
                <motion.path 
                  d={`M${t.x + 20} 145 V200 H800 V220`}
                  fill="none" 
                  stroke={isOpen ? theme.flow : theme.pipe} 
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  animate={{ strokeDashoffset: isOpen ? [20, 0] : 0 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              </g>
            );
          })}
        </g>

        {/* Water Scale Hopper (Rounded Aesthetic) */}
        <g id="water-scale-hopper">
          {/* Hopper Body Background */}
          <path 
            d="M760 220 L840 220 L820 260 L800 278 L780 260 Z" 
            fill="#0f1419" 
            stroke={theme.outline} 
            strokeWidth="1.5" 
            strokeLinejoin="round" 
            strokeLinecap="round" 
          />
          
          {/* Water Level Filling Animation */}
          {(() => {
            const r = Math.min(1, Math.max(0, scales.air.actual / (scales.air.target || 1)));
            const rectH = r * 58;
            return (
              <rect 
                x="760" 
                y={278 - rectH} 
                width="90" 
                height={rectH} 
                fill="#2563eb" 
                clipPath="url(#air-clip)" 
                opacity="0.8" 
              />
            );
          })()}

          {/* Re-render Outline to border fill beautifully */}
          <path 
            d="M760 220 L840 220 L820 260 L800 278 L780 260 Z" 
            fill="none" 
            stroke={theme.outline} 
            strokeWidth="1.5" 
            strokeLinejoin="round" 
            strokeLinecap="round" 
          />
          <line x1="785" y1="260" x2="815" y2="260" stroke={theme.outline} strokeWidth="1" opacity="0.3" strokeLinecap="round" />
          
          <text x="800" y="240" textAnchor="middle" fill={theme.outline} fontSize="7" fontWeight="black">TIMBANGAN</text>
          <text x="800" y="250" textAnchor="middle" fill={theme.outline} fontSize="7" fontWeight="black">AIR & ADITIF</text>
          
          <circle cx="800" cy="278" r="7" fill="#0a0f14" stroke={theme.outline} strokeWidth="1" />
          <circle cx="800" cy="278" r="4" fill={gateWaterHopperOpen ? theme.flow : theme.red} />
          
          {/* Outlet water pipeline discharging downstream - routed above 300 to cleanly bypass the integrated PLC panel */}
          <motion.path 
            d="M800 285 V292 H700 V320"
            fill="none" stroke={gateWaterHopperOpen ? theme.flow : theme.pipe} strokeWidth="2.5"
            strokeDasharray="4 4"
            animate={{ strokeDashoffset: gateWaterHopperOpen ? [20, 0] : 0 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          />

          {/* Water Discharge Droplets entering mixer */}
          {gateWaterHopperOpen && (
            <g>
              {[...Array(6)].map((_, idx) => (
                <motion.circle
                  key={idx}
                  cx={688 + (idx * 5) + Math.sin(idx) * 2}
                  cy={320}
                  r={1.8}
                  fill="#38bdf8"
                  animate={{ cy: [320, 350], opacity: [1, 1, 0] }}
                  transition={{ 
                    duration: 0.3 + Math.random() * 0.15, 
                    repeat: Infinity, 
                    delay: idx * 0.05, 
                    ease: "linear" 
                  }}
                />
              ))}
            </g>
          )}
        </g>

        {/* --- MIXER (CENTER BOTTOM) --- */}
        <g id="mixer-unit">
          {/* Input Funnel - Centered over mixer (677.5) and wide enough to cover conveyor and hopper */}
          <path d="M607.5 320 L747.5 320 L717.5 350 L637.5 350 Z" fill="#222" stroke={theme.outline} strokeWidth="1.5" />
          
          {/* Mixer Frame Body Box */}
          <rect x="577.5" y="350" width="200" height="100" rx="4" fill="#1e293b" stroke={theme.outline} strokeWidth="2" />

          {/* Swirling wet concrete paste background layer if mixer is loading or mixing */}
          {isMixerRotating && (
            <motion.rect 
              x="581.5" 
              y="370" 
              width="192" 
              height="74" 
              rx="2" 
              fill="#4b5563" 
              opacity="0.25"
              animate={{ opacity: [0.2, 0.35, 0.2] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
          
          {/* Twin Shaft Animation */}
          <g id="twin-shafts" opacity={isMixerRotating ? 1 : 0.3}>
            {/* Left Shaft */}
            <g transform="translate(637.5, 400)">
              <circle r="25" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
              <motion.g
                animate={isMixerRotating ? { rotate: -360 } : { rotate: 0 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              >
                <line x1="-22" y1="0" x2="22" y2="0" stroke="#00e5ff" strokeWidth="3" opacity="0.8" />
                <line x1="0" y1="-22" x2="0" y2="22" stroke="#00e5ff" strokeWidth="3" opacity="0.8" />
                {/* Paddle Profiles */}
                <rect x="-24" y="-3" width="6" height="6" fill="#00e5ff" rx="1" />
                <rect x="18" y="-3" width="6" height="6" fill="#00e5ff" rx="1" />
                <rect x="-3" y="-24" width="6" height="6" fill="#00e5ff" rx="1" />
                <rect x="-3" y="18" width="6" height="6" fill="#00e5ff" rx="1" />
                <circle r="5" fill="#334155" />
              </motion.g>
            </g>
            {/* Right Shaft */}
            <g transform="translate(717.5, 400)">
              <circle r="25" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
              <motion.g
                animate={isMixerRotating ? { rotate: 360 } : { rotate: 0 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              >
                <line x1="-22" y1="0" x2="22" y2="0" stroke="#00e5ff" strokeWidth="3" opacity="0.8" />
                <line x1="0" y1="-22" x2="0" y2="22" stroke="#00e5ff" strokeWidth="3" opacity="0.8" />
                {/* Paddle Profiles */}
                <rect x="-24" y="-3" width="6" height="6" fill="#00e5ff" rx="1" />
                <rect x="18" y="-3" width="6" height="6" fill="#00e5ff" rx="1" />
                <rect x="-3" y="-24" width="6" height="6" fill="#00e5ff" rx="1" />
                <rect x="-3" y="18" width="6" height="6" fill="#00e5ff" rx="1" />
                <circle r="5" fill="#334155" />
              </motion.g>
            </g>
          </g>


          {/* Gear/Motor on side */}
          <circle cx="562.5" cy="400" r="15" fill="#333" stroke={theme.outline} />
          <circle cx="562.5" cy="400" r="5" fill={isMixerRotating ? theme.flow : "#555"} />

          {/* Industrial Discharge Chute under Mixer */}
          <g id="discharge-chute" transform="translate(677.5, 450)">
            {/* Chute funnel outline */}
            <polygon 
              points="-25,0 25,0 15,38 -15,38" 
              fill="#181d26" 
              stroke={theme.outline} 
              strokeWidth="1.5" 
            />
            
            {/* Real sliding discharge gate slider (proportional to doors opened readout) */}
            <rect x="-20" y="-3" width="40" height="4" fill="#344158" />
            
            {/* The Slider blade opens from -20 to +20 according to opening ratio */}
            <motion.rect 
              x={-20 + (mixerDoorPercent / 100) * 35} 
              y="-3" 
              width="40" 
              height="4" 
              fill={mixerDoorPercent > 0 ? theme.flow : theme.red}
              stroke="#000"
              strokeWidth="0.5"
            />

            {/* Readout representing door openings */}
            <text x="0" y="24" textAnchor="middle" fill="#7dd3fc" fontSize="5.5" fontWeight="bold">
              {mixerDoorPercent > 0 ? `DOOR: ${mixerDoorPercent}%` : "DOOR: CLOSED"}
            </text>

            {/* Phased Concrete Stream Flow Animation */}
            {concreteDischargeActive && mixerDoorPercent > 0 && (
              <g>
                {/* Core grey fluid stream. Width reacts to opening percentage! */}
                <motion.rect
                  x={-((mixerDoorPercent / 100) * 7.5)} 
                  y="1" 
                  width={(mixerDoorPercent / 100) * 15} 
                  height="82"
                  fill="#64748b" 
                  opacity="0.85"
                  className="blur-[0.5px]"
                  animate={{ opacity: [0.75, 0.95, 0.75] }}
                  transition={{ duration: 0.25, repeat: Infinity }}
                />
                
                {/* Semen stream lines scaling with door opening */}
                {[...Array(4)].map((_, idx) => (
                  <motion.line
                     key={idx}
                     x1={-6 + (idx * 4)} 
                     y1={1} 
                     x2={-6 + (idx * 4)} 
                     y2={82}
                     stroke="#a1a1aa" 
                     strokeWidth={0.8 + (mixerDoorPercent / 100) * 1.0}
                     strokeDasharray="4 4"
                     animate={{ strokeDashoffset: [0, -12] }}
                     transition={{ duration: 0.2, repeat: Infinity, ease: "linear", delay: idx * 0.05 }}
                  />
                ))}

                {/* Splashes at the outlet input of truck mixer */}
                <g transform="translate(0, 82)">
                  {[...Array(5)].map((_, idx) => (
                    <motion.circle
                      key={idx}
                      cx={-5 + idx * 2.5 + Math.sin(idx) * 1.5}
                      cy={2}
                      r="1.2"
                      fill="#71717a"
                      animate={{ cy: [2, 8], cx: [-5 + idx * 2.5, -8 + idx * 4], opacity: [1, 0] }}
                      transition={{ duration: 0.25, repeat: Infinity, delay: idx * 0.04, ease: "easeOut" }}
                    />
                  ))}
                </g>
              </g>
            )}

            {/* Concrete Output indicators */}
            <circle cy="38" r="3" fill={concreteDischargeActive ? theme.flow : theme.red} />
          </g>
        </g>

        {/* Mixer Truck */}
        <g 
          id="truck" 
          transform="translate(660, 495) scale(0.68)" 
          onClick={onTruckClick}
          className="cursor-pointer"
        >
          <image 
            href={truckImage || "./truck.png"} 
            x="-12.5" 
            y="-10" 
            width="245" 
            height="155" 
            preserveAspectRatio="xMidYMid meet"
          />
        </g>

        {/* AMPERE MIXER (Small, plain display showing only the value inside the chute above the mixer as requested) */}
        <foreignObject x="645.5" y="325" width="64" height="20">
          <div className="w-full h-full bg-[#070b12]/95 border border-cyan-500/30 rounded-[3px] flex items-center justify-center font-mono shadow-md">
            <span className="text-[12px] font-black text-[#00ffd0] select-none tracking-tight drop-shadow-[0_0_5px_rgba(0,255,208,0.4)]">
              {isMixerRotating ? (ampere || 24.5).toFixed(1) : (isRunning ? (isPaused ? "1.5" : "2.5") : "0.0")}{" "}
              <span className="text-[8px] font-sans font-bold text-slate-400">A</span>
            </span>
          </div>
        </foreignObject>

        {/* INDUSTRIAL MIXING TIMER (Moved to right of Mixer as requested) */}
        {(() => {
          const isDischargingSec = productionState === 'DISCHARGING CONCRETE';
          return (
            <foreignObject x="795" y="325" width="160" height="165">
              <div className="w-full h-full bg-transparent p-2 flex flex-col justify-between items-center relative overflow-hidden">
                {/* Header */}
                <div className="w-full flex justify-center items-center pb-1 select-none">
                  <span className={`text-[12.5px] font-sans font-bold tracking-wider uppercase flex items-center gap-1.5 ${isDischargingSec ? 'text-red-500' : 'text-[#00ffd0]'}`}>
                    <span className={`w-2 h-2 rounded-full ${isDischargingSec ? 'bg-red-500' : isMixerRotating ? 'bg-cyan-400' : isPaused ? 'bg-orange-400' : 'bg-slate-600'}`} />
                    {isDischargingSec ? 'DISCHARGE' : 'WAKTU MIXING'}
                  </span>
                </div>

                {/* Custom Circular SVG Dial Indicator */}
                <div className="flex-1 w-full flex items-center justify-center relative my-1">
                  <svg className="w-[105px] h-[105px]" viewBox="0 0 110 110">
                    <defs>
                      <radialGradient id="dialBg" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#0a1224" />
                        <stop offset="75%" stopColor="#040812" />
                        <stop offset="100%" stopColor="#010308" />
                      </radialGradient>
                      <filter id="cyanGlow">
                        <feGaussianBlur stdDeviation="2.5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                      <filter id="redGlow">
                        <feGaussianBlur stdDeviation="2.5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>

                    {/* Outer Ring: Thick navy grey */}
                    <circle cx="55" cy="55" r="50" fill="url(#dialBg)" stroke="#131d31" strokeWidth="6" />
                    
                    {/* Inner Circle: Grey-light / metalloid border represent "Inner circle abu terang" */}
                    <circle cx="55" cy="55" r="46" fill="none" stroke="#94a3b8" strokeWidth="1.2" opacity="0.85" />
                    
                    {/* Tick marks around the circle (24 marks) */}
                    {Array.from({ length: 24 }).map((_, idx) => {
                      const angle = (idx * 360) / 24 - 90;
                      const rad = (angle * Math.PI) / 180;
                      const isMajor = idx % 6 === 0;
                      const len = isMajor ? 4.5 : 2.5;
                      const x1 = 55 + Math.cos(rad) * (43 - len);
                      const y1 = 55 + Math.sin(rad) * (43 - len);
                      const x2 = 55 + Math.cos(rad) * 43;
                      const y2 = 55 + Math.sin(rad) * 43;
                      return (
                        <line
                          key={idx}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke={isMajor ? (isDischargingSec ? "#ef4444" : "#00ffd0") : "#475569"}
                          strokeWidth={isMajor ? "1.5" : "0.7"}
                          opacity="0.85"
                        />
                      );
                    })}

                    {/* Radial Progress Ring (Cyan for Mixing / Red for Discharging) */}
                    {(() => {
                      const r = 38;
                      const C = 2 * Math.PI * r; // ~238.76
                      
                      if (isDischargingSec) {
                        const maxDoorTime = 34; // 34 seconds discharge sequencer
                        const dTimeRemaining = Math.max(0, 34 - dischargeTimeSec);
                        const pct = Math.min(1, Math.max(0, dTimeRemaining / maxDoorTime));
                        const offset = C - (pct * C);
                        
                        return (
                          <circle
                            cx="55"
                            cy="55"
                            r={r}
                            fill="none"
                            stroke="#ef4444"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeDasharray={C}
                            strokeDashoffset={offset}
                            filter="url(#redGlow)"
                            transform="rotate(-90 55 55)"
                            className="transition-all duration-300 ease-out"
                          />
                        );
                      } else {
                        const maxTime = activeMixingTime || 1;
                        const curTime = productionState === 'MIXING' ? mixingCountdown : activeMixingTime;
                        const pct = Math.min(1, Math.max(0, curTime / maxTime));
                        const offset = C - (pct * C);
                        
                        return (
                          <circle
                            cx="55"
                            cy="55"
                            r={r}
                            fill="none"
                            stroke="#00f0ff"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeDasharray={C}
                            strokeDashoffset={offset}
                            filter="url(#cyanGlow)"
                            transform="rotate(-90 55 55)"
                            className="transition-all duration-300 ease-out"
                          />
                        );
                      }
                    })()}

                    {/* Centered large countdown numbers */}
                    <text 
                      x="55" 
                      y="55" 
                      textAnchor="middle" 
                      dominantBaseline="middle"
                      fill={isDischargingSec ? "#ef4444" : "#00e5ff"} 
                      fontSize="34" 
                      fontWeight="950" 
                      fontFamily="monospace"
                      filter={isDischargingSec ? "url(#redGlow)" : "url(#cyanGlow)"}
                      className=""
                    >
                      {isDischargingSec ? (
                        Math.max(0, Math.ceil(34 - dischargeTimeSec))
                      ) : (
                        productionState === 'MIXING' ? mixingCountdown : activeMixingTime
                      )}
                    </text>


                  </svg>
                </div>

                {/* Batch Info Segment */}
                <div className="w-full flex flex-col justify-center items-center select-none bg-transparent py-2 px-1 leading-none">
                  <span className="text-[12px] font-mono font-extrabold text-[#00ff9c] tracking-wide uppercase">
                    MIX {currentCycle || (isRunning ? 1 : 0)} DARI {totalCycles || 1}
                  </span>
                </div>
              </div>
            </foreignObject>
          );
        })()}



        {/* PLC Control panel removed from SVG view and rendered as clean native components underneath */}      </svg>
    </div>
  );
};

interface RelayLog {
  id: string;
  timestamp: Date;
  message: string;
  type: 'on' | 'off' | 'info' | 'done';
}

export default function App() {
  const [scales, setScales] = useState(INITIAL_SCALES);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<MaterialType | 'idle' | 'mixing'>('idle');
  
  // Real-time offline local persistence of logs
  const [logs, setLogs] = useState<BatchLog[]>(() => {
    const saved = localStorage.getItem('hmi_batch_logs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((l: any) => ({
          ...l,
          timestamp: new Date(l.timestamp)
        }));
      } catch (e) {
        console.error("Gagal load logs dari localStorage: ", e);
      }
    }
    return [];
  });

  // Batch configuration states with LocalStorage persistence for complete offline desktop reliability
  const [isBatchConfigOpen, setIsBatchConfigOpen] = useState(false);
  const [activeVolume, setActiveVolume] = useState<number>(() => {
    const saved = localStorage.getItem('active_volume');
    return saved ? parseFloat(saved) : 1.0;
  });
  const [activeMixingCount, setActiveMixingCount] = useState<number>(() => {
    const saved = localStorage.getItem('active_mixing_count');
    return saved ? parseInt(saved, 10) : 1;
  });
  const [activeSlump, setActiveSlump] = useState<string>(() => {
    return localStorage.getItem('active_slump') || "12 cm";
  });
  const [activeSiloSemen, setActiveSiloSemen] = useState<string>(() => {
    return localStorage.getItem('active_silo_semen') || "Silo 3 - 28.290 kg";
  });
  const [isDone, setIsDone] = useState(false);
  const [activeMixingTime, setActiveMixingTime] = useState<number>(() => {
    const saved = localStorage.getItem('active_mixing_time');
    return saved ? parseInt(saved, 10) : 10;
  });
  const [activePelanggan, setActivePelanggan] = useState<string>(() => {
    return localStorage.getItem('active_pelanggan') || "";
  });
  const [activeLokasi, setActiveLokasi] = useState<string>(() => {
    return localStorage.getItem('active_lokasi') || "";
  });
  const [activeNoKendaraan, setActiveNoKendaraan] = useState<string>(() => {
    return localStorage.getItem('active_no_kendaraan') || "";
  });
  const [activeSopir, setActiveSopir] = useState<string>(() => {
    return localStorage.getItem('active_sopir') || "";
  });

  // Auto-save configs to LocalStorage for complete offline desktop integration
  useEffect(() => {
    localStorage.setItem('hmi_batch_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('active_volume', activeVolume.toString());
    localStorage.setItem('active_mixing_count', activeMixingCount.toString());
    localStorage.setItem('active_slump', activeSlump);
    localStorage.setItem('active_silo_semen', activeSiloSemen);
    localStorage.setItem('active_mixing_time', activeMixingTime.toString());
    localStorage.setItem('active_pelanggan', activePelanggan);
    localStorage.setItem('active_lokasi', activeLokasi);
    localStorage.setItem('active_no_kendaraan', activeNoKendaraan);
    localStorage.setItem('active_sopir', activeSopir);
  }, [
    activeVolume,
    activeMixingCount,
    activeSlump,
    activeSiloSemen,
    activeMixingTime,
    activePelanggan,
    activeLokasi,
    activeNoKendaraan,
    activeSopir
  ]);

  // --- SCADA HIGH-REALISM SEQUENCING STATE ENGINE ---
  const [productionState, setProductionState] = useState<'IDLE' | 'STARTING' | 'WEIGHING' | 'READY' | 'WAITING_DISCHARGE' | 'DISCHARGING' | 'MIXING' | 'MIX_COMPLETE' | 'WAITING_EMPTY' | 'NEXT_BATCH' | 'FINISHED' | 'ERROR'>('IDLE');
  const [batchQueue, setBatchQueue] = useState<any[]>([]);
  const [mixerOccupied, setMixerOccupied] = useState<boolean>(false);
  const [currentCycle, setCurrentCycle] = useState<number>(0);
  const [totalCycles, setTotalCycles] = useState<number>(0);
  const [volumePerCycle, setVolumePerCycle] = useState<number>(0);
  
  // Weighing controller states
  const [weighingCycle, setWeighingCycle] = useState<number>(0);
  const [isWeighingActive, setIsWeighingActive] = useState(false);
  
  // Solenoid / Gate indicators
  const [gatePasirSiloOpen, setGatePasirSiloOpen] = useState(false);
  const [gatePasir1SiloOpen, setGatePasir1SiloOpen] = useState(false);
  const [gatePasir2SiloOpen, setGatePasir2SiloOpen] = useState(false);

  const [gateBatuSiloOpen, setGateBatuSiloOpen] = useState(false);
  const [gateBatu1SiloOpen, setGateBatu1SiloOpen] = useState(false);
  const [gateBatu2SiloOpen, setGateBatu2SiloOpen] = useState(false);

  const [mixerDoor1OpenActive, setMixerDoor1OpenActive] = useState(false);
  const [mixerDoor2OpenActive, setMixerDoor2OpenActive] = useState(false);
  const [mixerDoor3OpenActive, setMixerDoor3OpenActive] = useState(false);
  const [mixerDoorClosingActive, setMixerDoorClosingActive] = useState(false);

  const [screwSemenActive, setScrewSemenActive] = useState(false);
  const [valveWaterActive, setValveWaterActive] = useState(false);
  const [gatePasirHopperOpen, setGatePasirHopperOpen] = useState(false);
  const [gateBatuHopperOpen, setGateBatuHopperOpen] = useState(false);
  const [gateSemenHopperOpen, setGateSemenHopperOpen] = useState(false);
  const [gateWaterHopperOpen, setGateWaterHopperOpen] = useState(false);

  // Relay activities log with offline persistence
  const [relayLogs, setRelayLogs] = useState<RelayLog[]>(() => {
    const saved = localStorage.getItem('hmi_relay_logs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((rl: any) => ({
          ...rl,
          timestamp: new Date(rl.timestamp)
        }));
      } catch (e) {
        console.error("Gagal load relay logs:", e);
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('hmi_relay_logs', JSON.stringify(relayLogs));
  }, [relayLogs]);
  
  // Conveyor / Machinery States
  const [conveyorBottomActive, setConveyorBottomActive] = useState(false);
  const [conveyorUpperActive, setConveyorUpperActive] = useState(false);
  const [mixerShaftActive, setMixerShaftActive] = useState(false);
  
  // Mixer doors & concrete flowing status
  const [mixerDoorStateText, setMixerDoorStateText] = useState("CLOSED");
  const [mixerDoorPercent, setMixerDoorPercent] = useState(0); // 0 to 100%
  const [concreteDischargeActive, setConcreteDischargeActive] = useState(false);
  const [mixerStatusText, setMixerStatusText] = useState("IDLE");
  
  // Numerical monitors & counters
  const [mixingCountdown, setMixingCountdown] = useState(0);
  const [dischargeTimeSec, setDischargeTimeSec] = useState(0);
  const [batchId, setBatchId] = useState("");
  const [klaksonActive, setKlaksonActive] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);

  // Real-time Arduino Serial relay state transmission hook
  useEffect(() => {
    const states = [
      gatePasirSiloOpen,      // Index 0  -> Pin 22
      gatePasir1SiloOpen,     // Index 1  -> Pin 23
      gatePasir2SiloOpen,     // Index 2  -> Pin 24
      gateBatuSiloOpen,       // Index 3  -> Pin 25
      gateBatu1SiloOpen,      // Index 4  -> Pin 26
      gateBatu2SiloOpen,      // Index 5  -> Pin 27
      screwSemenActive,       // Index 6  -> Pin 28
      valveWaterActive,       // Index 7  -> Pin 29
      gatePasirHopperOpen,    // Index 8  -> Pin 30
      gateBatuHopperOpen,     // Index 9  -> Pin 31
      gateSemenHopperOpen,    // Index 10 -> Pin 32
      gateWaterHopperOpen,    // Index 11 -> Pin 33
      conveyorBottomActive,   // Index 12 -> Pin 34
      conveyorUpperActive,    // Index 13 -> Pin 35
      mixerShaftActive,       // Index 14 -> Pin 36
      mixerDoor1OpenActive,   // Index 15 -> Pin 37
      mixerDoor2OpenActive,   // Index 16 -> Pin 38
      mixerDoor3OpenActive    // Index 17 -> Pin 39
    ];
    
    // Broadcast states or buffer them during connection transitions
    const currentStatus = webSerialService.getStatus();
    if (currentStatus === "CONNECTED" || currentStatus === "RECONNECTING" || currentStatus === "CONNECTING") {
      webSerialService.sendRelaysState(states);
    }
  }, [
    gatePasirSiloOpen,
    gatePasir1SiloOpen,
    gatePasir2SiloOpen,
    gateBatuSiloOpen,
    gateBatu1SiloOpen,
    gateBatu2SiloOpen,
    screwSemenActive,
    valveWaterActive,
    gatePasirHopperOpen,
    gateBatuHopperOpen,
    gateSemenHopperOpen,
    gateWaterHopperOpen,
    conveyorBottomActive,
    conveyorUpperActive,
    mixerShaftActive,
    mixerDoor1OpenActive,
    mixerDoor2OpenActive,
    mixerDoor3OpenActive
  ]);

  // References and effects for logging relay state transitions
  const prevStatesRef = useRef({
    gatePasir1SiloOpen: false,
    gatePasir2SiloOpen: false,
    gateBatu1SiloOpen: false,
    gateBatu2SiloOpen: false,
    screwSemenActive: false,
    valveWaterActive: false,
    conveyorUpperActive: false,
    conveyorBottomActive: false,
    klaksonActive: false,
    mixerShaftActive: false,
    gatePasirHopperOpen: false,
    gateBatuHopperOpen: false,
    gateWaterHopperOpen: false,
    gateSemenHopperOpen: false,
    mixerDoor1OpenActive: false,
    mixerDoor2OpenActive: false,
    mixerDoor3OpenActive: false,
    mixerDoorClosingActive: false,
  });

  useEffect(() => {
    const prev = prevStatesRef.current;
    const now = {
      gatePasir1SiloOpen,
      gatePasir2SiloOpen,
      gateBatu1SiloOpen,
      gateBatu2SiloOpen,
      screwSemenActive,
      valveWaterActive,
      conveyorUpperActive,
      conveyorBottomActive,
      klaksonActive,
      mixerShaftActive,
      gatePasirHopperOpen,
      gateBatuHopperOpen,
      gateWaterHopperOpen,
      gateSemenHopperOpen,
      mixerDoor1OpenActive,
      mixerDoor2OpenActive,
      mixerDoor3OpenActive,
      mixerDoorClosingActive,
    };

    const newLogs: RelayLog[] = [];
    const createLog = (message: string, type: 'on' | 'off' | 'info' | 'done') => {
      newLogs.push({
        id: 'RL-' + Math.random().toString(36).substring(4, 9).toUpperCase() + '-' + Date.now(),
        timestamp: new Date(),
        message,
        type,
      });
    };

    // Extract Cement Silo ID from activeSiloSemen selection
    const match = activeSiloSemen.match(/Silo\s*(\d+)/i);
    const siloNum = match ? match[1] : "1";

    // 1. Pasir 1
    if (now.gatePasir1SiloOpen !== prev.gatePasir1SiloOpen) {
      if (now.gatePasir1SiloOpen) createLog('pasir 1 on', 'on');
      else createLog('pasir 1 off', 'off');
    }
    // 2. Pasir 2
    if (now.gatePasir2SiloOpen !== prev.gatePasir2SiloOpen) {
      if (now.gatePasir2SiloOpen) createLog('pasir 2 on', 'on');
      else createLog('pasir 2 off', 'off');
    }
    // 3. Batu 1
    if (now.gateBatu1SiloOpen !== prev.gateBatu1SiloOpen) {
      if (now.gateBatu1SiloOpen) createLog('batu 1 on', 'on');
      else createLog('batu 1 off', 'off');
    }
    // 4. Batu 2
    if (now.gateBatu2SiloOpen !== prev.gateBatu2SiloOpen) {
      if (now.gateBatu2SiloOpen) createLog('batu 2 on', 'on');
      else createLog('batu 2 off', 'off');
    }
    // 5. Semen Silo
    if (now.screwSemenActive !== prev.screwSemenActive) {
      if (now.screwSemenActive) createLog(`silo ${siloNum} on`, 'on');
      else createLog(`silo ${siloNum} off`, 'off');
    }
    // 6. Air Timbang
    if (now.valveWaterActive !== prev.valveWaterActive) {
      if (now.valveWaterActive) createLog('air timbang on', 'on');
      else createLog('air timbang off', 'off');
    }
    // 7. Dump Pasir
    if (now.gatePasirHopperOpen !== prev.gatePasirHopperOpen) {
      if (now.gatePasirHopperOpen) createLog('dump pasir', 'on');
    }
    // 8. Dump Batu
    if (now.gateBatuHopperOpen !== prev.gateBatuHopperOpen) {
      if (now.gateBatuHopperOpen) createLog('dump batu', 'on');
    }
    // 9. Dump Air
    if (now.gateWaterHopperOpen !== prev.gateWaterHopperOpen) {
      if (now.gateWaterHopperOpen) createLog('dump air on', 'on');
      else createLog('dump air off', 'off');
    }
    // 10. Dump Semen
    if (now.gateSemenHopperOpen !== prev.gateSemenHopperOpen) {
      if (now.gateSemenHopperOpen) createLog('dump semen on', 'on');
      else createLog('dump semen off', 'off');
    }
    // 11. Konveyor Atas
    if (now.conveyorUpperActive !== prev.conveyorUpperActive) {
      if (now.conveyorUpperActive) createLog('konveyor atas on', 'on');
      else createLog('konveyor atas off', 'off');
    }
    // 12. Konveyor Bawah
    if (now.conveyorBottomActive !== prev.conveyorBottomActive) {
      if (now.conveyorBottomActive) createLog('konveyor bawah on', 'on');
      else createLog('konveyor bawah off', 'off');
    }
    // 13. Klakson
    if (now.klaksonActive !== prev.klaksonActive) {
      if (now.klaksonActive) createLog('klakson on', 'on');
      else createLog('klakson off', 'off');
    }
    // 14. Motor Mixer & Mixer
    if (now.mixerShaftActive !== prev.mixerShaftActive) {
      if (now.mixerShaftActive) {
        createLog('motor mixer on', 'on');
        createLog('mixer on', 'on');
      } else {
        createLog('motor mixer off', 'off');
        createLog('mixer off', 'off');
      }
    }
    // 15. Buka Pintu Mixer 1 dari 3
    if (now.mixerDoor1OpenActive !== prev.mixerDoor1OpenActive) {
      if (now.mixerDoor1OpenActive) createLog('buka pintu 1 dari 3 on', 'on');
      else createLog('buka pintu 1 dari 3 off', 'off');
    }
    // 16. Buka Pintu Mixer 2 dari 3
    if (now.mixerDoor2OpenActive !== prev.mixerDoor2OpenActive) {
      if (now.mixerDoor2OpenActive) createLog('buka pintu 2 dari 3 on', 'on');
      else createLog('buka pintu 2 dari 3 off', 'off');
    }
    // 17. Buka Pintu Mixer 3 dari 3
    if (now.mixerDoor3OpenActive !== prev.mixerDoor3OpenActive) {
      if (now.mixerDoor3OpenActive) createLog('buka pintu 3 dari 3 on', 'on');
      else createLog('buka pintu 3 dari 3 off', 'off');
    }
    // 18. Tutup Pintu Mixer
    if (now.mixerDoorClosingActive !== prev.mixerDoorClosingActive) {
      if (now.mixerDoorClosingActive) createLog('tutup pintu mixer on', 'on');
      else createLog('tutup pintu mixer off', 'off');
    }

    if (newLogs.length > 0) {
      setRelayLogs(prevLogs => {
        const combined = [...newLogs, ...prevLogs];
        return combined.slice(0, 60);
      });
    }

    // Sync ref
    prevStatesRef.current = now;
  }, [
    gatePasir1SiloOpen,
    gatePasir2SiloOpen,
    gateBatu1SiloOpen,
    gateBatu2SiloOpen,
    screwSemenActive,
    valveWaterActive,
    conveyorUpperActive,
    conveyorBottomActive,
    klaksonActive,
    mixerShaftActive,
    gatePasirHopperOpen,
    gateBatuHopperOpen,
    gateWaterHopperOpen,
    gateSemenHopperOpen,
    mixerDoor1OpenActive,
    mixerDoor2OpenActive,
    mixerDoor3OpenActive,
    mixerDoorClosingActive,
    activeSiloSemen
  ]);

  // Record completion log
  useEffect(() => {
    if (isDone) {
      setRelayLogs(prevLogs => [
        {
          id: 'RL-DONE-' + Date.now(),
          timestamp: new Date(),
          message: 'produksi selesai',
          type: 'done' as const
        },
        ...prevLogs
      ].slice(0, 60));
    }
  }, [isDone]);

  // Admin Login and Session state
  const [currentView, setCurrentView] = useState<'hmi' | 'admin-login' | 'admin-dashboard'>(() => {
    const session = localStorage.getItem('admin_session');
    return session === 'true' ? 'admin-dashboard' : 'hmi';
  });

  const [isOperatorLoginOpen, setIsOperatorLoginOpen] = useState(false);
  const [activeOperator, setActiveOperator] = useState<any>(() => {
    const saved = localStorage.getItem("batching_plant_active_user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {}
    }
    return { nama: "Budi", nik: "12002", jabatan: "Operator" };
  });

  useEffect(() => {
    const handleSync = () => {
      const saved = localStorage.getItem("batching_plant_active_user");
      if (saved) {
        try {
          setActiveOperator(JSON.parse(saved));
        } catch (err) {}
      }
    };
    window.addEventListener("active_user_session_sync", handleSync);
    window.addEventListener("user_database_updated", handleSync);
    return () => {
      window.removeEventListener("active_user_session_sync", handleSync);
      window.removeEventListener("user_database_updated", handleSync);
    };
  }, []);

  // --- STATE FOR MIXING SEQUENCE CONFIGS (URUTAN MIXING) ---
  const [mixingSequence, setMixingSequence] = useState<MixingSequence>(() => {
    const saved = localStorage.getItem('hmi_mixing_sequence');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Gagal load mixing sequence dari localStorage, using defaults: ", e);
      }
    }
    return {
      pasir: { nomor: 1, timer: 0 },
      air: { nomor: 1, timer: 2 },
      semen: { nomor: 1, timer: 5 },
      batu: { nomor: 2, timer: 0 }
    };
  });

  const transformedLogs = useMemo(() => {
    return logs
      .filter(l => l.status === 'sukses')
      .map(l => ({
        id: l.id,
        recipeName: l.recipeName,
        volume: l.volume || 1.0,
        timestamp: l.timestamp.toLocaleTimeString()
      }));
  }, [logs]);
  const [recipesList, setRecipesList] = useState<Recipe[]>(() => {
    const saved = localStorage.getItem("batching_plant_recipes_data_scada");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return RECIPES;
  });
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe>(() => recipesList[0] || RECIPES[0]);

  useEffect(() => {
    const handleJmfUpdate = () => {
      const saved = localStorage.getItem("batching_plant_recipes_data_scada");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setRecipesList(parsed);
            setSelectedRecipe(current => {
              const matched = parsed.find(r => r.id === current?.id);
              if (matched) return matched;
              const matchedByName = parsed.find(r => r.name === current?.name);
              if (matchedByName) return matchedByName;
              return parsed[0] || current;
            });
          }
        } catch (e) {}
      }
    };

    window.addEventListener("jmf_database_updated", handleJmfUpdate);
    // Trigger initial load sync
    handleJmfUpdate();

    return () => {
      window.removeEventListener("jmf_database_updated", handleJmfUpdate);
    };
  }, []);
  const [truckImage, setTruckImage] = useState<string | null>(() => {
    return localStorage.getItem('hmi_truck_image') || null;
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTruckImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setTruckImage(reader.result);
          localStorage.setItem('hmi_truck_image', reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Real-time state additions for second image
  const [ampere, setAmpere] = useState<number | null>(null);
  const [slump, setSlump] = useState<number | null>(null);
  const [mixingTime, setMixingTime] = useState(0);
  const [isAuto, setIsAuto] = useState(true);
  const [isPrint, setIsPrint] = useState(true);
  const [moistureControl, setMoistureControl] = useState(false);
  const [quarryAggregate, setQuarryAggregate] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [time, setTime] = useState(new Date());

  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // -- Material isolated jogging states (prioritas lokal manual) --
  const [joggingPasir, setJoggingPasir] = useState(false);
  const [joggingBatu, setJoggingBatu] = useState(false);
  const [joggingSemen, setJoggingSemen] = useState(false);
  const [joggingAir, setJoggingAir] = useState(false);

  const joggingPasirRef = useRef(false);
  const joggingBatuRef = useRef(false);
  const joggingSemenRef = useRef(false);
  const joggingAirRef = useRef(false);

  useEffect(() => { joggingPasirRef.current = joggingPasir; }, [joggingPasir]);
  useEffect(() => { joggingBatuRef.current = joggingBatu; }, [joggingBatu]);
  useEffect(() => { joggingSemenRef.current = joggingSemen; }, [joggingSemen]);
  useEffect(() => { joggingAirRef.current = joggingAir; }, [joggingAir]);

  // --- SCADA INDUSTRIAL SEQUENCING AND SIMULATION TICKER ---
  const simIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Local variables to bypass state asynchronous lag inside the 100ms loop
  const weighingActiveRef = useRef(false);
  const mixerStateRef = useRef<'waiting' | 'discharging_hoppers' | 'mixing' | 'discharging_concrete' | 'complete'>('waiting');
  const dischargeTimerMsRef = useRef(0);
  const mixingTimerMsRef = useRef(0);
  const doorStepRef = useRef(1);
  const doorTimerMsRef = useRef(0);

  const mixingSequenceRef = useRef<MixingSequence>(mixingSequence);
  const sandDischargeStartedRef = useRef(false);
  const sandCompletedElapsedSecRef = useRef<number | null>(null);

  const weighingJogStatesRef = useRef<Record<MaterialType, { phase: 'fast' | 'jeda' | 'jog_on' | 'jog_off' | 'done'; timer: number; pulseCount: number; }>>({
    pasir: { phase: 'fast', timer: 0, pulseCount: 0 },
    batu: { phase: 'fast', timer: 0, pulseCount: 0 },
    semen: { phase: 'fast', timer: 0, pulseCount: 0 },
    air: { phase: 'fast', timer: 0, pulseCount: 0 }
  });

  const getJoggingSettings = () => {
    const DEFAULT_JOGING_DATA = [
      { material: "Pasir", targetPercent: 90, jeda: 1.5, onTime: 0.5, offTime: 1.2, tolerance: 10 },
      { material: "Batu", targetPercent: 92, jeda: 1.5, onTime: 0.4, offTime: 1.3, tolerance: 12 },
      { material: "Semen", targetPercent: 95, jeda: 2.0, onTime: 0.3, offTime: 1.5, tolerance: 5 },
      { material: "Air", targetPercent: 96, jeda: 1.0, onTime: 0.2, offTime: 1.0, tolerance: 2 }
    ];
    const saved = localStorage.getItem("batching_plant_joging_settings");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_JOGING_DATA;
      }
    }
    return DEFAULT_JOGING_DATA;
  };

  const isJoggingActive = (config: any) => {
    if (!config) return false;
    const target = parseFloat(config.targetPercent) || 0;
    const jeda = parseFloat(config.jeda) || 0;
    const onTime = parseFloat(config.onTime || config.onPulse) || 0;
    const offTime = parseFloat(config.offTime || config.offDelay) || 0;
    const tolerance = parseFloat(config.tolerance) || 0;
    return target > 0 || jeda > 0 || onTime > 0 || offTime > 0 || tolerance > 0;
  };

  useEffect(() => {
    mixingSequenceRef.current = mixingSequence;
  }, [mixingSequence]);

  // Play a realistic heavy buzzer horn using Web Audio synth
  const playKlakson = (durationMs = 1200) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(175, audioCtx.currentTime); // heavy buzz frequency
      osc.frequency.linearRampToValueAtTime(145, audioCtx.currentTime + durationMs / 1000);
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(750, audioCtx.currentTime);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + durationMs / 1000);
      
      osc.start();
      setKlaksonActive(true);
      
      setTimeout(() => {
        try {
          osc.stop();
          audioCtx.close();
        } catch (_) {}
        setKlaksonActive(false);
      }, durationMs);
    } catch (e) {
      console.warn("Buzzer audio issue: ", e);
    }
  };

  const startBatch = (config: {
    recipe: Recipe;
    volume: number;
    mixingCycles: number;
    slump: string;
    siloSemen: string;
    mixingTime: number;
    pelanggan: string;
    lokasi: string;
    noKendaraan: string;
    sopir: string;
  }) => {
    if (isRunning) return;

    // Save batch details
    setSelectedRecipe(config.recipe);
    setActiveVolume(config.volume);
    setActiveMixingCount(config.mixingCycles);
    setActiveSlump(config.slump);
    setActiveSiloSemen(config.siloSemen);
    setActiveMixingTime(config.mixingTime);
    setActivePelanggan(config.pelanggan || "CV. Jaya Mandiri");
    setActiveLokasi(config.lokasi || "Bypass Tol Km 19");
    setActiveNoKendaraan(config.noKendaraan || "BM 9012 UX");
    setActiveSopir(config.sopir || "Supir Budi");

    // Compute cycle mathematics
    const totalC = config.mixingCycles || 1;
    setTotalCycles(totalC);
    setCurrentCycle(1);
    setWeighingCycle(1);
    
    const vPerCycle = parseFloat((config.volume / totalC).toFixed(2));
    setVolumePerCycle(vPerCycle);

    // Initial batch ID
    const generatedId = `BP-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,'0')}-${Math.round(Math.random()*8999 + 1000)}`;
    setBatchId(generatedId);

    // Initialize parallel batch queue
    const initialQueue = Array.from({ length: totalC }).map((_, idx) => {
      const bNum = idx + 1;
      return {
        batchNo: bNum,
        status: bNum === 1 ? 'WEIGHING' : 'QUEUED',
        
        pasirActual: 0,
        pasirTarget: Math.round(config.recipe.targets.pasir * vPerCycle),
        pasirWeighed: false,
        pasirDischarged: false,

        batuActual: 0,
        batuTarget: Math.round(config.recipe.targets.batu * vPerCycle),
        batuWeighed: false,
        batuDischarged: false,

        semenActual: 0,
        semenTarget: Math.round(config.recipe.targets.semen * vPerCycle),
        semenWeighed: false,
        semenDischarged: false,

        airActual: 0,
        airTarget: Math.round(config.recipe.targets.air * vPerCycle),
        airWeighed: false,
        airDischarged: false,
      };
    });
    setBatchQueue(initialQueue);

    // Initial scale targets proportional to vPerCycle
    const initialScales = { ...INITIAL_SCALES };
    (Object.keys(INITIAL_SCALES) as MaterialType[]).forEach(k => {
      const targetWeight = Math.round(config.recipe.targets[k] * vPerCycle);
      initialScales[k] = { 
        id: k, 
        label: INITIAL_SCALES[k].label, 
        actual: 0, 
        target: targetWeight, 
        unit: INITIAL_SCALES[k].unit, 
        isActive: false, 
        isComplete: false 
      };
    });
    setScales(initialScales);

    // Reset machine state refs
    weighingActiveRef.current = true;
    mixerStateRef.current = 'waiting';
    dischargeTimerMsRef.current = 0;
    mixingTimerMsRef.current = 0;
    doorStepRef.current = 1;
    doorTimerMsRef.current = 0;
    sandDischargeStartedRef.current = false;
    sandCompletedElapsedSecRef.current = null;

    // Reset machine state hooks
    setIsWeighingActive(true);
    setProductionState('STARTING');
    setMixerStatusText('STARTING CONVEYORS & MIXER');
    setMixerDoorPercent(0);
    setMixerDoorStateText("CLOSED");
    setDischargeTimeSec(0);
    setConcreteDischargeActive(false);
    setMixerShaftActive(true);
    setBatchProgress(0);
    setMixerOccupied(false);

    // Sound start horn (1.2 seconds)
    playKlakson(1200);

    setIsRunning(true);
    setIsDone(false);
    setIsPaused(false);
    isPausedRef.current = false;
    
    // Reset weighing jog controller state tracking structures
    weighingJogStatesRef.current = {
      pasir: { phase: 'fast', timer: 0, pulseCount: 0 },
      batu: { phase: 'fast', timer: 0, pulseCount: 0 },
      semen: { phase: 'fast', timer: 0, pulseCount: 0 },
      air: { phase: 'fast', timer: 0, pulseCount: 0 }
    };

    // Clear relay activities logs for a fresh batching production run
    setRelayLogs([]);
    setGatePasir1SiloOpen(false);
    setGatePasir2SiloOpen(false);
    setGateBatu1SiloOpen(false);
    setGateBatu2SiloOpen(false);
    setMixerDoor1OpenActive(false);
    setMixerDoor2OpenActive(false);
    setMixerDoor3OpenActive(false);
    setMixerDoorClosingActive(false);
  };

  const stopBatch = () => {
    setIsRunning(false);
    setIsPaused(false);
    isPausedRef.current = false;
    setProductionState('IDLE');
    setIsWeighingActive(false);
    
    // Shut off actuators
    setGatePasirSiloOpen(false);
    setGatePasir1SiloOpen(false);
    setGatePasir2SiloOpen(false);
    setGateBatuSiloOpen(false);
    setGateBatu1SiloOpen(false);
    setGateBatu2SiloOpen(false);
    setMixerDoor1OpenActive(false);
    setMixerDoor2OpenActive(false);
    setMixerDoor3OpenActive(false);
    setMixerDoorClosingActive(false);
    setScrewSemenActive(false);
    setValveWaterActive(false);
    setGatePasirHopperOpen(false);
    setGateBatuHopperOpen(false);
    setGateSemenHopperOpen(false);
    setGateWaterHopperOpen(false);
    setConveyorBottomActive(false);
    setConveyorUpperActive(false);
    setMixerShaftActive(false);
    setMixerDoorPercent(0);
    setMixerDoorStateText("CLOSED");
    setDischargeTimeSec(0);
    setConcreteDischargeActive(false);

    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
  };

  const emergencyStop = () => {
    stopBatch();
    playKlakson(600);
    setLogs(prev => [{
      id: 'ERR-' + Math.random().toString(36).substring(7).toUpperCase(),
      timestamp: new Date(),
      recipeName: selectedRecipe?.name || 'SYSTEM STOP',
      data: { pasir: 0, batu: 0, semen: 0, air: 0 },
      status: 'gagal',
      volume: activeVolume,
      mixingCycles: activeMixingCount,
      slump: activeSlump,
      siloSemen: activeSiloSemen,
      mixingTime: activeMixingTime,
      pelanggan: activePelanggan,
      lokasi: activeLokasi,
      noKendaraan: activeNoKendaraan,
      sopir: activeSopir
    }, ...prev]);
  };

  const handleStartPauseClick = () => {
    if (!isRunning) {
      if (isAuto) {
        setIsBatchConfigOpen(true);
      } else {
        startBatch({
          recipe: selectedRecipe,
          volume: activeVolume,
          mixingCycles: activeMixingCount,
          slump: activeSlump,
          siloSemen: activeSiloSemen,
          mixingTime: activeMixingTime,
          pelanggan: activePelanggan,
          lokasi: activeLokasi,
          noKendaraan: activeNoKendaraan,
          sopir: activeSopir
        });
      }
    } else {
      // Toggle pause state
      setIsPaused(prev => !prev);
    }
  };

  // MASTER TICK PLC SIMULATOR TIMER LOOP (100ms intervals)
  useEffect(() => {
    if (isRunning) {
      // Fluctuate Ampere on Twin shaft
      setAmpere(parseFloat((9.3 + Math.random() * 0.4).toFixed(1)));
      setSlump(parseFloat((11.5 + Math.random() * 1.5).toFixed(1)));

      simIntervalRef.current = setInterval(() => {
        if (isPausedRef.current) return;
        
        // --- 1. WEIGHING ENGINE STATE (TICKING IN REALTIME) ---
        if (weighingActiveRef.current) {
          // Dynamic currentStep state selection for sequential visual HMI tracking
          let step: 'pasir' | 'batu' | 'semen' | 'air' | 'idle' = 'idle';
          if (weighingJogStatesRef.current.pasir.phase !== 'done') {
            step = 'pasir';
          } else if (weighingJogStatesRef.current.batu.phase !== 'done') {
            step = 'batu';
          } else if (weighingJogStatesRef.current.semen.phase !== 'done') {
            step = 'semen';
          } else if (weighingJogStatesRef.current.air.phase !== 'done') {
            step = 'air';
          }
          setCurrentStep(step);

          setScales(prev => {
            const updated = { ...prev };
            let allComplete = true;
            const joggingSettings = getJoggingSettings();

            const isAnyManualJogActive = 
              joggingPasirRef.current || 
              joggingBatuRef.current || 
              joggingSemenRef.current || 
              joggingAirRef.current;

            // 1. Sand (Pasir)
            const pasirConfig = joggingSettings.find((r: any) => r.material === "Pasir") || { targetPercent: 90, jeda: 1.5, onTime: 0.5, offTime: 1.2, tolerance: 10 };
            const pasirTarget = updated.pasir.target;
            const fastLimit_pasir = (pasirConfig.targetPercent / 100) * pasirTarget;
            const jogState_pasir = weighingJogStatesRef.current.pasir;

            if (pasirTarget > 0) {
              // Safety interlock: jika target material sudah >= setpoint, actuator tetap OFF
              if (updated.pasir.actual >= pasirTarget) {
                updated.pasir.isActive = false;
                updated.pasir.isComplete = true;
                setGatePasirSiloOpen(false);
                setGatePasir1SiloOpen(false);
                setGatePasir2SiloOpen(false);
                jogState_pasir.phase = 'done';
              } else {
                // If currently manual-jogging this specific material:
                if (joggingPasirRef.current) {
                  allComplete = false;
                  updated.pasir.isActive = true;
                  
                  // Turn on sand actuators (Independent channel)
                  setGatePasirSiloOpen(true);
                  setGatePasir1SiloOpen(true);
                  setGatePasir2SiloOpen(false);
                  
                  // Increment Sand weight smoothly
                  const inc = (4 + Math.random() * 3) * 0.1; // 0.4 - 0.7 kg / tick
                  updated.pasir.actual = Math.min(pasirTarget, updated.pasir.actual + inc);
                  
                  if (updated.pasir.actual >= pasirTarget) {
                    updated.pasir.isComplete = true;
                    updated.pasir.isActive = false;
                    setGatePasirSiloOpen(false);
                    setGatePasir1SiloOpen(false);
                    setGatePasir2SiloOpen(false);
                    jogState_pasir.phase = 'done';
                  }
                } 
                // Else, if someone is manual-jogging ANOTHER material, isolate sand and keep it OFF
                else if (isAnyManualJogActive) {
                  allComplete = false;
                  setGatePasirSiloOpen(false);
                  setGatePasir1SiloOpen(false);
                  setGatePasir2SiloOpen(false);
                }
                // Else, automatic batching:
                else if (isAuto) {
                  if (jogState_pasir.phase !== 'done') {
                    allComplete = false;
                    updated.pasir.isActive = true;

                    if (jogState_pasir.phase === 'fast') {
                      setGatePasirSiloOpen(true);
                      if (updated.pasir.actual < pasirTarget / 2) {
                        setGatePasir1SiloOpen(true);
                        setGatePasir2SiloOpen(false);
                      } else {
                        setGatePasir1SiloOpen(false);
                        setGatePasir2SiloOpen(true);
                      }

                      const inc = (12 + Math.random() * 6) * 0.1;
                      updated.pasir.actual = Math.min(pasirTarget, updated.pasir.actual + inc);

                      const isPasirJogActive = isJoggingActive(pasirConfig);
                      if (!isPasirJogActive) {
                        if (updated.pasir.actual >= pasirTarget) {
                          setGatePasirSiloOpen(false);
                          setGatePasir1SiloOpen(false);
                          setGatePasir2SiloOpen(false);
                          jogState_pasir.phase = 'done';
                          updated.pasir.isComplete = true;
                          updated.pasir.isActive = false;

                          setRelayLogs(l => [{
                            id: Math.random().toString(36).substring(7).toUpperCase(),
                            timestamp: new Date(),
                            message: "[BATCH CONCRETE] Pasir selesai langsung (Single Feed Normal - JOGGING OFF). Berat: " + updated.pasir.actual.toFixed(1) + " Kg.",
                            type: 'done'
                          }, ...l]);
                        }
                      } else {
                        if (updated.pasir.actual >= fastLimit_pasir) {
                          setGatePasirSiloOpen(false);
                          setGatePasir1SiloOpen(false);
                          setGatePasir2SiloOpen(false);
                          jogState_pasir.phase = 'jeda';
                          jogState_pasir.timer = 0;
                          
                          setRelayLogs(l => [{
                            id: Math.random().toString(36).substring(7).toUpperCase(),
                            timestamp: new Date(),
                            message: "[FAST FEED] Pasir mencapai " + pasirConfig.targetPercent + "% (" + fastLimit_pasir.toFixed(0) + " Kg). Pintu silo ditutup. Jeda...",
                            type: 'info'
                          }, ...l]);
                        }
                      }
                    }
                    else if (jogState_pasir.phase === 'jeda') {
                      setGatePasirSiloOpen(false);
                      setGatePasir1SiloOpen(false);
                      setGatePasir2SiloOpen(false);

                      jogState_pasir.timer += 100;
                      if (jogState_pasir.timer >= pasirConfig.jeda * 1000) {
                        const remainingDeficit = pasirTarget - updated.pasir.actual;
                        if (remainingDeficit <= pasirConfig.tolerance) {
                          jogState_pasir.phase = 'done';
                          updated.pasir.isComplete = true;
                          updated.pasir.isActive = false;

                          setRelayLogs(l => [{
                            id: Math.random().toString(36).substring(7).toUpperCase(),
                            timestamp: new Date(),
                            message: "[STABIL] Pasir stabil. Sisa: " + remainingDeficit.toFixed(1) + " Kg <= Toleransi (" + pasirConfig.tolerance + " Kg). SELESAI.",
                            type: 'done'
                          }, ...l]);
                        } else {
                          jogState_pasir.phase = 'jog_on';
                          jogState_pasir.timer = 0;
                          jogState_pasir.pulseCount += 1;

                          setRelayLogs(l => [{
                            id: Math.random().toString(36).substring(7).toUpperCase(),
                            timestamp: new Date(),
                            message: "[JOGGING] Pasir kurang " + remainingDeficit.toFixed(1) + " Kg. Memulai Gate Jog ke-" + jogState_pasir.pulseCount + ".",
                            type: 'info'
                          }, ...l]);
                        }
                      }
                    }
                    else if (jogState_pasir.phase === 'jog_on') {
                      setGatePasirSiloOpen(true);
                      setGatePasir1SiloOpen(true);
                      setGatePasir2SiloOpen(false);

                      const inc = (4 + Math.random() * 3) * 0.1;
                      updated.pasir.actual = Math.min(pasirTarget, updated.pasir.actual + inc);

                      jogState_pasir.timer += 100;
                      if (jogState_pasir.timer >= pasirConfig.onTime * 1000) {
                        setGatePasirSiloOpen(false);
                        setGatePasir1SiloOpen(false);
                        setGatePasir2SiloOpen(false);
                        jogState_pasir.phase = 'jog_off';
                        jogState_pasir.timer = 0;
                      }
                    }
                    else if (jogState_pasir.phase === 'jog_off') {
                      setGatePasirSiloOpen(false);
                      setGatePasir1SiloOpen(false);
                      setGatePasir2SiloOpen(false);

                      jogState_pasir.timer += 100;
                      if (jogState_pasir.timer >= pasirConfig.offTime * 1000) {
                        const remainingDeficit = pasirTarget - updated.pasir.actual;
                        if (remainingDeficit <= pasirConfig.tolerance) {
                          jogState_pasir.phase = 'done';
                          updated.pasir.isComplete = true;
                          updated.pasir.isActive = false;

                          setRelayLogs(l => [{
                            id: Math.random().toString(36).substring(7).toUpperCase(),
                            timestamp: new Date(),
                            message: "[STABIL] Pasir selesai setelah " + jogState_pasir.pulseCount + " pulsa. Sisa: " + remainingDeficit.toFixed(1) + " Kg.",
                            type: 'done'
                          }, ...l]);
                        } else {
                          jogState_pasir.phase = 'jog_on';
                          jogState_pasir.timer = 0;
                          jogState_pasir.pulseCount += 1;

                          setRelayLogs(l => [{
                            id: Math.random().toString(36).substring(7).toUpperCase(),
                            timestamp: new Date(),
                            message: "[JOGGING] Pasir kurang " + remainingDeficit.toFixed(1) + " Kg. Trigger pulse ke-" + jogState_pasir.pulseCount + "...",
                            type: 'info'
                          }, ...l]);
                        }
                      }
                    }
                  } else {
                    updated.pasir.isActive = false;
                    updated.pasir.isComplete = true;
                    setGatePasirSiloOpen(false);
                    setGatePasir1SiloOpen(false);
                    setGatePasir2SiloOpen(false);
                  }
                }
                // Else (Auto is OFF and no manual jog is active for this material):
                else {
                  allComplete = false;
                  updated.pasir.isActive = false;
                  setGatePasirSiloOpen(false);
                  setGatePasir1SiloOpen(false);
                  setGatePasir2SiloOpen(false);
                }
              }
            }

            // 2. Stone (Batu)
            const batuConfig = joggingSettings.find((r: any) => r.material === "Batu") || { targetPercent: 92, jeda: 1.5, onTime: 0.4, offTime: 1.3, tolerance: 12 };
            const batuTarget = updated.batu.target;
            const fastLimit_batu = (batuConfig.targetPercent / 100) * batuTarget;
            const jogState_batu = weighingJogStatesRef.current.batu;

            if (batuTarget > 0) {
              // Safety interlock: jika target material sudah >= setpoint, actuator tetap OFF
              if (updated.batu.actual >= batuTarget) {
                updated.batu.isActive = false;
                updated.batu.isComplete = true;
                setGateBatuSiloOpen(false);
                setGateBatu1SiloOpen(false);
                setGateBatu2SiloOpen(false);
                jogState_batu.phase = 'done';
              } else {
                // If currently manual-jogging this specific material:
                if (joggingBatuRef.current) {
                  allComplete = false;
                  updated.batu.isActive = true;
                  
                  // Turn on stone actuators (Independent channel)
                  setGateBatuSiloOpen(true);
                  setGateBatu1SiloOpen(true);
                  setGateBatu2SiloOpen(false);
                  
                  // Increment Stone weight smoothly
                  const inc = (5 + Math.random() * 3) * 0.1; // 0.5 - 0.8 kg / tick
                  updated.batu.actual = Math.min(batuTarget, updated.batu.actual + inc);
                  
                  if (updated.batu.actual >= batuTarget) {
                    updated.batu.isComplete = true;
                    updated.batu.isActive = false;
                    setGateBatuSiloOpen(false);
                    setGateBatu1SiloOpen(false);
                    setGateBatu2SiloOpen(false);
                    jogState_batu.phase = 'done';
                  }
                } 
                // Else, if someone is manual-jogging ANOTHER material, isolate stone and keep it OFF
                else if (isAnyManualJogActive) {
                  allComplete = false;
                  setGateBatuSiloOpen(false);
                  setGateBatu1SiloOpen(false);
                  setGateBatu2SiloOpen(false);
                }
                // Else, automatic batching:
                else if (isAuto) {
                  if (jogState_batu.phase !== 'done') {
                    allComplete = false;
                    updated.batu.isActive = true;

                    if (jogState_batu.phase === 'fast') {
                      setGateBatuSiloOpen(true);
                      if (updated.batu.actual < batuTarget / 2) {
                        setGateBatu1SiloOpen(true);
                        setGateBatu2SiloOpen(false);
                      } else {
                        setGateBatu1SiloOpen(false);
                        setGateBatu2SiloOpen(true);
                      }

                      const inc = (15 + Math.random() * 8) * 0.1;
                      updated.batu.actual = Math.min(batuTarget, updated.batu.actual + inc);

                      const isBatuJogActive = isJoggingActive(batuConfig);
                      if (!isBatuJogActive) {
                        if (updated.batu.actual >= batuTarget) {
                          setGateBatuSiloOpen(false);
                          setGateBatu1SiloOpen(false);
                          setGateBatu2SiloOpen(false);
                          jogState_batu.phase = 'done';
                          updated.batu.isComplete = true;
                          updated.batu.isActive = false;

                          setRelayLogs(l => [{
                            id: Math.random().toString(36).substring(7).toUpperCase(),
                            timestamp: new Date(),
                            message: "[BATCH CONCRETE] Batu selesai langsung (Single Feed Normal - JOGGING OFF). Berat: " + updated.batu.actual.toFixed(1) + " Kg.",
                            type: 'done'
                          }, ...l]);
                        }
                      } else {
                        if (updated.batu.actual >= fastLimit_batu) {
                          setGateBatuSiloOpen(false);
                          setGateBatu1SiloOpen(false);
                          setGateBatu2SiloOpen(false);
                          jogState_batu.phase = 'jeda';
                          jogState_batu.timer = 0;
                          
                          setRelayLogs(l => [{
                            id: Math.random().toString(36).substring(7).toUpperCase(),
                            timestamp: new Date(),
                            message: "[FAST FEED] Batu mencapai " + batuConfig.targetPercent + "% (" + fastLimit_batu.toFixed(0) + " Kg). Pintu silo ditutup. Jeda...",
                            type: 'info'
                          }, ...l]);
                        }
                      }
                    }
                    else if (jogState_batu.phase === 'jeda') {
                      setGateBatuSiloOpen(false);
                      setGateBatu1SiloOpen(false);
                      setGateBatu2SiloOpen(false);

                      jogState_batu.timer += 100;
                      if (jogState_batu.timer >= batuConfig.jeda * 1000) {
                        const remainingDeficit = batuTarget - updated.batu.actual;
                        if (remainingDeficit <= batuConfig.tolerance) {
                          jogState_batu.phase = 'done';
                          updated.batu.isComplete = true;
                          updated.batu.isActive = false;

                          setRelayLogs(l => [{
                            id: Math.random().toString(36).substring(7).toUpperCase(),
                            timestamp: new Date(),
                            message: "[STABIL] Batu stabil. Sisa: " + remainingDeficit.toFixed(1) + " Kg <= Toleransi (" + batuConfig.tolerance + " Kg). SELESAI.",
                            type: 'done'
                          }, ...l]);
                        } else {
                          jogState_batu.phase = 'jog_on';
                          jogState_batu.timer = 0;
                          jogState_batu.pulseCount += 1;

                          setRelayLogs(l => [{
                            id: Math.random().toString(36).substring(7).toUpperCase(),
                            timestamp: new Date(),
                            message: "[JOGGING] Batu kurang " + remainingDeficit.toFixed(1) + " Kg. Memulai Gate Jog ke-" + jogState_batu.pulseCount + ".",
                            type: 'info'
                          }, ...l]);
                        }
                      }
                    }
                    else if (jogState_batu.phase === 'jog_on') {
                      setGateBatuSiloOpen(true);
                      setGateBatu1SiloOpen(true);
                      setGateBatu2SiloOpen(false);

                      const inc = (5 + Math.random() * 3) * 0.1;
                      updated.batu.actual = Math.min(batuTarget, updated.batu.actual + inc);

                      jogState_batu.timer += 100;
                      if (jogState_batu.timer >= batuConfig.onTime * 1000) {
                        setGateBatuSiloOpen(false);
                        setGateBatu1SiloOpen(false);
                        setGateBatu2SiloOpen(false);
                        jogState_batu.phase = 'jog_off';
                        jogState_batu.timer = 0;
                      }
                    }
                    else if (jogState_batu.phase === 'jog_off') {
                      setGateBatuSiloOpen(false);
                      setGateBatu1SiloOpen(false);
                      setGateBatu2SiloOpen(false);

                      jogState_batu.timer += 100;
                      if (jogState_batu.timer >= batuConfig.offTime * 1000) {
                        const remainingDeficit = batuTarget - updated.batu.actual;
                        if (remainingDeficit <= batuConfig.tolerance) {
                          jogState_batu.phase = 'done';
                          updated.batu.isComplete = true;
                          updated.batu.isActive = false;

                          setRelayLogs(l => [{
                            id: Math.random().toString(36).substring(7).toUpperCase(),
                            timestamp: new Date(),
                            message: "[STABIL] Batu selesai setelah " + jogState_batu.pulseCount + " pulsa. Sisa: " + remainingDeficit.toFixed(1) + " Kg.",
                            type: 'done'
                          }, ...l]);
                        } else {
                          jogState_batu.phase = 'jog_on';
                          jogState_batu.timer = 0;
                          jogState_batu.pulseCount += 1;

                          setRelayLogs(l => [{
                            id: Math.random().toString(36).substring(7).toUpperCase(),
                            timestamp: new Date(),
                            message: "[JOGGING] Batu kurang " + remainingDeficit.toFixed(1) + " Kg. Trigger pulse ke-" + jogState_batu.pulseCount + "...",
                            type: 'info'
                          }, ...l]);
                        }
                      }
                    }
                  } else {
                    updated.batu.isActive = false;
                    updated.batu.isComplete = true;
                    setGateBatuSiloOpen(false);
                    setGateBatu1SiloOpen(false);
                    setGateBatu2SiloOpen(false);
                  }
                }
                // Else (Auto is OFF and no manual jog is active for this material):
                else {
                  allComplete = false;
                  updated.batu.isActive = false;
                  setGateBatuSiloOpen(false);
                  setGateBatu1SiloOpen(false);
                  setGateBatu2SiloOpen(false);
                }
              }
            }

            // 3. Cement (Semen)
            const semenConfig = joggingSettings.find((r: any) => r.material === "Semen") || { targetPercent: 95, jeda: 2.0, onTime: 0.3, offTime: 1.5, tolerance: 5 };
            const semenTarget = updated.semen.target;
            const fastLimit_semen = (semenConfig.targetPercent / 100) * semenTarget;
            const jogState_semen = weighingJogStatesRef.current.semen;

            if (semenTarget > 0) {
              // Safety interlock: jika target material sudah >= setpoint, actuator tetap OFF
              if (updated.semen.actual >= semenTarget) {
                updated.semen.isActive = false;
                updated.semen.isComplete = true;
                setScrewSemenActive(false);
                jogState_semen.phase = 'done';
              } else {
                // If currently manual-jogging this specific material:
                if (joggingSemenRef.current) {
                  allComplete = false;
                  updated.semen.isActive = true;
                  
                  // Turn on cement screw (Independent channel)
                  setScrewSemenActive(true);
                  
                  // Increment Cement weight smoothly
                  const inc = (2.5 + Math.random() * 1.5) * 0.1; // 0.25 - 0.4 kg / tick
                  updated.semen.actual = Math.min(semenTarget, updated.semen.actual + inc);
                  
                  if (updated.semen.actual >= semenTarget) {
                    updated.semen.isComplete = true;
                    updated.semen.isActive = false;
                    setScrewSemenActive(false);
                    jogState_semen.phase = 'done';
                  }
                } 
                // Else, if someone is manual-jogging ANOTHER material, isolate cement and keep it OFF
                else if (isAnyManualJogActive) {
                  allComplete = false;
                  setScrewSemenActive(false);
                }
                // Else, automatic batching:
                else if (isAuto) {
                  if (jogState_semen.phase !== 'done') {
                    allComplete = false;
                    updated.semen.isActive = true;

                    if (jogState_semen.phase === 'fast') {
                      setScrewSemenActive(true);

                      const inc = (8 + Math.random() * 4) * 0.1; 
                      updated.semen.actual = Math.min(semenTarget, updated.semen.actual + inc);

                      const isSemenJogActive = isJoggingActive(semenConfig);
                      if (!isSemenJogActive) {
                        if (updated.semen.actual >= semenTarget) {
                          setScrewSemenActive(false);
                          jogState_semen.phase = 'done';
                          updated.semen.isComplete = true;
                          updated.semen.isActive = false;

                          setRelayLogs(l => [{
                            id: Math.random().toString(36).substring(7).toUpperCase(),
                            timestamp: new Date(),
                            message: "[BATCH CONCRETE] Semen selesai langsung (Single Feed Normal - JOGGING OFF). Berat: " + updated.semen.actual.toFixed(1) + " Kg.",
                            type: 'done'
                          }, ...l]);
                        }
                      } else {
                        if (updated.semen.actual >= fastLimit_semen) {
                          setScrewSemenActive(false);
                          jogState_semen.phase = 'jeda';
                          jogState_semen.timer = 0;
                          
                          setRelayLogs(l => [{
                            id: Math.random().toString(36).substring(7).toUpperCase(),
                            timestamp: new Date(),
                            message: "[FAST FEED] Semen mencapai " + semenConfig.targetPercent + "% (" + fastLimit_semen.toFixed(0) + " Kg). Screw Conveyor dimatikan. Jeda...",
                            type: 'info'
                          }, ...l]);
                        }
                      }
                    } 
                    else if (jogState_semen.phase === 'jeda') {
                      setScrewSemenActive(false);

                      jogState_semen.timer += 100;
                      if (jogState_semen.timer >= semenConfig.jeda * 1000) {
                        const remainingDeficit = semenTarget - updated.semen.actual;
                        if (remainingDeficit <= semenConfig.tolerance) {
                          jogState_semen.phase = 'done';
                          updated.semen.isComplete = true;
                          updated.semen.isActive = false;

                          setRelayLogs(l => [{
                            id: Math.random().toString(36).substring(7).toUpperCase(),
                            timestamp: new Date(),
                            message: "[STABIL] Semen stabil. Sisa: " + remainingDeficit.toFixed(1) + " Kg <= Toleransi (" + semenConfig.tolerance + " Kg). SELESAI.",
                            type: 'done'
                          }, ...l]);
                        } else {
                          jogState_semen.phase = 'jog_on';
                          jogState_semen.timer = 0;
                          jogState_semen.pulseCount += 1;

                          setRelayLogs(l => [{
                            id: Math.random().toString(36).substring(7).toUpperCase(),
                            timestamp: new Date(),
                            message: "[JOGGING] Semen kurang " + remainingDeficit.toFixed(1) + " Kg. Memulai Screw Jog ke-" + jogState_semen.pulseCount + ".",
                            type: 'info'
                          }, ...l]);
                        }
                      }
                    }
                    else if (jogState_semen.phase === 'jog_on') {
                      setScrewSemenActive(true);

                      const inc = (2.5 + Math.random() * 1.5) * 0.1; 
                      updated.semen.actual = Math.min(semenTarget, updated.semen.actual + inc);

                      jogState_semen.timer += 100;
                      if (jogState_semen.timer >= semenConfig.onTime * 1000) {
                        setScrewSemenActive(false);
                        jogState_semen.phase = 'jog_off';
                        jogState_semen.timer = 0;
                      }
                    }
                    else if (jogState_semen.phase === 'jog_off') {
                      setScrewSemenActive(false);

                      jogState_semen.timer += 100;
                      if (jogState_semen.timer >= semenConfig.offTime * 1000) {
                        const remainingDeficit = semenTarget - updated.semen.actual;
                        if (remainingDeficit <= semenConfig.tolerance) {
                          jogState_semen.phase = 'done';
                          updated.semen.isComplete = true;
                          updated.semen.isActive = false;

                          setRelayLogs(l => [{
                            id: Math.random().toString(36).substring(7).toUpperCase(),
                            timestamp: new Date(),
                            message: "[STABIL] Semen selesai setelah " + jogState_semen.pulseCount + " pulsa. Sisa: " + remainingDeficit.toFixed(1) + " Kg.",
                            type: 'done'
                          }, ...l]);
                        } else {
                          jogState_semen.phase = 'jog_on';
                          jogState_semen.timer = 0;
                          jogState_semen.pulseCount += 1;

                          setRelayLogs(l => [{
                            id: Math.random().toString(36).substring(7).toUpperCase(),
                            timestamp: new Date(),
                            message: "[JOGGING] Semen kurang " + remainingDeficit.toFixed(1) + " Kg. Trigger Screw Pulse ke-" + jogState_semen.pulseCount + "...",
                            type: 'info'
                          }, ...l]);
                        }
                      }
                    }
                  } else {
                    updated.semen.isActive = false;
                    updated.semen.isComplete = true;
                    setScrewSemenActive(false);
                  }
                }
                // Else (Auto is OFF and no manual jog is active for this material):
                else {
                  allComplete = false;
                  updated.semen.isActive = false;
                  setScrewSemenActive(false);
                }
              }
            }

            // 4. Water (Air & Aditif)
            const airConfig = joggingSettings.find((r: any) => r.material === "Air") || { targetPercent: 96, jeda: 1.0, onTime: 0.2, offTime: 1.0, tolerance: 2 };
            const airTarget = updated.air.target;
            const fastLimit_air = (airConfig.targetPercent / 100) * airTarget;
            const jogState_air = weighingJogStatesRef.current.air;

            if (airTarget > 0) {
              // Safety interlock: jika target material sudah >= setpoint, actuator tetap OFF
              if (updated.air.actual >= airTarget) {
                updated.air.isActive = false;
                updated.air.isComplete = true;
                setValveWaterActive(false);
                jogState_air.phase = 'done';
              } else {
                // If currently manual-jogging this specific material:
                if (joggingAirRef.current) {
                  allComplete = false;
                  updated.air.isActive = true;
                  
                  // Turn on water valve (Independent channel)
                  setValveWaterActive(true);
                  
                  // Increment Water weight smoothly
                  const inc = (1.5 + Math.random() * 1.0) * 0.1; // 0.15 - 0.25 kg / tick
                  updated.air.actual = Math.min(airTarget, updated.air.actual + inc);
                  
                  if (updated.air.actual >= airTarget) {
                    updated.air.isComplete = true;
                    updated.air.isActive = false;
                    setValveWaterActive(false);
                    jogState_air.phase = 'done';
                  }
                } 
                // Else, if someone is manual-jogging ANOTHER material, isolate water and keep it OFF
                else if (isAnyManualJogActive) {
                  allComplete = false;
                  setValveWaterActive(false);
                }
                // Else, automatic batching:
                else if (isAuto) {
                  if (jogState_air.phase !== 'done') {
                    allComplete = false;
                    updated.air.isActive = true;

                    if (jogState_air.phase === 'fast') {
                      setValveWaterActive(true);

                      const inc = (5 + Math.random() * 2) * 0.1; 
                      updated.air.actual = Math.min(airTarget, updated.air.actual + inc);

                      const isAirJogActive = isJoggingActive(airConfig);
                      if (!isAirJogActive) {
                        if (updated.air.actual >= airTarget) {
                          setValveWaterActive(false);
                          jogState_air.phase = 'done';
                          updated.air.isComplete = true;
                          updated.air.isActive = false;

                          setRelayLogs(l => [{
                            id: Math.random().toString(36).substring(7).toUpperCase(),
                            timestamp: new Date(),
                            message: "[BATCH CONCRETE] Air selesai langsung (Single Feed Normal - JOGGING OFF). Berat: " + updated.air.actual.toFixed(1) + " Kg.",
                            type: 'done'
                          }, ...l]);
                        }
                      } else {
                        if (updated.air.actual >= fastLimit_air) {
                          setValveWaterActive(false);
                          jogState_air.phase = 'jeda';
                          jogState_air.timer = 0;
                          
                          setRelayLogs(l => [{
                            id: Math.random().toString(36).substring(7).toUpperCase(),
                            timestamp: new Date(),
                            message: "[FAST FEED] Air mencapai " + airConfig.targetPercent + "% (" + fastLimit_air.toFixed(0) + " Kg). Valve utama ditutup. Jeda...",
                            type: 'info'
                          }, ...l]);
                        }
                      }
                    } 
                    else if (jogState_air.phase === 'jeda') {
                      setValveWaterActive(false);

                      jogState_air.timer += 100;
                      if (jogState_air.timer >= airConfig.jeda * 1000) {
                        const remainingDeficit = airTarget - updated.air.actual;
                        if (remainingDeficit <= airConfig.tolerance) {
                          jogState_air.phase = 'done';
                          updated.air.isComplete = true;
                          updated.air.isActive = false;

                          setRelayLogs(l => [{
                            id: Math.random().toString(36).substring(7).toUpperCase(),
                            timestamp: new Date(),
                            message: "[STABIL] Air stabil. Sisa: " + remainingDeficit.toFixed(1) + " Kg <= Toleransi (" + airConfig.tolerance + " Kg). SELESAI.",
                            type: 'done'
                          }, ...l]);
                        } else {
                          jogState_air.phase = 'jog_on';
                          jogState_air.timer = 0;
                          jogState_air.pulseCount += 1;

                          setRelayLogs(l => [{
                            id: Math.random().toString(36).substring(7).toUpperCase(),
                            timestamp: new Date(),
                            message: "[JOGGING] Air kurang " + remainingDeficit.toFixed(1) + " Kg. Memulai Valve Jog ke-" + jogState_air.pulseCount + ".",
                            type: 'info'
                          }, ...l]);
                        }
                      }
                    }
                    else if (jogState_air.phase === 'jog_on') {
                      setValveWaterActive(true);

                      const inc = (1.5 + Math.random() * 1.0) * 0.1; 
                      updated.air.actual = Math.min(airTarget, updated.air.actual + inc);

                      jogState_air.timer += 100;
                      if (jogState_air.timer >= airConfig.onTime * 1000) {
                        setValveWaterActive(false);
                        jogState_air.phase = 'jog_off';
                        jogState_air.timer = 0;
                      }
                    }
                    else if (jogState_air.phase === 'jog_off') {
                      setValveWaterActive(false);

                      jogState_air.timer += 100;
                      if (jogState_air.timer >= airConfig.offTime * 1000) {
                        const remainingDeficit = airTarget - updated.air.actual;
                        if (remainingDeficit <= airConfig.tolerance) {
                          jogState_air.phase = 'done';
                          updated.air.isComplete = true;
                          updated.air.isActive = false;

                          setRelayLogs(l => [{
                            id: Math.random().toString(36).substring(7).toUpperCase(),
                            timestamp: new Date(),
                            message: "[STABIL] Air selesai setelah " + jogState_air.pulseCount + " pulsa. Sisa: " + remainingDeficit.toFixed(1) + " Kg.",
                            type: 'done'
                          }, ...l]);
                        } else {
                          jogState_air.phase = 'jog_on';
                          jogState_air.timer = 0;
                          jogState_air.pulseCount += 1;

                          setRelayLogs(l => [{
                            id: Math.random().toString(36).substring(7).toUpperCase(),
                            timestamp: new Date(),
                            message: "[JOGGING] Air kurang " + remainingDeficit.toFixed(1) + " Kg. Trigger Valve Pulse ke-" + jogState_air.pulseCount + "...",
                            type: 'info'
                          }, ...l]);
                        }
                      }
                    }
                  } else {
                    updated.air.isActive = false;
                    updated.air.isComplete = true;
                    setValveWaterActive(false);
                  }
                }
                // Else (Auto is OFF and no manual jog is active for this material):
                else {
                  allComplete = false;
                  updated.air.isActive = false;
                  setValveWaterActive(false);
                }
              }
            }

            if (allComplete) {
              weighingActiveRef.current = false;
              setIsWeighingActive(false);
              setProductionState('READY TO DISCHARGE');
            }

            return updated;
          });
        }

        // --- 2. MIXER STATE MACHINE SEQUENCER (TICKING CONCURRENTLY) ---
        const currentState = mixerStateRef.current;

        // Waiting for materials to be ready in the scale hoppers
        if (currentState === 'waiting') {
          // Sync HMI display state word
          setMixerStatusText('WAITING WEIGH MATERIAL');
          
          if (!weighingActiveRef.current) {
            // Once Weighing is READY, transition to hopper discharge cascade
            mixerStateRef.current = 'discharging_hoppers';
            dischargeTimerMsRef.current = 0;
            sandDischargeStartedRef.current = false;
            sandCompletedElapsedSecRef.current = null;
            setProductionState('DISCHARGING');
            setMixerStatusText('DISCHARGING HOPPERS');
            setConveyorUpperActive(true); // turn on main belt feeder
            setConveyorBottomActive(true); // turn on bottom conveyor belt
          }
        }

        // Conveying sand, gravel, cement, and dumping liquids into mixer (Sequential timing)
        else if (currentState === 'discharging_hoppers') {
          dischargeTimerMsRef.current += 100;
          const elapsedSec = dischargeTimerMsRef.current / 1000;

          setScales(prev => {
            const nextScales = { ...prev };
            
            // Fetch modern configuration from our reactive admin panel settings:
            const seq = mixingSequenceRef.current;

            // 1. PASIR DISCHARGE (M1) Logic is ALWAYS the baseline
            if (nextScales.pasir.actual > 0) {
              setGatePasirHopperOpen(true);
              setConveyorBottomActive(true);
              sandDischargeStartedRef.current = true; // Event: ON_SAND_DISCHARGE_START

              // Drastically reduced rate of Sand drainage for visual smoothness (slow-motion):
              const drain = (8 + Math.random() * 4) * 0.1; // 0.8 - 1.2 kg/tick
              nextScales.pasir.actual = Math.max(0, nextScales.pasir.actual - drain);
            } else {
              setGatePasirHopperOpen(false);
              // Handle first-time Sand Empty Event: ON_SAND_DISCHARGE_COMPLETE
              if (sandCompletedElapsedSecRef.current === null && sandDischargeStartedRef.current) {
                sandCompletedElapsedSecRef.current = elapsedSec;
              }
            }

            // A helper to verify if a material should start discharging
            const isTriggered = (mat: 'air' | 'semen' | 'batu') => {
              const item = seq[mat];
              if (item.nomor === 1) {
                // Triggered based on Sand Start (at elapsedSec = 0)
                return elapsedSec >= item.timer;
              } else {
                // Triggered based on Sand Complete (after sand Completed)
                if (sandCompletedElapsedSecRef.current !== null) {
                  return elapsedSec >= (sandCompletedElapsedSecRef.current + item.timer);
                }
                return false;
              }
            };

            // 2. AIR & ADITIF (M2) Logic
            if (isTriggered('air')) {
              if (nextScales.air.actual > 0) {
                setGateWaterHopperOpen(true);
                // Drastically reduced rate of Air drainage for visual smoothness (slow-motion):
                const drain = (4 + Math.random() * 2) * 0.1; // 0.4 - 0.6 kg/tick
                nextScales.air.actual = Math.max(0, nextScales.air.actual - drain);
              } else {
                setGateWaterHopperOpen(false);
              }
            } else {
              setGateWaterHopperOpen(false);
            }

            // 3. SEMEN (M3) Logic
            if (isTriggered('semen')) {
              if (nextScales.semen.actual > 0) {
                setGateSemenHopperOpen(true);
                // Drastically reduced rate of Semen drainage for visual smoothness (slow-motion):
                const drain = (5 + Math.random() * 3) * 0.1; // 0.5 - 0.8 kg/tick
                nextScales.semen.actual = Math.max(0, nextScales.semen.actual - drain);
              } else {
                setGateSemenHopperOpen(false);
              }
            } else {
              setGateSemenHopperOpen(false);
            }

            // 4. BATU / KRIS (M4) Logic
            if (isTriggered('batu')) {
              if (nextScales.batu.actual > 0) {
                setGateBatuHopperOpen(true);
                setConveyorBottomActive(true);
                // Drastically reduced rate of Stone drainage for visual smoothness (slow-motion):
                const drain = (10 + Math.random() * 4) * 0.1; // 1.0 - 1.4 kg/tick
                nextScales.batu.actual = Math.max(0, nextScales.batu.actual - drain);
              } else {
                setGateBatuHopperOpen(false);
              }
            } else {
              setGateBatuHopperOpen(false);
            }

            // Once everything is fully drained to 0 in scales scales hoppers
            const allEmpty = nextScales.pasir.actual === 0 && 
                             nextScales.batu.actual === 0 && 
                             nextScales.semen.actual === 0 && 
                             nextScales.air.actual === 0;

            if (allEmpty) {
              // Conveyors are left running for 5 seconds of the mixing cycle to completely clear remaining materials
              
              // Close all gates
              setGatePasirHopperOpen(false);
              setGateBatuHopperOpen(false);
              setGateSemenHopperOpen(false);
              setGateWaterHopperOpen(false);

              // Overlapping background weighing loop trigger for next cycle
              setCurrentCycle(prevCycle => {
                setWeighingCycle(prevWeighing => {
                  setTotalCycles(tot => {
                    if (prevWeighing < tot) {
                      const nextW = prevWeighing + 1;
                      // Overlap weighing triggering in background concurrently
                      weighingActiveRef.current = true;
                      setIsWeighingActive(true);
                      
                      weighingJogStatesRef.current = {
                        pasir: { phase: 'fast', timer: 0, pulseCount: 0 },
                        batu: { phase: 'fast', timer: 0, pulseCount: 0 },
                        semen: { phase: 'fast', timer: 0, pulseCount: 0 },
                        air: { phase: 'fast', timer: 0, pulseCount: 0 }
                      };

                      // Tare/Reset scales actual levels to 0 for cycle C+1 weighing
                      const tFactor = parseFloat((activeVolume / tot).toFixed(2));
                      setScales(sc => {
                        const res = { ...sc };
                        (Object.keys(res) as MaterialType[]).forEach(k => {
                          const targetWeight = Math.round(selectedRecipe.targets[k] * tFactor);
                          res[k] = { 
                            id: k, 
                            label: INITIAL_SCALES[k].label, 
                            actual: 0, 
                            target: targetWeight, 
                            unit: INITIAL_SCALES[k].unit, 
                            isActive: true, 
                            isComplete: false 
                          };
                        });
                        return res;
                      });
                      return nextW;
                    }
                    return prevWeighing;
                  });
                  return prevWeighing;
                });
                return prevCycle;
              });

              // Slide into mixing countdown timer
              mixerStateRef.current = 'mixing';
              mixingTimerMsRef.current = 0;
              setProductionState('MIXING');
              setMixerStatusText('MIXING INTENSELY');
            }

            return nextScales;
          });
        }

        // Inside high-speed mixing process
        else if (currentState === 'mixing') {
          mixingTimerMsRef.current += 100;
          const mixSec = mixingTimerMsRef.current / 1000;
          
          // Let conveyors keep running for exactly 5.0 seconds of mixing to clear all residual aggregate/particles completely
          if (mixSec >= 5.0) {
            setConveyorBottomActive(false);
            setConveyorUpperActive(false);
          }

          setMixingCountdown(Math.max(0, Math.ceil(activeMixingTime - mixSec)));
          setMixingTime(Math.min(activeMixingTime, Math.round(mixSec)));

          // Synchronize general production progress bar
          setCurrentCycle(cur => {
            setTotalCycles(tot => {
              const baseProgress = ((cur - 1) / tot) * 100;
              const stepPercent = (mixSec / activeMixingTime) * 100 * (1 / tot) * 0.45;
              setBatchProgress(Math.min(99, Math.round(baseProgress + stepPercent)));
              return tot;
            });
            return cur;
          });

          if (mixSec >= activeMixingTime) {
            mixerStateRef.current = 'discharging_concrete';
            doorStepRef.current = 1;
            doorTimerMsRef.current = 0;
            setProductionState('DISCHARGING CONCRETE');
            setConcreteDischargeActive(true);
          }
        }

        // Mixer gradual door open sequence (Relay #14 / #15 triggers)
        else if (currentState === 'discharging_concrete') {
          doorTimerMsRef.current += 100;
          const dTime = doorTimerMsRef.current;
          const step = doorStepRef.current;

          // Calculate elapsed discharge duration in seconds
          const dSecondsTotal = 2 + 6 + 3 + 5 + 3 + 10 + 5; // 34 seconds discharge sequencer
          const dSecElapsed = Math.min(dSecondsTotal, (step === 1 ? dTime :
                                       step === 2 ? 2000 + dTime :
                                       step === 3 ? 8000 + dTime :
                                       step === 4 ? 11000 + dTime :
                                       step === 5 ? 16000 + dTime :
                                       step === 6 ? 19000 + dTime :
                                       29000 + dTime) / 1000);
          setDischargeTimeSec(dSecElapsed);

          // Compute overall batch progress
          setCurrentCycle(cur => {
            setTotalCycles(tot => {
              const baseProgress = ((cur - 1) / tot) * 100;
              const mixWeight = 45; // mixing portion completed
              const stepPercent = (dSecElapsed / dSecondsTotal) * 100 * (1 / tot) * 0.55;
              setBatchProgress(Math.min(100, Math.round(baseProgress + mixWeight * (1/tot) + stepPercent)));
              return tot;
            });
            return cur;
          });

          // Phase 1 (Buka 2 detik, Target 20%)
          if (step === 1) {
            setMixerStatusText('DOOR SOLENOID ACTIVE (RELAY #14)');
            setMixerDoorStateText('PHASE 1: BUKA (7cm)');
            setMixerDoorPercent(prev => Math.min(20, prev + 1)); // gradual open
            setMixerDoor1OpenActive(true);
            setMixerDoor2OpenActive(false);
            setMixerDoor3OpenActive(false);
            setMixerDoorClosingActive(false);
            if (dTime >= 2000) {
              doorStepRef.current = 2;
              doorTimerMsRef.current = 0;
            }
          }

          // Phase 2 (Diam 6 detik, Stay 20%)
          else if (step === 2) {
            setMixerStatusText('DOOR STATIONARY (7cm)');
            setMixerDoorStateText('PHASE 2: DIAM (7cm)');
            setMixerDoorPercent(20);
            setMixerDoor1OpenActive(false);
            setMixerDoor2OpenActive(false);
            setMixerDoor3OpenActive(false);
            setMixerDoorClosingActive(false);
            if (dTime >= 6000) {
              doorStepRef.current = 3;
              doorTimerMsRef.current = 0;
            }
          }

          // Phase 3 (Buka 3 detik, Target 65%)
          else if (step === 3) {
            setMixerStatusText('DOOR SOLENOID ACTIVE (RELAY #14)');
            setMixerDoorStateText('PHASE 3: BUKA (24cm)');
            setMixerDoorPercent(prev => Math.min(65, prev + 1.5));
            setMixerDoor1OpenActive(false);
            setMixerDoor2OpenActive(true);
            setMixerDoor3OpenActive(false);
            setMixerDoorClosingActive(false);
            if (dTime >= 3000) {
              doorStepRef.current = 4;
              doorTimerMsRef.current = 0;
            }
          }

          // Phase 4 (Diam 5 dtk, Stay 65%)
          else if (step === 4) {
            setMixerStatusText('DOOR STATIONARY (24cm)');
            setMixerDoorStateText('PHASE 4: DIAM (24cm)');
            setMixerDoorPercent(65);
            setMixerDoor1OpenActive(false);
            setMixerDoor2OpenActive(false);
            setMixerDoor3OpenActive(false);
            setMixerDoorClosingActive(false);
            if (dTime >= 5000) {
              doorStepRef.current = 5;
              doorTimerMsRef.current = 0;
            }
          }

          // Phase 5 (Buka 3 detik, Target 100%)
          else if (step === 5) {
            setMixerStatusText('DOOR SOLENOID ACTIVE (RELAY #14)');
            setMixerDoorStateText('PHASE 5: BUKA LENGKAP (30cm)');
            setMixerDoorPercent(prev => Math.min(100, prev + 1.2));
            setMixerDoor1OpenActive(false);
            setMixerDoor2OpenActive(false);
            setMixerDoor3OpenActive(true);
            setMixerDoorClosingActive(false);
            if (dTime >= 3000) {
              doorStepRef.current = 6;
              doorTimerMsRef.current = 0;
            }
          }

          // Phase 6 (Diam 10 dtk, Stay 100%)
          else if (step === 6) {
            setMixerStatusText('MIXER EMPTY CHUTE FULL FLOOD');
            setMixerDoorStateText('PHASE 6: PENGOSONGAN');
            setMixerDoorPercent(100);
            setMixerDoor1OpenActive(false);
            setMixerDoor2OpenActive(false);
            setMixerDoor3OpenActive(false);
            setMixerDoorClosingActive(false);
            if (dTime >= 10000) {
              doorStepRef.current = 7;
              doorTimerMsRef.current = 0;
            }
          }

          // Phase 7 (Tutup Pintu 5 detik, Target 0%)
          else if (step === 7) {
            setMixerStatusText('CLOSE SOLENOID ACTIVE (RELAY #15)');
            setMixerDoorStateText('PHASE 7: MENUTUP PINTU');
            setMixerDoorPercent(prev => Math.max(0, prev - 2)); // gradual close
            setMixerDoor1OpenActive(false);
            setMixerDoor2OpenActive(false);
            setMixerDoor3OpenActive(false);
            setMixerDoorClosingActive(true);
            
            if (dTime >= 5000) {
              // Solenoid closing concludes!
              setMixerDoorPercent(0);
              setMixerDoorStateText("CLOSED");
              setConcreteDischargeActive(false);
              setMixerDoorClosingActive(false);

              // CHECK COMPLETED BATCH CYCLES
              setCurrentCycle(currCycle => {
                setTotalCycles(totalCyclesCount => {
                  if (currCycle === totalCyclesCount) {
                    // Entire production is complete!
                    setProductionState('COMPLETE');
                    setMixerStatusText('PRODUCTION COMPLETED');
                    setBatchProgress(100);
                    
                    // Stop simulation
                    setIsRunning(false);
                    setIsDone(true);
                    
                    if (simIntervalRef.current) {
                      clearInterval(simIntervalRef.current);
                      simIntervalRef.current = null;
                    }

                    // Log final stats
                    saveLog();

                    // Sound a massive 1.5 seconds completion industrial buzzer horn
                    playKlakson(1500);
                  } else {
                    // Loop back to waiting state for next cycle's materials (which are already weighed overlappingly)
                    mixerStateRef.current = 'waiting';
                    dischargeTimerMsRef.current = 0;
                    mixingTimerMsRef.current = 0;
                    doorStepRef.current = 1;
                    doorTimerMsRef.current = 0;
                    setMixerDoorStateText("CLOSED");
                    setConcreteDischargeActive(false);
                  }
                  return totalCyclesCount;
                });
                return currCycle;
              });
            }
          }
        }
      }, 100);

      return () => {
        if (simIntervalRef.current) {
          clearInterval(simIntervalRef.current);
          simIntervalRef.current = null;
        }
      };
    } else {
      setAmpere(null);
      setSlump(null);
      setMixingTime(0);
      setMixingCountdown(0);
    }
  }, [isRunning, activeMixingTime, selectedRecipe, activeVolume, activeMixingCount]);

  const saveLog = () => {
    const newLog: BatchLog = {
      id: Math.random().toString(36).substring(7).toUpperCase(),
      timestamp: new Date(),
      recipeName: selectedRecipe?.name || "K300 Standard",
      data: {
        // Multi-cycle logs captures correct target values
        pasir: selectedRecipe?.targets.pasir * activeVolume || 450,
        batu: selectedRecipe?.targets.batu * activeVolume || 450,
        semen: selectedRecipe?.targets.semen * activeVolume || 400,
        air: selectedRecipe?.targets.air * activeVolume || 180
      },
      status: 'sukses',
      volume: activeVolume,
      mixingCycles: activeMixingCount,
      slump: activeSlump,
      siloSemen: activeSiloSemen,
      mixingTime: activeMixingTime,
      pelanggan: activePelanggan,
      lokasi: activeLokasi,
      noKendaraan: activeNoKendaraan,
      sopir: activeSopir
    };
    setLogs(prev => [newLog, ...prev].slice(0, 10));
  };

  // Compact Company Header
  const TopCompanyHeader = () => {
    return (
      <nav id="TopCompanyHeader" className="h-[48px] bg-[#0c1220] border border-slate-800 rounded-[6px] flex items-center justify-between px-4 mb-2 shadow-lg select-none">
        {/* Left Side: Logo and Company Info */}
        <div className="flex items-center gap-2.5">
          <div className="scale-75 origin-left shrink-0 -my-2 select-none">
            <FarikaLogo />
          </div>
          <div className="flex flex-col select-none justify-center">
            <span className="text-[10.5px] font-sans font-black tracking-widest text-[#00e5ff] uppercase leading-none">
              PT. FARIKA RIAU PERKASA
            </span>
            <span className="text-[7.5px] font-mono font-bold tracking-wider text-slate-400 uppercase leading-none mt-0.5">
              BATCHING PLANT BP-01 PKU
            </span>
          </div>
        </div>

        {/* Center: System Title & Buttons */}
        <div className="flex items-center gap-2 flex-1 justify-center px-4 max-w-full">
          {/* Tagline / System Status */}
          <div className="hidden lg:flex items-center gap-1.5 text-slate-400 text-[9px] font-mono font-bold tracking-widest uppercase border-r border-slate-800/80 pr-3.5 mr-1 leading-none">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
            <span>SCADA SYSTEM</span>
          </div>
          
          {/* Login Operator */}
          <button 
            onClick={() => setIsOperatorLoginOpen(true)} 
            className="bg-[#1e293b]/70 hover:bg-[#334155] border border-cyan-800/60 hover:border-cyan-500 rounded-full px-3 h-7 flex items-center gap-1.5 text-[9.5px] text-slate-200 transition-colors uppercase font-bold whitespace-nowrap cursor-pointer shadow-[0_0_6px_rgba(34,211,238,0.1)] hover:shadow-[0_0_10px_rgba(34,211,238,0.3)] animate-pulse"
          >
            <User size={10} className="text-[#00ffd0]" />
            <span>OP: {activeOperator?.nama || "Unknown"}</span>
          </button>
          
          {/* Isi Silo */}
          <button 
            onClick={() => alert("Menu Pengisian Silo Silakan Hubungi Admin")} 
            className="bg-[#172554]/70 hover:bg-[#1e3a8a] border border-blue-900/30 rounded-full px-2.5 h-7 flex items-center gap-1.5 text-[10px] text-slate-200 transition-colors uppercase font-bold whitespace-nowrap"
          >
            <Package size={10} className="text-[#38bdf8]" />
            <span>Isi Silo</span>
          </button>
          
          {/* Notification Badge */}
          <div className="relative p-1 bg-slate-800/80 hover:bg-slate-700 rounded-full cursor-pointer text-slate-300 shrink-0">
            <Bell size={12} />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white font-sans text-[7px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center border border-[#0c1220]">
              9
            </span>
          </div>

          {/* Status Location */}
          <div className="bg-slate-800 border border-slate-700/60 text-slate-200 font-mono text-[9px] font-black px-2 py-1 rounded-[4px] uppercase select-none leading-none h-7 flex items-center">
            PKU-BP#1
          </div>

          {/* Login Admin */}
          <button 
            onClick={() => {
              const session = localStorage.getItem('admin_session');
              if (session === 'true') {
                setCurrentView('admin-dashboard');
              } else {
                setCurrentView('admin-login');
              }
            }} 
            className="bg-[#06b6d4]/90 hover:bg-[#0891b2] text-black font-sans font-extrabold text-[10px] rounded-[4px] px-2.5 h-7 uppercase flex items-center gap-1 transition-all whitespace-nowrap cursor-pointer"
          >
            <Power size={10} className="rotate-90" />
            <span>Admin</span>
          </button>
        </div>

        {/* Right Side: Jam + Tanggal */}
        <div className="flex flex-col items-end shrink-0 justify-center leading-none">
          <span className="font-mono text-[16px] font-black tracking-tight text-[#00e5ff] drop-shadow-[0_0_5px_rgba(0,229,255,0.4)] leading-none">
            {time.toLocaleTimeString('id-ID', { hour12: false }).replace(/:/g, '.')}
          </span>
          <span className="text-[7.5px] font-sans font-black text-slate-400 uppercase tracking-tight mt-0.5 leading-none">
            {getIndonesianDate(time)}
          </span>
        </div>
      </nav>
    );
  };

  if (currentView === 'admin-dashboard') {
    return (
      <AdminDashboard 
        logs={transformedLogs}
        mixingSequence={mixingSequence}
        setMixingSequence={setMixingSequence}
        onLogout={() => {
          localStorage.removeItem('admin_session');
          setCurrentView('admin-login');
        }}
      />
    );
  }

  return (
    <div className="h-screen max-h-screen w-screen max-w-full overflow-hidden bg-[#070b13] text-slate-100 font-sans flex flex-col p-2">
      {/* Top Header */}
      <TopCompanyHeader />

      {/* Main Workspace Frame with Cyan Outer Line */}
      <div className="flex-1 bg-[#090d16] border-2 border-[#00e5ff]/80 rounded-[8px] shadow-2xl p-3 flex flex-col min-h-0 relative">
        
        {/* Success Overlay */}
        <AnimatePresence>
          {isDone && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 z-[200] flex items-center justify-center p-6 bg-black/85 backdrop-blur-sm rounded-[6px]"
              onClick={() => setIsDone(false)}
            >
              <div className="bg-[#0b0f19] border-2 border-[#00ffd0] p-6 rounded-[6px] shadow-2xl flex flex-col items-center gap-3 max-w-md text-center">
                <CheckCircle2 size={48} className="text-[#00ffd0] animate-bounce" />
                <h3 className="text-xl font-bold uppercase tracking-tight text-[#00ffd0]">BATCH BERHASIL!</h3>
                
                <div className="text-slate-400 text-[10.5px] uppercase font-mono leading-relaxed text-left border-y border-slate-800 py-3 my-1 w-full space-y-1">
                  <div><strong className="text-slate-300">Resep:</strong> <span className="text-[#00ffd0]">{selectedRecipe.name}</span></div>
                  <div><strong className="text-slate-300">Volume:</strong> <span className="text-white">{activeVolume} m³</span></div>
                  <div><strong className="text-slate-300">Jumlah Mixing:</strong> <span className="text-white">{activeMixingCount}x</span></div>
                  <div><strong className="text-slate-300">Slump:</strong> <span className="text-white">{activeSlump}</span></div>
                  <div><strong className="text-slate-300">Silo Semen:</strong> <span className="text-white">{activeSiloSemen}</span></div>
                  {activePelanggan && <div><strong className="text-slate-300">Pelanggan:</strong> <span className="text-white">{activePelanggan}</span></div>}
                  {activeLokasi && <div><strong className="text-slate-300">Lokasi:</strong> <span className="text-white">{activeLokasi}</span></div>}
                  {activeNoKendaraan && <div><strong className="text-slate-300">No. Kendaraan:</strong> <span className="text-white">{activeNoKendaraan}</span></div>}
                  {activeSopir && <div><strong className="text-slate-300">Sopir:</strong> <span className="text-white">{activeSopir}</span></div>}
                  <div className="pt-1.5 border-t border-slate-900 text-slate-500 text-[9px] text-center">
                    ID BATCH: #{Math.random().toString(36).substring(7).toUpperCase()}
                  </div>
                </div>

                <button 
                  onClick={() => setIsDone(false)}
                  className="mt-2 bg-[#00ffd0] hover:bg-[#00e5ff] text-black px-6 py-1.5 rounded-[4px] font-black uppercase text-xs transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Batch Configuration Form Overlay */}
        <AnimatePresence>
          {isBatchConfigOpen && (
            <BatchConfigModal
              recipes={recipesList}
              onClose={() => setIsBatchConfigOpen(false)}
              onConfirm={(config) => {
                setIsBatchConfigOpen(false);
                startBatch(config);
              }}
            />
          )}
        </AnimatePresence>

        {/* Admin Login Modal Overlay */}
        <AnimatePresence>
          {currentView === 'admin-login' && (
            <LoginModal 
              onSuccess={() => {
                localStorage.setItem('admin_session', 'true');
                setCurrentView('admin-dashboard');
              }}
              onClose={() => {
                setCurrentView('hmi');
              }}
            />
          )}
        </AnimatePresence>

        {/* Operator Login Modal Overlay */}
        <AnimatePresence>
          {isOperatorLoginOpen && (
            <LoginModal 
              onSuccess={() => {
                const updated = localStorage.getItem("batching_plant_active_user");
                if (updated) {
                  try {
                    setActiveOperator(JSON.parse(updated));
                  } catch (e) {}
                }
                setIsOperatorLoginOpen(false);
              }}
              onClose={() => {
                setIsOperatorLoginOpen(false);
              }}
            />
          )}
        </AnimatePresence>

        {/* Help Info Overlay */}
        <AnimatePresence>
          {isHelpOpen && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 z-[200] flex items-center justify-center p-6 bg-black/85 backdrop-blur-sm rounded-[6px]"
              onClick={() => setIsHelpOpen(false)}
            >
              <div 
                className="bg-[#0b0f19] border-2 border-[#00e5ff] p-5 rounded-[6px] shadow-2xl flex flex-col gap-3 max-w-sm text-left text-slate-200 select-none"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-2 text-[#00e5ff] border-b border-slate-800 pb-2">
                  <HelpCircle size={22} className="" />
                  <h3 className="text-sm font-black uppercase tracking-wider">PANDUAN SCADA CONTROL</h3>
                </div>
                <div className="text-[10.5px] font-mono leading-relaxed space-y-1.5 uppercase text-slate-300">
                  <p><strong className="text-[#00ffd0]">START:</strong> Memulai penimbangan otomatis.</p>
                  <p><strong className="text-red-500">STOP:</strong> Pembatalan penimbangan darurat.</p>
                  <p><strong className="text-cyan-400">AUTO ON:</strong> Operasi PLC otomatis / manual.</p>
                  <p><strong className="text-teal-400">MOISTURE CONTROL:</strong> Kompensasi kadar air realtime.</p>
                  <p><strong className="text-blue-400">QUARRY AGGREGATE:</strong> Jalur supply deposit gudang.</p>
                  <p><strong className="text-[#38bdf8]">PRINT:</strong> Cetak struk timbang selepas batch selesai.</p>
                </div>
                <button 
                  onClick={() => setIsHelpOpen(false)}
                  className="mt-2 text-center w-full bg-[#00e5ff] text-black py-1.5 rounded-[4px] font-sans font-extrabold uppercase text-xs hover:brightness-110 cursor-pointer"
                >
                  TUTUP PANDUAN
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Inner layout 3-Column Grid representing the pristine Lovable HMI design */}
        <div className="flex-1 grid grid-cols-[230px_1fr_240px] gap-3 min-h-0 relative select-none">
                    {/* LEFT PANEL: AMPERE, SLUMP, AND ACTIVITY LOGS */}
          <div className="flex flex-col gap-3 min-h-0">
            {/* MONITOR TIMBANGAN (Moved to Left Panel as requested by user, optimized to fill the side-rail) */}
            <div className="bg-[#0b1329] border border-slate-800 rounded-[5px] p-2.5 flex flex-col gap-2 shadow-md flex-1">
              <div className="flex justify-between items-center border-b border-slate-850 pb-1.5 px-0.5 select-none font-sans shrink-0">
                <span className="text-[9px] font-black tracking-widest text-[#00ffd0] uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  TIMBANGAN MATERIAL
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 flex-1 min-h-0">
                {[
                  { key: 'pasir', label: 'PASIR (SAND)' },
                  { key: 'batu', label: 'BATU (STONE)' },
                  { key: 'semen', label: 'SEMEN (CEMENT)' },
                  { key: 'air', label: 'AIR & ADITIF' }
                ].map(({ key, label }) => {
                  const item = scales[key as MaterialType];
                  return (
                    <div key={key} className="bg-[#121c32]/50 border border-slate-800 rounded-[5px] p-2.5 flex flex-col justify-between overflow-hidden relative shadow-sm flex-1 min-h-[60px] transition-all duration-250">
                      {/* Card Header (Target) */}
                      <div className="flex justify-between items-center border-b border-slate-850 pb-1.5 select-none leading-none shrink-0">
                        <span className="text-[8.5px] font-sans font-black text-slate-400 uppercase tracking-widest truncate">{label}</span>
                        <span className="text-[10px] font-mono font-black text-slate-400">
                          TARGET: <span className="text-amber-400 font-extrabold">{item.target.toFixed(0)}</span> <span className="text-[7.5px] text-slate-500">KG</span>
                        </span>
                      </div>
                      
                      {/* Card Input/Value */}
                      <div className="flex justify-between items-center mt-1 leading-none">
                        <span className={`font-mono text-[38px] font-black tracking-tighter leading-none ${
                          item.isActive 
                            ? 'text-[#00ffd0] drop-shadow-[0_0_10px_rgba(0,255,208,0.6)] font-black' 
                            : item.isComplete 
                              ? 'text-[#00ff9c] drop-shadow-[0_0_6px_rgba(0,255,156,0.3)]' 
                              : 'text-slate-200'
                        }`}>
                          {item.actual.toFixed(0)} <span className="text-[12px] font-sans font-black text-slate-550 lowercase tracking-widest">KG</span>
                        </span>
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          item.isActive 
                            ? 'bg-[#00ffd0] shadow-[0_0_10px_rgba(0,255,208,0.8)]' 
                            : item.isComplete 
                              ? 'bg-[#00ff9c] shadow-[0_0_6px_rgba(0,255,156,0.5)]' 
                              : 'bg-slate-800'
                        }`} />
                      </div>

                      {/* Bottom Micro progress indicator */}
                      <div className="h-[3px] w-full bg-[#111827] mt-[7px] rounded-full overflow-hidden shrink-0">
                        <div 
                          className={`h-full transition-all duration-300 ${item.isComplete ? 'bg-[#00ff9c]' : item.isActive ? 'bg-[#00ffd0]' : 'bg-slate-750'}`}
                          style={{ width: `${Math.min(100, (item.actual / (item.target || 1)) * 100)}%` }}
                        />
                      </div>

                      {/* Manual JOG Touchscreen Button */}
                      <button
                        onMouseDown={() => {
                          if (isRunning && !item.isComplete) {
                            if (key === 'pasir') setJoggingPasir(true);
                            if (key === 'batu') setJoggingBatu(true);
                            if (key === 'semen') setJoggingSemen(true);
                            if (key === 'air') setJoggingAir(true);
                          }
                        }}
                        onMouseUp={() => {
                          if (key === 'pasir') setJoggingPasir(false);
                          if (key === 'batu') setJoggingBatu(false);
                          if (key === 'semen') setJoggingSemen(false);
                          if (key === 'air') setJoggingAir(false);
                        }}
                        onMouseLeave={() => {
                          if (key === 'pasir') setJoggingPasir(false);
                          if (key === 'batu') setJoggingBatu(false);
                          if (key === 'semen') setJoggingSemen(false);
                          if (key === 'air') setJoggingAir(false);
                        }}
                        onTouchStart={() => {
                          if (isRunning && !item.isComplete) {
                            if (key === 'pasir') setJoggingPasir(true);
                            if (key === 'batu') setJoggingBatu(true);
                            if (key === 'semen') setJoggingSemen(true);
                            if (key === 'air') setJoggingAir(true);
                          }
                        }}
                        onTouchEnd={() => {
                          if (key === 'pasir') setJoggingPasir(false);
                          if (key === 'batu') setJoggingBatu(false);
                          if (key === 'semen') setJoggingSemen(false);
                          if (key === 'air') setJoggingAir(false);
                        }}
                        disabled={!isRunning || item.isComplete}
                        className={`mt-2 py-1 px-3 text-[10px] font-sans font-black tracking-widest rounded transition-all duration-150 leading-none select-none uppercase shrink-0 border text-center
                          ${(key === 'pasir' ? joggingPasir : key === 'batu' ? joggingBatu : key === 'semen' ? joggingSemen : joggingAir)
                            ? 'bg-amber-500 text-black border-amber-400 font-extrabold scale-95 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                            : item.isComplete
                              ? 'bg-slate-900 border-slate-950 text-slate-600 cursor-not-allowed font-medium'
                              : !isRunning
                                ? 'bg-slate-900 border-slate-950 text-slate-600 cursor-not-allowed font-medium'
                                : 'bg-[#121c32] text-amber-500 border-amber-500/20 cursor-pointer hover:bg-amber-500/10 hover:border-amber-500/50'
                          }`}
                      >
                        {(key === 'pasir' ? joggingPasir : key === 'batu' ? joggingBatu : key === 'semen' ? joggingSemen : joggingAir) ? 'JOGGING...' : 'MANUAL JOG'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* CENTER PANEL: HORIZONTAL WEIGHING CARDS & MECHANICAL DIAGRAM */}
          <div className="flex-1 flex flex-col gap-3 min-h-0">
            {/* MECHANICAL SCADA CANVAS AREA (Elegant representation) */}
            <div className="flex-1 bg-[#05080c] border border-slate-800 rounded-[5px] relative overflow-hidden flex items-center justify-center p-1.5 shadow-inner">
              <ScadaDiagram 
                isRunning={isRunning} 
                currentStep={currentStep} 
                isDone={isDone} 
                truckImage={truckImage}
                onTruckClick={() => fileInputRef.current?.click()}
                scales={scales}
                startBatch={() => setIsBatchConfigOpen(true)}
                stopBatch={stopBatch}
                isAuto={isAuto}
                setIsAuto={setIsAuto}
                moistureControl={moistureControl}
                setMoistureControl={setMoistureControl}
                quarryAggregate={quarryAggregate}
                setQuarryAggregate={setQuarryAggregate}
                isPrint={isPrint}
                setIsPrint={setIsPrint}
                onHelpClick={() => setIsHelpOpen(true)}
                productionState={productionState}
                currentCycle={currentCycle}
                totalCycles={totalCycles}
                gatePasirSiloOpen={gatePasirSiloOpen}
                gatePasir1SiloOpen={gatePasir1SiloOpen}
                gatePasir2SiloOpen={gatePasir2SiloOpen}
                gateBatuSiloOpen={gateBatuSiloOpen}
                gateBatu1SiloOpen={gateBatu1SiloOpen}
                gateBatu2SiloOpen={gateBatu2SiloOpen}
                screwSemenActive={screwSemenActive}
                valveWaterActive={valveWaterActive}
                gatePasirHopperOpen={gatePasirHopperOpen}
                gateBatuHopperOpen={gateBatuHopperOpen}
                gateSemenHopperOpen={gateSemenHopperOpen}
                gateWaterHopperOpen={gateWaterHopperOpen}
                conveyorBottomActive={conveyorBottomActive}
                conveyorUpperActive={conveyorUpperActive}
                mixerShaftActive={mixerShaftActive}
                mixerDoorPercent={mixerDoorPercent}
                mixerDoorStateText={mixerDoorStateText}
                concreteDischargeActive={concreteDischargeActive}
                mixingCountdown={mixingCountdown}
                dischargeTimeSec={dischargeTimeSec}
                activeMixingTime={activeMixingTime}
                ampere={ampere}
                relayLogs={relayLogs}
                isPaused={isPaused}
                activeSiloSemen={activeSiloSemen}
              />
            </div>
          </div>

          {/* RIGHT PANEL: MIXING GAUGES AND PLC CONTROL PANEL BUTTON BOARD */}
          <div className="flex flex-col gap-3 min-h-0 justify-between">
            {/* ESTIMASI SLUMP CARD */}
            <div className="bg-[#0b1329] border border-slate-800 rounded-[5px] p-2.5 flex flex-col justify-between overflow-hidden relative shadow-md shrink-0 h-[105px]">
              <div className="flex justify-between items-center border-b border-slate-850 pb-1.5">
                <span className="text-[8.5px] font-sans font-bold tracking-wider text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Estimasi Slump ( Cm)
                </span>
              </div>
              <div className="flex items-baseline justify-between py-1">
                <span className="font-mono text-[22px] font-black tracking-tight text-emerald-400">
                  {mixerShaftActive ? (slump ? `${slump.toFixed(1)} cm` : "Calculating...") : (isRunning ? `${activeSlump}` : "?")}{" "}
                </span>
              </div>
              {/* Slump Bar Indicator */}
              <div className="w-full bg-[#1e293b]/55 h-1.5 rounded-full overflow-hidden mt-1">
                <div 
                  className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${mixerShaftActive ? 68 : (isRunning ? 50 : 0)}%` }}
                />
              </div>
            </div>

            {/* INDUSTRIAL PLC PANEL COHESIVE BUTTON GRID */}
            <div className="bg-[#0b1329] border border-slate-800 rounded-[5px] p-2.5 flex flex-col gap-2.5 shadow-xl flex-1 relative overflow-hidden min-h-[300px]">
              {/* ACTIVITY LOGS (Moved to the right panel, placed above START and STOP buttons as requested) */}
              <div className="h-[110px] shrink-0 flex flex-col bg-[#070b12]/95 border border-slate-850 rounded-[4px] p-2">
                <div className="flex justify-between items-center border-b border-slate-900/60 pb-1 mb-1 shrink-0 select-none">
                  <span className="text-[7.5px] font-sans font-black tracking-widest text-red-500 uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block shrink-0" />
                    LOG AKTIVITAS HMI
                  </span>
                  <span className="text-[6.5px] font-mono font-bold text-slate-500 uppercase">REALTIME</span>
                </div>
                
                {/* Scrollable list of logs in a single-column layout for narrower space */}
                <div className="flex-1 overflow-y-auto pr-0.5 space-y-1 font-mono scrollbar-thin text-[8.5px] uppercase">
                  {relayLogs.length === 0 ? (
                    <div className="text-slate-600 italic text-center pt-4 font-bold tracking-widest text-[7.5px]">HMI MONITOR STANDBY</div>
                  ) : (
                    <div className="flex flex-col gap-0.5">
                      {[...relayLogs].slice(0, 30).map((log) => {
                        const isOff = log.type === 'off' || log.message.endsWith('off');
                        const isDone = log.type === 'done' || log.message === 'produksi selesai';
                        const isColors = !isOff && !isDone && (log.type === 'on' || log.message.endsWith('on') || log.message.startsWith('dump') || log.message.includes(' on'));
                        
                        let itemStyle = "border-b border-slate-900/40 pb-0.5 flex justify-between items-center px-1 hover:bg-slate-950/40 transition-colors gap-1";
                        let textStyle = "text-slate-350 font-bold truncate max-w-[130px] leading-tight";
                        
                        if (isDone) {
                          itemStyle = "border border-cyan-500/20 py-1 bg-cyan-950/20 my-0.5 font-sans flex flex-col items-center justify-center gap-0.5 shadow-[0_0_8px_rgba(6,182,212,0.1)] rounded";
                          textStyle = "text-cyan-400 font-black text-[8.5px] tracking-wider uppercase leading-none";
                        } else if (isColors) {
                          textStyle = "text-emerald-400 font-bold tracking-tight leading-tight";
                        } else if (isOff) {
                          textStyle = "text-red-500 font-bold tracking-tight leading-tight";
                        }
                        
                        const logTime = log.timestamp instanceof Date ? log.timestamp : new Date(log.timestamp);
                        const timeString = logTime.toLocaleTimeString('id-ID', { hour12: false }).replace(/:/g, '.');

                        if (isDone) {
                          return (
                            <div key={log.id} className={itemStyle}>
                              <span className={textStyle}>{log.message}</span>
                              <span className="text-[6.5px] text-cyan-500/60 font-black uppercase tracking-wider">
                                {timeString}
                              </span>
                            </div>
                          );
                        }
                        
                        return (
                          <div key={log.id} className={itemStyle}>
                            <span className={textStyle} title={log.message}>{log.message}</span>
                            <span className="text-[6.5px] text-slate-500 font-bold shrink-0">
                              {timeString}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Robust Industrial Alignment for Bottom Control Buttons */}
              <div className="flex flex-col gap-1 shrink-0 select-none">
                
                {/* START & STOP ROW - GLOSSY 3D SPHERICAL BUTTON CONTROL INTERFACE */}
                <div className="flex justify-around items-center py-1.5 shrink-0 select-none">
                  {/* START / PAUSE / LANJUT SPHERICAL BUTTON */}
                  <div className="flex flex-col items-center gap-1">
                    <button 
                      onClick={handleStartPauseClick}
                      className={`w-[66px] h-[66px] rounded-full flex flex-col items-center justify-center relative overflow-hidden select-none cursor-pointer transition-all duration-150 border active:scale-95 text-center
                        ${!isRunning 
                          ? 'bg-gradient-to-b from-emerald-400 via-emerald-600 to-emerald-950 border-emerald-400/30 shadow-[inset_0_4px_6px_rgba(255,255,255,0.5),_inset_0_-4px_6px_rgba(0,0,0,0.65),_0_5px_10px_rgba(16,185,129,0.3)] hover:shadow-[inset_0_4px_6px_rgba(255,255,255,0.6),_inset_0_-4px_6px_rgba(0,0,0,0.7),_0_7px_14px_rgba(16,185,129,0.45)]'
                          : isPaused
                          ? 'bg-gradient-to-b from-teal-400 via-emerald-500 to-emerald-900 border-teal-450 shadow-[inset_0_4px_6px_rgba(255,255,255,0.5),_inset_0_-4px_6px_rgba(0,0,0,0.65),_0_5px_10px_rgba(16,185,129,0.3)]'
                          : 'bg-gradient-to-b from-amber-400 via-amber-600 to-amber-950 border-amber-400/30 shadow-[inset_0_4px_6px_rgba(255,255,255,0.5),_inset_0_-4px_6px_rgba(0,0,0,0.65),_0_5px_10px_rgba(245,158,11,0.3)] hover:shadow-[inset_0_4px_6px_rgba(255,255,255,0.6),_inset_0_-4px_6px_rgba(0,0,0,0.7),_0_7px_14px_rgba(245,158,11,0.45)]'
                        }
                      `}
                    >
                      {/* Top Spherical Gloss reflection overlay */}
                      <div className="absolute top-[2.5px] left-[10%] right-[10%] h-[35%] bg-gradient-to-b from-white/70 via-white/10 to-transparent rounded-t-full opacity-90 pointer-events-none filter blur-[0.2px]" />
                      
                      {/* Bottom Light Bounce reflection */}
                      <div className={`absolute bottom-[3px] left-[50%] -translate-x-1/2 w-[60%] h-[15%] bg-gradient-to-t to-transparent rounded-b-full pointer-events-none ${isPaused || !isRunning ? 'from-emerald-300/25' : 'from-amber-300/25'}`} />

                      {/* Micro Glint spark bullet */}
                      <div className="absolute bottom-[9px] right-[20%] w-1.5 h-1.5 bg-white rounded-full opacity-40 pointer-events-none filter blur-[0.4px]" />
                      
                      {/* Inner strong HMI uppercase typography dropshadow lettering */}
                      <span className="text-[10.5px] font-sans font-black tracking-widest text-white leading-none uppercase select-none z-10 drop-shadow-[0_2px_3px_rgba(0,0,0,0.95)]">
                        {!isRunning ? 'START' : isPaused ? 'LANJUT' : 'PAUSE'}
                      </span>
                    </button>
                    <span className="text-[6.5px] font-mono text-slate-500 font-bold uppercase tracking-wider">
                      {!isRunning ? 'MULAI' : isPaused ? 'LANJUTKAN' : 'JEDA'}
                    </span>
                  </div>

                  {/* STOP SPHERICAL BUTTON */}
                  <div className="flex flex-col items-center gap-1">
                    <button 
                      onClick={stopBatch}
                      disabled={!isRunning}
                      className={`w-[66px] h-[66px] rounded-full flex flex-col items-center justify-center relative overflow-hidden select-none transition-all duration-150 border active:scale-95 text-center
                        ${isRunning 
                          ? 'bg-gradient-to-b from-red-400 via-red-650 to-red-955 border-red-400/30 cursor-pointer shadow-[inset_0_4px_6px_rgba(255,255,255,0.5),_inset_0_-4px_6px_rgba(0,0,0,0.65),_0_5px_10px_rgba(239,68,68,0.35)] hover:shadow-[inset_0_4px_6px_rgba(255,255,255,0.6),_inset_0_-4px_6px_rgba(0,0,0,0.7),_0_7px_14px_rgba(239,68,68,0.5)]'
                          : 'bg-gradient-to-b from-slate-900/40 via-red-955/15 to-slate-950/45 border-slate-800 opacity-40 cursor-not-allowed shadow-[inset_0_3px_5px_rgba(0,0,0,0.8)]'
                        }
                      `}
                    >
                      {/* Top Spherical Gloss reflection overlay */}
                      {isRunning && (
                        <>
                          <div className="absolute top-[2.5px] left-[10%] right-[10%] h-[35%] bg-gradient-to-b from-white/70 via-white/10 to-transparent rounded-t-full opacity-90 pointer-events-none filter blur-[0.2px]" />
                          <div className="absolute bottom-[3px] left-[50%] -translate-x-1/2 w-[60%] h-[15%] bg-gradient-to-t from-red-300/25 to-transparent rounded-b-full pointer-events-none" />
                          <div className="absolute bottom-[9px] right-[20%] w-1.5 h-1.5 bg-white rounded-full opacity-40 pointer-events-none filter blur-[0.4px]" />
                        </>
                      )}
                      
                      {/* Inner strong HMI uppercase typography dropshadow lettering */}
                      <span className={`text-[10.5px] font-sans font-black tracking-widest leading-none uppercase select-none z-10 ${isRunning ? 'text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.95)]' : 'text-slate-600'}`}>
                        STOP
                      </span>
                    </button>
                    <span className="text-[6.5px] font-mono text-slate-500 font-bold uppercase tracking-wider">BERHENTI</span>
                  </div>
                </div>

                {/* AUTOMATIC ON OFF SWITCH */}
                <button
                  onClick={() => setIsAuto(!isAuto)}
                  className={`rounded-[5px] px-1 py-1 flex flex-col items-center justify-center text-center transition-all duration-150 border h-[30px] cursor-pointer shrink-0 ${
                    isAuto
                      ? 'bg-[#22c55e] hover:bg-[#16a34a] text-white border-[#4ade80] shadow-[0_0_8px_rgba(34,197,94,0.3)]'
                      : 'bg-[#1e293b]/55 hover:bg-slate-700/80 text-slate-400 border-slate-800'
                  }`}
                >
                  <span className="text-[7.5px] font-sans font-black tracking-wide leading-none uppercase">AUTO: {isAuto ? 'ON' : 'OFF'}</span>
                </button>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden File Input for Truck Image Upload */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleTruckImageUpload} 
        accept="image/*" 
        className="hidden" 
      />
    </div>
  );
}
