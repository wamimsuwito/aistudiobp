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
          <div className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]/55 animate-pulse" />
        </div>
      </div>

      {/* Bottom Box: Material Weights (Fluorescent Electric Green on Dark Slate) */}
      <div className="bg-[#101622] border border-[#1e293b] rounded-[4px] px-3 py-2 flex flex-col justify-center min-h-[65px] relative overflow-hidden shadow-inner select-none group">
        <span className="text-[9px] font-sans font-black uppercase tracking-wider text-[#94a3b8]">{label}</span>
        <div className="font-mono text-2xl font-black tracking-tighter text-[#00ff9c] flex items-baseline justify-between leading-none mt-1">
          <span className={isActive ? 'animate-pulse text-[#00ffd0]' : isComplete ? 'text-[#00ff9c]' : 'text-[#02c383]'}>
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
  gateBatuSiloOpen = false,
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
  concreteDischargeActive = false
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
  gateBatuSiloOpen?: boolean;
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

  const isPasirActive = isRunning ? (gatePasirSiloOpen || currentStep === 'pasir') : false;
  const isBatuActive = isRunning ? (gateBatuSiloOpen || currentStep === 'batu') : false;
  const isSemen = isRunning ? (screwSemenActive || currentStep === 'semen') : false;
  const isAir = isRunning ? (valveWaterActive || currentStep === 'air') : false;
  const isAggregat = isRunning ? (conveyorBottomActive || conveyorUpperActive || isPasirActive || isBatuActive) : false;

  // Dynamic state selectors for flow pathways
  const isWaterOpen = isAir;
  const isAdditiveOpen = isAir;

  return (
    <div className="w-full h-full flex items-center justify-center bg-[#0a0f14] p-4 overflow-hidden rounded-[4px] border border-border">
      <svg viewBox="0 -20 1000 670" className="w-full h-full max-h-full">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <clipPath id="pasir-clip">
            <path d="M50 335 L200 335 L150 385 L100 385 Z" />
          </clipPath>
          <clipPath id="batu-clip">
            <path d="M210 335 L360 335 L310 385 L260 385 Z" />
          </clipPath>
          <clipPath id="semen-clip">
            <path d="M622.5 220 L722.5 220 L700 270 L672.5 292 L645 270 Z" />
          </clipPath>
          <clipPath id="air-clip">
            <path d="M760 220 L840 220 L820 260 L800 278 L780 260 Z" />
          </clipPath>
        </defs>

        {/* Main Weighing Indicator Panel */}
        <foreignObject x="25" y="-12" width="500" height="155">
          <div className="bg-[#0b1329]/95 border-2 border-[#00e5ff]/35 rounded-[6px] p-2.5 h-full w-full flex flex-col gap-2 select-none shadow-lg">
            {/* Header Title with animated state light */}
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-sans font-black tracking-widest text-[#00e5ff] uppercase">MONITOR TIMBANGAN UTAMA</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00ff9c] animate-pulse" />
                <span className="text-[8px] font-mono font-bold tracking-widest text-[#00ff9c] uppercase">SCADA ON</span>
              </div>
            </div>

            {/* 2x2 grid layout of components */}
            <div className="grid grid-cols-2 gap-2 flex-1">
              {[
                { key: 'pasir', label: 'PASIR', unit: 'kg' },
                { key: 'batu', label: 'BATU', unit: 'kg' },
                { key: 'semen', label: 'SEMEN', unit: 'kg' },
                { key: 'air', label: 'AIR', unit: 'kg' },
              ].map(({ key, label, unit }) => {
                const item = scales[key as MaterialType];
                return (
                  <div key={key} className="bg-[#05080c] border border-slate-800/80 rounded-[4px] p-2 flex flex-col justify-between relative overflow-hidden">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-sans font-black tracking-wide text-white uppercase">{label}</span>
                      <span className="text-[8px] font-mono font-bold text-slate-400">
                        Tgt: <span className="text-[#38bdf8] font-black">{item.target}</span> {unit}
                      </span>
                    </div>

                    <div className="flex justify-between items-baseline mt-1.5">
                      <span className={`font-mono text-xl font-black tracking-tighter leading-none ${item.isActive ? 'text-[#00ffd0] animate-pulse' : item.isComplete ? 'text-[#00ff9c]' : 'text-slate-500'}`}>
                        {item.actual.toFixed(0)} <span className="text-[9px] font-sans font-bold text-slate-600 uppercase">KG</span>
                      </span>

                      {/* Status led inside grid card */}
                      <span className={`w-2.5 h-2.5 rounded-full ${item.isActive ? 'bg-[#00ffd0] shadow-[0_0_8px_#00ffd0]' : item.isComplete ? 'bg-[#00ff9c]' : 'bg-[#1e293b]'}`} />
                    </div>

                    {/* Progress tracking line */}
                    <div className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#0d1527]">
                      <div 
                        style={{ width: `${Math.min(100, (item.actual / (item.target || 1)) * 100)}%` }}
                        className={`h-full transition-all duration-100 ${item.isComplete ? 'bg-[#00ff9c]' : item.isActive ? 'bg-[#00ffd0]' : 'bg-slate-700'}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </foreignObject>

        {/* --- AGGREGATE SECTION (LEFT) --- */}
        <g id="aggregate-bins">
          {[
            { x: 50, label: "PASIR 1", isPasir: true, active: isPasirActive },
            { x: 130, label: "PASIR 2", isPasir: true, active: false }, // Let silo 1 of Pasir do the visual active work
            { x: 210, label: "BATU 1", isPasir: false, active: isBatuActive },
            { x: 290, label: "BATU 2", isPasir: false, active: false } // Let silo 1 of Batu do the visual active work
          ].map((bin, i) => (
            <g key={bin.label}>
              <rect x={bin.x} y="175" width="70" height="100" fill="#2c3e50" stroke={theme.outline} strokeWidth="1.5" />
              <path d={`M${bin.x} 275 L${bin.x + 35} 305 L${bin.x + 70} 275`} fill="#2c3e50" stroke={theme.outline} strokeWidth="1.5" />
              <text x={bin.x + 35} y="225" textAnchor="middle" fill="#00e5ff" fontSize="10" fontWeight="bold">{bin.label}</text>
              <text x={bin.x + 35} y="245" textAnchor="middle" fill="#888" fontSize="10">100%</text>
              {/* Gate Valve: Blinks when active flow is open */}
              <rect 
                x={bin.x + 25} 
                y="305" 
                width="20" 
                height="6" 
                fill={bin.active ? theme.flow : theme.red} 
                stroke="#000" 
                className={bin.active ? "animate-pulse" : ""}
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
                      fill={bin.isPasir ? "#b45309" : "#64748b"}
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
              x: 50, 
              label: "TIMBANGAN PASIR", 
              isPasir: true, 
              isWeighing: isPasirActive, 
              isOpen: gatePasirHopperOpen, 
              clipId: "pasir-clip", 
              fillColor: "#b45309", 
              boxH: 50, 
              boxY: 385, 
              actual: scales.pasir.actual, 
              target: scales.pasir.target, 
              cx: 125 
            },
            { 
              x: 210, 
              label: "TIMBANGAN BATU", 
              isPasir: false, 
              isWeighing: isBatuActive, 
              isOpen: gateBatuHopperOpen, 
              clipId: "batu-clip", 
              fillColor: "#4b5563", 
              boxH: 50, 
              boxY: 385, 
              actual: scales.batu.actual, 
              target: scales.batu.target, 
              cx: 285 
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
                  <text x={h.cx} y="402" textAnchor="middle" fill={h.isOpen ? theme.flow : theme.red} fontSize="7.5" fontWeight="black" className={h.isOpen ? "animate-pulse" : ""}>
                    {h.isOpen ? "DISCHARGING" : "GATE CLOSED"}
                  </text>
                  <circle cx={h.cx} y="375" r="3.5" fill={h.isOpen ? theme.flow : theme.red} />
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
                        fill={h.isPasir ? "#b45309" : "#64748b"}
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
          <rect x="50" y="415" width="325" height="15" fill="#111" stroke={theme.outline} strokeWidth="1" />
          <circle cx="65" cy="422.5" r="7" stroke={theme.outline} strokeWidth="1" />
          <circle cx="360" cy="422.5" r="7" stroke={theme.outline} strokeWidth="1" />
          <motion.line 
            x1="75" y1="422.5" x2="350" y2="422.5" 
            stroke={isAggregat ? theme.flow : theme.pipe} 
            strokeWidth="3" 
            strokeDasharray="5 5"
            animate={{ strokeDashoffset: isAggregat ? [20, 0] : 0 }}
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
            stroke={isAggregat ? theme.flow : theme.pipe} 
            strokeWidth="3" 
            strokeDasharray="5 5"
            animate={{ strokeDashoffset: isAggregat ? [20, 0] : 0 }}
            transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
          />
        </g>

        {/* --- SILO SECTION (TOP RIGHT) --- */}
        <g id="silos">
          {[...Array(6)].map((_, i) => {
            const siloX = 550 + i * 45 + 15;
            const siloY = 150;
            
            return (
              <g key={i}>
                <rect x={550 + i * 45} y="30" width="30" height="100" fill="#0f1419" stroke={theme.outline} strokeWidth="1" />
                <path d={`M${550 + i * 45} 130 L${550 + i * 45 + 15} 150 L${550 + i * 45 + 30} 130`} fill="#0f1419" stroke={theme.outline} strokeWidth="1" />
                
                {/* Cement Flow Path (Orthogonal lines with elbows) */}
                <motion.path 
                  d={`M${siloX} ${siloY} V200 H${650 + (i * 10)} V220`}
                  fill="none" 
                  stroke={isSemen ? theme.flow : theme.pipe} 
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  animate={{ strokeDashoffset: isSemen ? [20, 0] : 0 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />

                {/* Butterfly Valve at cone tip */}
                <g transform={`translate(${siloX}, ${siloY})`}>
                  <path 
                    d="M-6 -4 L6 4 V-4 L-6 4 Z" 
                    fill={isSemen ? theme.flow : theme.red} 
                    stroke="#000" 
                    strokeWidth="1" 
                  />
                  <circle r="2" fill="#000" />
                </g>

                <text x={siloX} y="175" textAnchor="middle" fill="#888" fontSize="7" fontWeight="bold">SILO {i + 1}</text>
                <text x={siloX} y="55" textAnchor="middle" fill={theme.outline} fontSize="8" fontWeight="bold">0.0</text>
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
          {mixerShaftActive && (
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
          <g id="twin-shafts" opacity={mixerShaftActive ? 1 : 0.3}>
            {/* Left Shaft */}
            <g transform="translate(637.5, 400)">
              <circle r="25" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
              <motion.g
                animate={mixerShaftActive ? { rotate: -360 } : { rotate: 0 }}
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
                animate={mixerShaftActive ? { rotate: 360 } : { rotate: 0 }}
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

          <text x="677.5" y="434" textAnchor="middle" fill="#00e5ff" fontSize="9" fontWeight="black" letterSpacing="1" className={mixerShaftActive ? "animate-pulse" : ""}>
            {mixerShaftActive ? "TWIN SHAFT SPINNING" : "MIXER STANDBY"}
          </text>
          
          {/* Gear/Motor on side */}
          <circle cx="562.5" cy="400" r="15" fill="#333" stroke={theme.outline} />
          <circle cx="562.5" cy="400" r="5" fill={mixerShaftActive ? theme.flow : "#555"} />

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
                  x={-((mixerDoorPercent / 100) * 11)} 
                  y="1" 
                  width={(mixerDoorPercent / 100) * 22} 
                  height="36"
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
                    x1={-10 + (idx * 6)} 
                    y1={1} 
                    x2={-10 + (idx * 6)} 
                    y2={37}
                    stroke="#a1a1aa" 
                    strokeWidth={1 + (mixerDoorPercent / 100) * 1.5}
                    strokeDasharray="4 4"
                    animate={{ strokeDashoffset: [0, -12] }}
                    transition={{ duration: 0.2, repeat: Infinity, ease: "linear", delay: idx * 0.05 }}
                  />
                ))}

                {/* Splashes at the outlet input of truck mixer */}
                <g transform="translate(0, 37)">
                  {[...Array(5)].map((_, idx) => (
                    <motion.circle
                      key={idx}
                      cx={-8 + idx * 4 + Math.sin(idx) * 2}
                      cy={2}
                      r="1.5"
                      fill="#71717a"
                      animate={{ cy: [2, 10], cx: [-8 + idx * 4, -12 + idx * 6], opacity: [1, 0] }}
                      transition={{ duration: 0.25, repeat: Infinity, delay: idx * 0.04, ease: "easeOut" }}
                    />
                  ))}
                </g>
              </g>
            )}

            {/* Concrete Output indicators */}
            <text y="48" textAnchor="middle" fill={concreteDischargeActive ? theme.flow : "#475569"} fontSize="7.5" fontWeight="black" className={concreteDischargeActive ? "animate-pulse" : ""}>
              {concreteDischargeActive ? mixerDoorStateText : "CLOSED"}
            </text>
            <circle cy="38" r="3" fill={concreteDischargeActive ? theme.flow : theme.red} />
          </g>
        </g>

        {/* Mixer Truck */}
        <g 
          id="truck" 
          transform="translate(615, 495) scale(0.68)" 
          onClick={onTruckClick}
          className="cursor-pointer"
        >
          <image 
            href={truckImage || "/src/public/truck.png"} 
            x="-12.5" 
            y="-10" 
            width="245" 
            height="155" 
            preserveAspectRatio="xMidYMid meet"
          />
        </g>

        {/* Industrial PLC control button panel on the right empty space */}
        <foreignObject x="795" y="302" width="190" height="338">
          <div className="bg-[#0b1329]/95 border-2 border-[#00e5ff]/35 rounded-[6px] p-2.5 h-full w-full flex flex-col gap-2 select-none shadow-2xl relative overflow-hidden text-slate-100">
            {/* Panel header with dynamic pulse led */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5 px-0.5">
              <span className="text-[10px] font-sans font-black tracking-widest text-[#00e5ff] uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse inline-block" />
                PLC CONTROL PANEL
              </span>
              <span className="text-[8px] font-mono font-bold text-slate-500 uppercase">ONLINE</span>
            </div>

            {/* 2 column controller layout */}
            <div className="grid grid-cols-2 gap-2 flex-1 min-h-0">
              {/* Left column: Start, Stop, Auto ON (neat, tight, industrial alignment) */}
              <div className="flex flex-col gap-2.5 justify-start">
                {/* Circular Start & Stop Row */}
                <div className="flex items-center justify-between gap-1.5 h-[42px]">
                  <button 
                    onClick={startBatch}
                    disabled={isRunning}
                    style={{ textShadow: !isRunning ? "0 0 4px rgba(255,255,255,0.5)" : "none" }}
                    className={`w-[41px] h-[41px] rounded-full flex items-center justify-center font-sans font-black text-[10px] uppercase transition-all duration-150 shadow-md ${
                      isRunning 
                        ? 'bg-[#153e25]/60 text-[#15803d]/40 border-[2.5px] border-[#15803d]/30 cursor-not-allowed' 
                        : 'bg-[#22c55e] hover:bg-[#16a34a] text-white border-[2.5px] border-[#4ade80] shadow-[0_0_10px_rgba(34,197,94,0.4)] hover:scale-105 active:scale-95 cursor-pointer'
                    }`}
                  >
                    Start
                  </button>
                  <button 
                    onClick={stopBatch}
                    disabled={!isRunning}
                    className={`w-[41px] h-[41px] rounded-full flex items-center justify-center font-sans font-black text-[10px] uppercase transition-all duration-150 shadow-md ${
                      isRunning 
                        ? 'bg-[#ef4444] hover:bg-[#dc2626] text-white border-[2.5px] border-[#f87171] shadow-[0_0_10px_rgba(239,68,68,0.4)] hover:scale-105 active:scale-95 cursor-pointer' 
                        : 'bg-[#4c0519]/70 text-[#9f1239]/50 border-[2.5px] border-[#9f1239]/20 cursor-not-allowed'
                    }`}
                  >
                    STOP
                  </button>
                </div>

                {/* Auto rect button - exactly identical to QUARRY AGGREGATE size, style, and outline */}
                <button
                  onClick={() => setIsAuto(!isAuto)}
                  className={`rounded-[5px] px-1.5 py-1 flex flex-col items-center justify-center text-center transition-all duration-150 border-[1.5px] h-[42px] cursor-pointer ${
                    isAuto
                      ? 'bg-[#22c55e] hover:bg-[#16a34a] text-white border-[#4ade80] shadow-[0_0_8px_rgba(34,197,94,0.35)]'
                      : 'bg-[#1e293b]/55 hover:bg-slate-700/80 text-slate-400 border-slate-700/50'
                  }`}
                >
                  <Power size={11} className={isAuto ? "animate-pulse" : ""} />
                  <span className="text-[7.5px] font-sans font-black tracking-wide leading-tight uppercase mt-0.5">AUTO: {isAuto ? 'ON' : 'OFF'}</span>
                </button>
              </div>

              {/* Right column: Moisture, Quarry, Print, Help */}
              <div className="flex flex-col gap-2.5 justify-start">
                {/* MOISTURE CONTROL */}
                <button
                  onClick={() => setMoistureControl(!moistureControl)}
                  className={`rounded-[5px] px-1.5 py-1 flex flex-col items-center justify-center text-center transition-all duration-150 border-[1.5px] h-[42px] cursor-pointer ${
                    moistureControl
                      ? 'bg-[#0d9488] hover:bg-[#0f766e] text-white border-[#2dd4bf] shadow-[0_0_8px_rgba(13,148,136,0.35)]'
                      : 'bg-[#0f172a]/60 hover:bg-slate-800/80 text-slate-400 border-slate-800/60'
                  }`}
                >
                  <span className="text-[7.5px] font-sans font-black tracking-wide leading-tight uppercase">MOISTURE</span>
                  <span className="text-[7.5px] font-sans font-black tracking-wide leading-tight uppercase mt-0.5">CONTROL</span>
                </button>

                {/* QUARRY AGGREGATE */}
                <button
                  onClick={() => setQuarryAggregate(!quarryAggregate)}
                  className={`rounded-[5px] px-1.5 py-1 flex flex-col items-center justify-center text-center transition-all duration-150 border-[1.5px] h-[42px] cursor-pointer ${
                    quarryAggregate
                      ? 'bg-[#2563eb] hover:bg-[#1d4ed8] text-white border-[#60a5fa] shadow-[0_0_8px_rgba(37,99,235,0.35)]'
                      : 'bg-[#0f172a]/60 hover:bg-slate-800/80 text-slate-400 border-slate-800/60'
                  }`}
                >
                  <span className="text-[7.5px] font-sans font-black tracking-wide leading-tight uppercase">QUARRY</span>
                  <span className="text-[7.5px] font-sans font-black tracking-wide leading-tight uppercase mt-0.5">AGGREGATE</span>
                </button>

                {/* Print + Help Row */}
                <div className="flex items-center gap-1.5 h-[34px]">
                  {/* Print card */}
                  <div 
                    onClick={() => setIsPrint(!isPrint)}
                    className={`flex-1 rounded-[5px] px-1.5 h-full flex items-center justify-center gap-1 border transition-all duration-150 cursor-pointer select-none ${
                      isPrint 
                        ? 'bg-[#1e293b] border-slate-600'
                        : 'bg-[#0f172a]/40 border-slate-800 text-slate-500'
                    }`}
                  >
                    <input 
                      type="checkbox" 
                      checked={isPrint} 
                      onChange={() => {}} 
                      className="w-3 h-3 accent-[#2563eb] cursor-pointer mr-0.5 shrink-0"
                    />
                    <span className="text-[9px] font-sans font-black text-white shrink-0">Print</span>
                  </div>

                  {/* Help "?" Circle */}
                  <button
                    onClick={onHelpClick}
                    className="w-8 h-8 rounded-full bg-[#1d4ed8] hover:bg-[#2563eb] border border-blue-500/30 flex items-center justify-center text-white cursor-pointer hover:scale-105 active:scale-95 shadow-md flex-shrink-0"
                  >
                    <span className="text-[12px] font-sans font-black">?</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </foreignObject>
      </svg>
    </div>
  );
};

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
  const [productionState, setProductionState] = useState<'IDLE' | 'WEIGHING' | 'READY TO DISCHARGE' | 'DISCHARGING' | 'MIXING' | 'WAITING MIXER EMPTY' | 'DISCHARGING CONCRETE' | 'COMPLETE'>('IDLE');
  const [currentCycle, setCurrentCycle] = useState<number>(0);
  const [totalCycles, setTotalCycles] = useState<number>(0);
  const [volumePerCycle, setVolumePerCycle] = useState<number>(0);
  
  // Weighing controller states
  const [weighingCycle, setWeighingCycle] = useState<number>(0);
  const [isWeighingActive, setIsWeighingActive] = useState(false);
  
  // Solenoid / Gate indicators
  const [gatePasirSiloOpen, setGatePasirSiloOpen] = useState(false);
  const [gateBatuSiloOpen, setGateBatuSiloOpen] = useState(false);
  const [screwSemenActive, setScrewSemenActive] = useState(false);
  const [valveWaterActive, setValveWaterActive] = useState(false);
  const [gatePasirHopperOpen, setGatePasirHopperOpen] = useState(false);
  const [gateBatuHopperOpen, setGateBatuHopperOpen] = useState(false);
  const [gateSemenHopperOpen, setGateSemenHopperOpen] = useState(false);
  const [gateWaterHopperOpen, setGateWaterHopperOpen] = useState(false);
  
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
  const [batchId, setBatchId] = useState("");
  const [klaksonActive, setKlaksonActive] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);

  // Admin Login and Session state
  const [currentView, setCurrentView] = useState<'hmi' | 'admin-login' | 'admin-dashboard'>(() => {
    const session = localStorage.getItem('admin_session');
    return session === 'true' ? 'admin-dashboard' : 'hmi';
  });

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
  const [selectedRecipe, setSelectedRecipe] = useState(RECIPES[0]);
  const [isDone, setIsDone] = useState(false);
  const [truckImage, setTruckImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTruckImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setTruckImage(reader.result);
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
    setProductionState('WEIGHING');
    setMixerStatusText('WAITING MATERIAL');
    setMixerDoorPercent(0);
    setMixerDoorStateText("CLOSED");
    setConcreteDischargeActive(false);
    setMixerShaftActive(true);
    setBatchProgress(0);

    // Sound start horn (1 second)
    playKlakson(1000);

    setIsRunning(true);
    setIsDone(false);
  };

  const stopBatch = () => {
    setIsRunning(false);
    setProductionState('IDLE');
    setIsWeighingActive(false);
    
    // Shut off actuators
    setGatePasirSiloOpen(false);
    setGateBatuSiloOpen(false);
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

  // MASTER TICK PLC SIMULATOR TIMER LOOP (100ms intervals)
  useEffect(() => {
    if (isRunning) {
      // Fluctuate Ampere on Twin shaft
      setAmpere(parseFloat((34.5 + Math.random() * 4.2).toFixed(1)));
      setSlump(parseFloat((11.5 + Math.random() * 1.5).toFixed(1)));

      simIntervalRef.current = setInterval(() => {
        
        // --- 1. WEIGHING ENGINE STATE (TICKING IN REALTIME) ---
        if (weighingActiveRef.current) {
          setScales(prev => {
            const updated = { ...prev };
            let allComplete = true;

            // Sand (Pasir)
            if (updated.pasir.actual < updated.pasir.target) {
              const inc = (8 + Math.random() * 6) * 0.1; // 0.8-1.4kg per tick (exquisite slow motion)
              updated.pasir.actual = Math.min(updated.pasir.target, updated.pasir.actual + inc);
              updated.pasir.isActive = true;
              allComplete = false;
              setGatePasirSiloOpen(true);
            } else {
              updated.pasir.isActive = false;
              updated.pasir.isComplete = true;
              setGatePasirSiloOpen(false);
            }

            // Stone (Batu)
            if (updated.batu.actual < updated.batu.target) {
              const inc = (10 + Math.random() * 8) * 0.1; // 1.0-1.8kg per tick (exquisite slow motion)
              updated.batu.actual = Math.min(updated.batu.target, updated.batu.actual + inc);
              updated.batu.isActive = true;
              allComplete = false;
              setGateBatuSiloOpen(true);
            } else {
              updated.batu.isActive = false;
              updated.batu.isComplete = true;
              setGateBatuSiloOpen(false);
            }

            // Cement (Semen)
            if (updated.semen.actual < updated.semen.target) {
              const inc = (5 + Math.random() * 4) * 0.1; // 0.5-0.9kg per tick (exquisite slow motion)
              updated.semen.actual = Math.min(updated.semen.target, updated.semen.actual + inc);
              updated.semen.isActive = true;
              allComplete = false;
              setScrewSemenActive(true);
            } else {
              updated.semen.isActive = false;
              updated.semen.isComplete = true;
              setScrewSemenActive(false);
            }

            // Water (Air & Aditif)
            if (updated.air.actual < updated.air.target) {
              const inc = (3 + Math.random() * 2) * 0.1; // 0.3-0.5 kg per tick (exquisite slow motion)
              updated.air.actual = Math.min(updated.air.target, updated.air.actual + inc);
              updated.air.isActive = true;
              allComplete = false;
              setValveWaterActive(true);
            } else {
              updated.air.isActive = false;
              updated.air.isComplete = true;
              setValveWaterActive(false);
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

            // Conveyor cleaning delay: bottom conveyor stays on while pasir or gravel are still moving down
            const anyAggMoving = nextScales.pasir.actual > 0 || nextScales.batu.actual > 0;
            setConveyorBottomActive(anyAggMoving);

            // Once everything is fully drained to 0 in scales scales hoppers
            const allEmpty = nextScales.pasir.actual === 0 && 
                             nextScales.batu.actual === 0 && 
                             nextScales.semen.actual === 0 && 
                             nextScales.air.actual === 0;

            if (allEmpty) {
              // Aggregate conveyor belt clearing lag
              setConveyorBottomActive(false);
              setConveyorUpperActive(false);
              
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

          // Compute overall batch progress
          setCurrentCycle(cur => {
            setTotalCycles(tot => {
              const baseProgress = ((cur - 1) / tot) * 100;
              const mixWeight = 45; // mixing portion completed
              const dSecondsTotal = 2 + 6 + 3 + 5 + 3 + 10 + 5; // 34 seconds discharge sequencer
              const dSecElapsed = Math.min(dSecondsTotal, (step === 1 ? dTime :
                                           step === 2 ? 2000 + dTime :
                                           step === 3 ? 8000 + dTime :
                                           step === 4 ? 11000 + dTime :
                                           step === 5 ? 16000 + dTime :
                                           step === 6 ? 19000 + dTime :
                                           29000 + dTime) / 1000);
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
            
            if (dTime >= 5000) {
              // Solenoid closing concludes!
              setMixerDoorPercent(0);
              setMixerDoorStateText("CLOSED");
              setConcreteDischargeActive(false);

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
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee] animate-pulse" />
            <span>SCADA SYSTEM</span>
          </div>
          
          {/* Login Operator */}
          <button 
            onClick={() => alert("Operator: John Doe (Logged In)")} 
            className="bg-[#1e293b]/70 hover:bg-[#334155] border border-slate-800 rounded-full px-2.5 h-7 flex items-center gap-1.5 text-[10px] text-slate-300 transition-colors uppercase font-bold whitespace-nowrap"
          >
            <User size={10} className="text-cyan-400" />
            <span>Operator</span>
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
        onLogout={() => {
          localStorage.removeItem('admin_session');
          setCurrentView('admin-login');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 font-sans flex flex-col p-2">
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
              recipes={RECIPES}
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
                  <HelpCircle size={22} className="animate-pulse" />
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

        {/* Inner layout grid */}
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          
          {/* MAIN GRAPHICS AREA (Indicator panels, diagram, and controls) */}
          <div className="flex-1 flex flex-col gap-3 min-h-0">
            
             {/* SCADA CANVAS GRAPHICS AREA (Keep SCADA exact to الصورة 1) */}
            <div className="flex-1 bg-[#05080c] border border-slate-800 rounded-[4px] relative overflow-hidden flex items-center justify-center p-2.5">
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
                gateBatuSiloOpen={gateBatuSiloOpen}
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
              />
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
