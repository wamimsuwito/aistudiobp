import React, { useState, useEffect, useRef } from "react";
import { 
  Tablet, 
  Lock, 
  Unlock, 
  Wifi, 
  WifiOff, 
  ShieldAlert, 
  AlertTriangle 
} from "lucide-react";

interface RoundButtonProps {
  label: string;
  isActive: boolean;
  isDisabled: boolean;
  onClick: () => void;
  colorType?: "green" | "amber" | "red" | "blue";
}

const RoundButton: React.FC<RoundButtonProps> = ({ 
  label, 
  isActive, 
  isDisabled, 
  onClick, 
  colorType = "green" 
}) => {
  let ledBgClass = "bg-[#1f2533] border-slate-700 shadow-[inset_0_3px_5px_rgba(0,0,0,0.8)] text-slate-500";
  let glowClass = "";
  
  if (isActive && !isDisabled) {
    if (colorType === "green") {
      ledBgClass = "bg-[#00ff41] border-[#05ff62]";
      glowClass = "shadow-[0_0_15px_#10b981,_inset_0_3px_8px_rgba(255,255,255,0.7)] text-white";
    } else if (colorType === "amber") {
      ledBgClass = "bg-amber-500 border-amber-400";
      glowClass = "shadow-[0_0_15px_#f59e0b,_inset_0_3px_8px_rgba(255,255,255,0.7)] text-white";
    } else if (colorType === "red") {
      ledBgClass = "bg-rose-600 border-rose-500";
      glowClass = "shadow-[0_0_15px_#e11d48,_inset_0_3px_8px_rgba(255,255,255,0.7)] text-white";
    } else if (colorType === "blue") {
      ledBgClass = "bg-cyan-500 border-cyan-400";
      glowClass = "shadow-[0_0_15px_#06b6d4,_inset_0_3px_8px_rgba(255,255,255,0.7)] text-white";
    }
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-1.5 p-1 shrink-0">
      <button
        disabled={isDisabled}
        onClick={onClick}
        className="relative w-16 h-16 sm:w-[68px] sm:h-[68px] rounded-full flex items-center justify-center transition-all focus:outline-none select-none active:scale-95 cursor-pointer 
          border-4 border-slate-700 bg-slate-850 shadow-[2px_4px_6px_rgba(0,0,0,0.5),_inset_0_-2px_4px_rgba(0,0,0,0.4)]
          disabled:opacity-35 disabled:cursor-not-allowed group"
      >
        {/* Inner Glowing Lamp Dome */}
        <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full transition-all duration-200 relative overflow-hidden flex items-center justify-center ${ledBgClass} ${glowClass}`}>
          {/* Circular gloss effect (reflection specular) */}
          <div className="absolute top-[2px] left-[5px] w-5 sm:w-6 h-2 bg-white/25 rounded-full transform -rotate-[15deg] blur-[0.2px]" />
          <div className="absolute bottom-[2px] right-[5px] w-2 sm:w-2.5 h-1 bg-white/5 rounded-full transform -rotate-[15deg] blur-[0.5px]" />
        </div>
      </button>
      
      {/* Label underneath */}
      <span className="text-[10px] sm:text-[10.5px] font-mono tracking-wider font-extrabold text-slate-350 select-none uppercase text-center w-full min-h-[22px] flex items-center justify-center leading-tight">
        {label}
      </span>
    </div>
  );
};

export const TabletPage: React.FC = () => {
  const [deviceStates, setDeviceStates] = useState<Record<string, any>>({
    gatePasir1SiloOpen: false,
    gatePasir2SiloOpen: false,
    gatePasirHopperOpen: false,
    gateBatu1SiloOpen: false,
    gateBatu2SiloOpen: false,
    gateBatuHopperOpen: false,
    activeSiloSemen: "Silo 1",
    screwSemenActive: false,
    gateSemenHopperOpen: false,
    valveWaterActive: false,
    gateWaterHopperOpen: false,
    conveyorBottomActive: false,
    conveyorUpperActive: false,
    waitingHopperGateOpen: false,
    mixerDoorPercent: 0,
    mixerDoorStateText: "CLOSED",
    compressorActive: false,
    vibratorActive: false,
    klaksonActive: false,
    mixerShaftActive: false,
    admixInActive: false,
    admixOutActive: false,
    isAuto: false
  });

  const [mainPlantIsAuto, setMainPlantIsAuto] = useState<boolean>(false);
  const [mode, setMode] = useState<"MONITORING" | "CONTROL">("MONITORING");
  const [pinInput, setPinInput] = useState<string>("");
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [storedPin, setStoredPin] = useState<string>(() => {
    return localStorage.getItem("tablet_control_pin") || "1234";
  });
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [lastSyncTime, setLastSyncTime] = useState<string>("Menghubungkan...");
  
  const tabletWsRef = useRef<WebSocket | null>(null);

  // Setup BroadcastChannel and WebSocket for local communication
  useEffect(() => {
    const channel = new BroadcastChannel('remote_tablet_sync');
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;
    let lastActiveTime = Date.now();

    const requestInitialState = () => {
      const msg = JSON.stringify({ type: 'REQUEST_STATE' });
      try {
        channel.postMessage(msg);
      } catch (e) {}
      if (ws && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(msg);
        } catch (e) {}
      }
    };

    const handleMessage = (rawMsg: string) => {
      try {
        const data = JSON.parse(rawMsg);
        if (data.type === 'STATE_UPDATE' && data.states) {
          setMainPlantIsAuto(!!data.states.isAuto);
          const overrideStates = {
            ...data.states,
            isAuto: false
          };
          setDeviceStates(overrideStates);
          const now = new Date();
          setLastSyncTime(now.toLocaleTimeString("id-ID"));
          setIsOnline(true);
          lastActiveTime = Date.now();
        }
      } catch (err) {
        console.error("Error parsing tablet state sync msg:", err);
      }
    };

    channel.onmessage = (event) => {
      handleMessage(event.data);
    };

    const connectWS = () => {
      try {
        const host = window.location.hostname || 'localhost';
        ws = new WebSocket(`ws://${host}:3001`);
        tabletWsRef.current = ws;
        
        ws.onopen = () => {
          setIsOnline(true);
          lastActiveTime = Date.now();
          requestInitialState();
        };

        ws.onmessage = (event) => {
          handleMessage(event.data);
        };

        ws.onclose = () => {
          ws = null;
          tabletWsRef.current = null;
          // Only set online to false if we haven't received a BroadcastChannel or WS update in 6 seconds
          if (Date.now() - lastActiveTime > 6000) {
            setIsOnline(false);
          }
          reconnectTimeout = setTimeout(connectWS, 2000);
        };

        ws.onerror = () => {
          ws?.close();
        };
      } catch (err) {
        if (Date.now() - lastActiveTime > 6000) {
          setIsOnline(false);
        }
        reconnectTimeout = setTimeout(connectWS, 4000);
      }
    };

    connectWS();
    // Request state initially
    setTimeout(requestInitialState, 300);
    // Request state periodically to sync over BroadcastChannel when websocket is offline (e.g. in dev cloud environment)
    const stateInterval = setInterval(requestInitialState, 3000);

    return () => {
      channel.close();
      if (ws) ws.close();
      tabletWsRef.current = null;
      clearTimeout(reconnectTimeout);
      clearInterval(stateInterval);
    };
  }, []);

  // Publish command universally over BroadcastChannel and persistent WebSocket
  const publishCommand = (commandObj: any) => {
    const commandStr = JSON.stringify(commandObj);

    // 1. Broadcast locally to other tabs in same browser
    const channel = new BroadcastChannel('remote_tablet_sync');
    try {
      channel.postMessage(commandStr);
    } catch (e) {}
    channel.close();

    // 2. Deliver via active persistent WebSocket connection over local LAN
    try {
      if (tabletWsRef.current && tabletWsRef.current.readyState === WebSocket.OPEN) {
        tabletWsRef.current.send(commandStr);
      } else {
        // Fallback for immediate delivery if connection has dropped
        const host = window.location.hostname || 'localhost';
        const tempWs = new WebSocket(`ws://${host}:3001`);
        tempWs.onopen = () => {
          tempWs.send(commandStr);
          setTimeout(() => tempWs.close(), 100);
        };
      }
    } catch (e) {}
  };

  // Send a toggle device request to the main HMI master
  const sendToggleCommand = (deviceKey: string, valForce?: boolean) => {
    if (mode !== "CONTROL") return;

    publishCommand({
      type: "TOGGLE_DEVICE",
      deviceKey,
      valForce
    });
  };

  const handleSiloPress = (num: number) => {
    if (mode !== "CONTROL") return;
    const isThisSiloActive = deviceStates.activeSiloSemen === `Silo ${num}`;
    
    if (isThisSiloActive) {
      // Toggle screw conveyor off
      sendToggleCommand(`silo${num}`, false);
    } else {
      // First select silo on the master HMI, then turn screw on
      publishCommand({
        type: "TOGGLE_DEVICE",
        deviceKey: "selectSilo",
        valForce: num
      });
      setTimeout(() => {
        publishCommand({
          type: "TOGGLE_DEVICE",
          deviceKey: `silo${num}`,
          valForce: true
        });
      }, 120);
    }
  };

  const handlePinSubmit = () => {
    if (pinInput === storedPin || pinInput === "8888") {
      setMode("CONTROL");
      setShowPinModal(false);
      setPinInput("");
      setPinError(null);
    } else {
      setPinError("PIN SALAH! Gunakan PIN Admin terdaftar.");
    }
  };

  const getStatusOfSilo = (num: number) => {
    return deviceStates.screwSemenActive && deviceStates.activeSiloSemen === `Silo ${num}`;
  };

  return (
    <div className="min-h-screen bg-[#111622] text-slate-100 flex flex-col font-sans select-none overflow-hidden">
      
      {/* Top Header Bar */}
      <header className="h-[60px] bg-[#1a2235] border-b border-slate-800 flex items-center justify-between px-6 shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 rounded border border-slate-700/60 text-cyan-400">
            <Tablet size={22} className={isOnline ? "animate-pulse" : ""} />
          </div>
          <div>
            <h1 className="text-[13px] font-black tracking-widest uppercase text-white font-mono flex items-center gap-2">
              LISA BATCH SMART-REMOTE
              <span className="text-[9px] bg-cyan-950 px-2 py-0.5 rounded text-cyan-400 border border-cyan-800">TABLET</span>
            </h1>
            <p className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
              PT. Farika Riau Perkasa • Mobile Operator Terminal
            </p>
          </div>
        </div>

        {/* Realtime Status Alerts */}
        <div className="flex items-center gap-4">
          {mainPlantIsAuto && (
            <div className="bg-cyan-950/40 border border-cyan-800/80 px-2.5 py-1 rounded flex items-center gap-1.5 animate-pulse text-cyan-400">
              <AlertTriangle size={13} className="text-cyan-450" />
              <span className="text-[8.5px] font-mono font-black uppercase">SISTEM UTAMA: AUTO MODE ACTIVE</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#0a0f18] border border-slate-800 text-[10px] font-mono text-slate-400">
            <span>SYNC:</span>
            <span className="text-cyan-400 font-bold">{lastSyncTime}</span>
          </div>

          {/* Connection Wi-Fi Indicator */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono font-extrabold uppercase border ${
            isOnline 
              ? "bg-emerald-950/20 border-emerald-800/50 text-emerald-400" 
              : "bg-rose-950/20 border-rose-800/50 text-rose-400 animate-pulse"
          }`}>
            {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
            <span>{isOnline ? "WiFi Connected" : "WiFi Offline"}</span>
          </div>

          {/* Mode Switch button Control / Monitor */}
          <div className="bg-[#0b101c] p-1 rounded-md border border-slate-800 flex items-center">
            <button
              onClick={() => setMode("MONITORING")}
              className={`px-3 py-1 text-[9.5px] font-mono font-black uppercase transition-all rounded-[3px] cursor-pointer ${
                mode === "MONITORING"
                  ? "bg-slate-700 text-white shadow-inner font-extrabold"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Monitor
            </button>
            <button
              onClick={() => {
                if (mode === "CONTROL") {
                  setMode("MONITORING");
                } else {
                  setShowPinModal(true);
                }
              }}
              className={`px-3 py-1 text-[9.5px] font-mono font-black uppercase transition-all rounded-[3px] cursor-pointer flex items-center gap-1 ${
                mode === "CONTROL"
                  ? "bg-emerald-600 text-white font-extrabold"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {mode === "CONTROL" ? <Unlock size={11} /> : <Lock size={11} />}
              Control
            </button>
          </div>
        </div>
      </header>

      {/* Main Responsive Layout for Tablet mimicking physical controls */}
      <main className="flex-grow p-4 overflow-y-auto space-y-6">
        
        {/* UPPER MIMIC PANEL GROUP (MATERIAL INFEED & STORAGE) */}
        <div className="bg-[#121622] rounded-lg border border-slate-700/70 p-4 shadow-xl">
          <div className="flex items-center justify-between mb-4 border-b border-slate-750 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse border border-cyan-300" />
              <span className="text-xs font-mono font-extrabold text-cyan-400 tracking-wider">PANEL KENDALI MIMIK ATAS : STORAGE & BIN INFEED</span>
            </div>
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">[ SEKSI 01 - STORAGE ]</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
            
            {/* 1. CLUSTER PASIR */}
            <div className="lg:col-span-3 bg-[#191e2b] rounded-md border-2 border-slate-700/60 p-3 h-[240px] flex flex-col justify-between relative shadow-inner">
              {/* Corner screws for HMI feel */}
              <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-slate-800 border border-slate-600/35" />
              <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-slate-800 border border-slate-600/35" />
              <div className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-slate-800 border border-slate-600/35" />
              <div className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-slate-800 border border-slate-600/35" />

              <div className="text-center">
                <span className="text-[10px] font-mono font-black text-slate-400 tracking-widest uppercase">
                  SECTION 01-A : PASIR
                </span>
              </div>

              {/* pasir 1 and pasir 2 side-by-side */}
              <div className="flex justify-around items-center px-1">
                <RoundButton
                  label="pasir 1"
                  isActive={deviceStates.gatePasir1SiloOpen}
                  isDisabled={mode !== "CONTROL" || deviceStates.isAuto}
                  onClick={() => sendToggleCommand('pasir1')}
                />
                <RoundButton
                  label="pasir 2"
                  isActive={deviceStates.gatePasir2SiloOpen}
                  isDisabled={mode !== "CONTROL" || deviceStates.isAuto}
                  onClick={() => sendToggleCommand('pasir2')}
                />
              </div>

              {/* dump pasir centered below */}
              <div className="flex justify-center items-center pb-2">
                <RoundButton
                  label="dump pasir"
                  isActive={deviceStates.gatePasirHopperOpen}
                  isDisabled={mode !== "CONTROL" || deviceStates.isAuto}
                  onClick={() => sendToggleCommand('dischargePasir')}
                />
              </div>
            </div>

            {/* 2. CLUSTER BATU */}
            <div className="lg:col-span-3 bg-[#191e2b] rounded-md border-2 border-slate-700/60 p-3 h-[240px] flex flex-col justify-between relative shadow-inner">
              {/* Corner screws for HMI feel */}
              <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-slate-800 border border-slate-600/35" />
              <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-slate-800 border border-slate-600/35" />
              <div className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-slate-800 border border-slate-600/35" />
              <div className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-slate-800 border border-slate-600/35" />

              <div className="text-center">
                <span className="text-[10px] font-mono font-black text-slate-400 tracking-widest uppercase">
                  SECTION 01-B : BATU
                </span>
              </div>

              {/* batu 1 and batu 2 side-by-side */}
              <div className="flex justify-around items-center px-1">
                <RoundButton
                  label="batu 1"
                  isActive={deviceStates.gateBatu1SiloOpen}
                  isDisabled={mode !== "CONTROL" || deviceStates.isAuto}
                  onClick={() => sendToggleCommand('batu1')}
                />
                <RoundButton
                  label="batu 2"
                  isActive={deviceStates.gateBatu2SiloOpen}
                  isDisabled={mode !== "CONTROL" || deviceStates.isAuto}
                  onClick={() => sendToggleCommand('batu2')}
                />
              </div>

              {/* dump batu centered below */}
              <div className="flex justify-center items-center pb-2">
                <RoundButton
                  label="dump batu"
                  isActive={deviceStates.gateBatuHopperOpen}
                  isDisabled={mode !== "CONTROL" || deviceStates.isAuto}
                  onClick={() => sendToggleCommand('dischargeBatu')}
                />
              </div>
            </div>

            {/* 3. CLUSTER SEMEN SILO (Split Left-Right) */}
            <div className="lg:col-span-4 bg-[#191e2b] rounded-md border-2 border-slate-700/60 p-3 h-[240px] flex flex-col justify-between relative shadow-inner">
              {/* Corner screws for HMI feel */}
              <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-slate-800 border border-slate-600/35" />
              <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-slate-800 border border-slate-600/35" />
              <div className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-slate-800 border border-slate-600/35" />
              <div className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-slate-805 border border-slate-600/35" />

              <div className="text-center">
                <span className="text-[10px] font-mono font-black text-slate-400 tracking-widest uppercase">
                  SECTION 01-C : SILO SEMEN
                </span>
              </div>

              <div className="flex items-stretch h-full mt-1.5">
                {/* Left of dotted line: silo 1, silo 2, silo 4, silo 5 */}
                <div className="w-[66%] grid grid-cols-2 gap-y-1 gap-x-2 justify-items-center items-center pr-2">
                  <RoundButton
                    label="silo 1"
                    isActive={getStatusOfSilo(1)}
                    isDisabled={mode !== "CONTROL" || deviceStates.isAuto}
                    onClick={() => handleSiloPress(1)}
                    colorType={deviceStates.activeSiloSemen === "Silo 1" ? "blue" : "green"}
                  />
                  <RoundButton
                    label="silo 2"
                    isActive={getStatusOfSilo(2)}
                    isDisabled={mode !== "CONTROL" || deviceStates.isAuto}
                    onClick={() => handleSiloPress(2)}
                    colorType={deviceStates.activeSiloSemen === "Silo 2" ? "blue" : "green"}
                  />
                  <RoundButton
                    label="silo 4"
                    isActive={getStatusOfSilo(4)}
                    isDisabled={mode !== "CONTROL" || deviceStates.isAuto}
                    onClick={() => handleSiloPress(4)}
                    colorType={deviceStates.activeSiloSemen === "Silo 4" ? "blue" : "green"}
                  />
                  <RoundButton
                    label="silo 5"
                    isActive={getStatusOfSilo(5)}
                    isDisabled={mode !== "CONTROL" || deviceStates.isAuto}
                    onClick={() => handleSiloPress(5)}
                    colorType={deviceStates.activeSiloSemen === "Silo 5" ? "blue" : "green"}
                  />
                </div>

                {/* Vertical Dotted Line Division */}
                <div className="border-l-2 border-dashed border-slate-600/50 self-stretch my-2 shrink-0" />

                {/* Right of dotted line: silo 3, silo 6 */}
                <div className="w-[33%] flex flex-col justify-around items-center pl-2">
                  <RoundButton
                    label="silo 3"
                    isActive={getStatusOfSilo(3)}
                    isDisabled={mode !== "CONTROL" || deviceStates.isAuto}
                    onClick={() => handleSiloPress(3)}
                    colorType={deviceStates.activeSiloSemen === "Silo 3" ? "blue" : "green"}
                  />
                  <RoundButton
                    label="silo 6"
                    isActive={getStatusOfSilo(6)}
                    isDisabled={mode !== "CONTROL" || deviceStates.isAuto}
                    onClick={() => handleSiloPress(6)}
                    colorType={deviceStates.activeSiloSemen === "Silo 6" ? "blue" : "green"}
                  />
                </div>
              </div>
            </div>

            {/* 4. LOGISTICS TOP CLUSTER */}
            <div className="lg:col-span-2 bg-[#191e2b] rounded-md border-2 border-slate-700/60 p-3 h-[240px] flex flex-col justify-between relative shadow-inner">
              {/* Corner screws for HMI feel */}
              <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-slate-800 border border-slate-600/35" />
              <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-slate-800 border border-slate-600/35" />
              <div className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-slate-800 border border-slate-600/35" />
              <div className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-slate-800 border border-slate-600/35" />

              <div className="text-center">
                <span className="text-[10px] font-mono font-black text-slate-400 tracking-widest uppercase">
                  SECTION 01-D : AUX TOP
                </span>
              </div>

              {/* Side by side: konveyor atas, kompresor */}
              <div className="flex justify-around items-center px-1 flex-grow">
                <RoundButton
                  label="konveyor atas"
                  isActive={deviceStates.conveyorUpperActive}
                  isDisabled={mode !== "CONTROL" || deviceStates.isAuto}
                  onClick={() => sendToggleCommand('conveyorUpper')}
                />
                <RoundButton
                  label="kompresor"
                  isActive={deviceStates.compressorActive}
                  isDisabled={mode !== "CONTROL" || deviceStates.isAuto}
                  onClick={() => sendToggleCommand('compressor')}
                />
              </div>
            </div>

          </div>
        </div>

        {/* LOWER MIMIC PANEL GROUP (DISPATCH, MIXING & OUTPUT) */}
        <div className="bg-[#121622] rounded-lg border border-slate-700/70 p-4 shadow-xl">
          <div className="flex items-center justify-between mb-4 border-b border-slate-750 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse border border-emerald-300" />
              <span className="text-xs font-mono font-extrabold text-emerald-400 tracking-wider">PANEL KENDALI MIMIK BAWAH : PROSES ADONAN & PENGELUARAN</span>
            </div>
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">[ SEKSI 02 - PROCESS ]</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
            
            {/* 5. CLUSTER ADMIX */}
            <div className="lg:col-span-3 bg-[#191e2b] rounded-md border-2 border-slate-700/60 p-3 h-[240px] flex flex-col justify-between relative shadow-inner">
              {/* Corner screws for HMI feel */}
              <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-slate-800 border border-slate-600/35" />
              <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-slate-800 border border-slate-600/35" />
              <div className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-slate-800 border border-slate-600/35" />
              <div className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-slate-800 border border-slate-600/35" />

              <div className="text-center">
                <span className="text-[10px] font-mono font-black text-slate-400 tracking-widest uppercase">
                  SECTION 02-A : EXP ADMIX
                </span>
              </div>

              {/* admix in, admix out side by side */}
              <div className="flex justify-around items-center px-1 flex-grow">
                <RoundButton
                  label="admix in"
                  isActive={deviceStates.admixInActive}
                  isDisabled={mode !== "CONTROL" || deviceStates.isAuto}
                  onClick={() => sendToggleCommand('admixIn')}
                />
                <RoundButton
                  label="admix out"
                  isActive={deviceStates.admixOutActive}
                  isDisabled={mode !== "CONTROL" || deviceStates.isAuto}
                  onClick={() => sendToggleCommand('admixOut')}
                />
              </div>
            </div>

            {/* 6. CLUSTER CONVEYOR BAWAH & VIBRATOR */}
            <div className="lg:col-span-3 bg-[#191e2b] rounded-md border-2 border-slate-700/60 p-3 h-[240px] flex flex-col justify-between relative shadow-inner">
              {/* Corner screws for HMI feel */}
              <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-slate-800 border border-slate-600/35" />
              <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-slate-805 border border-slate-600/35" />
              <div className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-slate-800 border border-slate-600/35" />
              <div className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-slate-800 border border-slate-600/35" />

              <div className="text-center">
                <span className="text-[10px] font-mono font-black text-slate-400 tracking-widest uppercase">
                  SECTION 02-B : FEEDERS
                </span>
              </div>

              {/* konveyor bawah (top), vibrator (bottom) */}
              <div className="flex flex-col items-center justify-around h-full gap-2 py-2">
                <RoundButton
                  label="konveyor bawah"
                  isActive={deviceStates.conveyorBottomActive}
                  isDisabled={mode !== "CONTROL" || deviceStates.isAuto}
                  onClick={() => sendToggleCommand('conveyorBottom')}
                />
                <RoundButton
                  label="vibrator"
                  isActive={deviceStates.vibratorActive}
                  isDisabled={mode !== "CONTROL" || deviceStates.isAuto}
                  onClick={() => sendToggleCommand('vibrator')}
                />
              </div>
            </div>

            {/* 7. CLUSTER LIQUID SYSTEM & DUMP SEMEN (Divided Left-Right) */}
            <div className="lg:col-span-4 bg-[#191e2b] rounded-md border-2 border-slate-700/60 p-3 h-[240px] flex flex-col justify-between relative shadow-inner">
              {/* Corner screws for HMI feel */}
              <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-slate-800 border border-slate-600/35" />
              <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-slate-800 border border-slate-600/35" />
              <div className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-slate-805 border border-slate-600/35" />
              <div className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-slate-805 border border-slate-600/35" />

              <div className="text-center">
                <span className="text-[10px] font-mono font-black text-slate-400 tracking-widest uppercase">
                  SECTION 02-C : AIR & DISCHARGE SEMEN
                </span>
              </div>

              <div className="flex items-stretch h-full mt-2">
                {/* Left of dotted: Air timbang, dump air side-by-side */}
                <div className="w-[66%] flex justify-around items-center pr-2">
                  <RoundButton
                    label="Air timbang"
                    isActive={deviceStates.valveWaterActive}
                    isDisabled={mode !== "CONTROL" || deviceStates.isAuto}
                    onClick={() => sendToggleCommand('valveIsiAir')}
                  />
                  <RoundButton
                    label="dump air"
                    isActive={deviceStates.gateWaterHopperOpen}
                    isDisabled={mode !== "CONTROL" || deviceStates.isAuto}
                    onClick={() => sendToggleCommand('dischargeAir')}
                  />
                </div>

                {/* Vertical Dotted Line Division */}
                <div className="border-l-2 border-dashed border-slate-600/50 self-stretch my-2 shrink-0" />

                {/* Right of dotted: dump semen lower down */}
                <div className="w-[33%] flex items-end justify-center pl-2 pb-6">
                  <RoundButton
                    label="dump semen"
                    isActive={deviceStates.gateSemenHopperOpen}
                    isDisabled={mode !== "CONTROL" || deviceStates.isAuto}
                    onClick={() => sendToggleCommand('dischargeSemen')}
                  />
                </div>
              </div>
            </div>

            {/* 8. CLUSTER MIXER CONTROL BLOCK */}
            <div className="lg:col-span-2 bg-[#191e2b] rounded-md border-2 border-slate-700/60 p-3 h-[240px] flex flex-col justify-between relative shadow-inner">
              {/* Corner screws for HMI feel */}
              <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-slate-805 border border-slate-600/35" />
              <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-slate-800 border border-slate-600/35" />
              <div className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-slate-800 border border-slate-600/35" />
              <div className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-slate-800 border border-slate-600/35" />

              <div className="text-center">
                <span className="text-[10px] font-mono font-black text-slate-400 tracking-widest uppercase">
                  SECTION 02-D : MIX UNIT
                </span>
              </div>

              <div className="flex flex-col justify-center flex-grow py-1 space-y-1">
                {/* Row 1: mixer normal green indicator, klakson amber warn button */}
                <div className="flex justify-around items-center">
                  <RoundButton
                    label="mixer"
                    isActive={deviceStates.mixerShaftActive}
                    isDisabled={mode !== "CONTROL" || deviceStates.isAuto}
                    onClick={() => sendToggleCommand('mixer')}
                  />
                  <RoundButton
                    label="klakson"
                    isActive={deviceStates.klaksonActive}
                    isDisabled={mode !== "CONTROL" || deviceStates.isAuto}
                    onClick={() => sendToggleCommand('klakson')}
                    colorType="amber"
                  />
                </div>

                {/* Row 2: pintu mix buka (green/ON), pintu mix tutup (red/CLOSED) */}
                <div className="flex justify-around items-center">
                  <RoundButton
                    label="pintu mix buka"
                    isActive={deviceStates.mixerDoorPercent > 0}
                    isDisabled={mode !== "CONTROL" || deviceStates.isAuto}
                    onClick={() => sendToggleCommand('mixerDischargeGate', true)}
                  />
                  <RoundButton
                    label="pintu mix tutup"
                    isActive={deviceStates.mixerDoorPercent === 0}
                    isDisabled={mode !== "CONTROL" || deviceStates.isAuto}
                    onClick={() => sendToggleCommand('mixerDischargeGate', false)}
                    colorType="red"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Footer copyright label */}
      <footer className="h-[36px] bg-[#1a2235] border-t border-slate-800 flex items-center justify-between px-6 text-[8px] font-mono text-slate-500 uppercase shrink-0">
        <span>GATEWAY ROUTER: LOCAL WIRELESS AP</span>
        <span>LISA PLANT CONTROL SYSTEM v3.4</span>
      </footer>

      {/* LOCK / PIN MODAL COMPONENT */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#1a2235] border border-slate-800 w-full max-w-sm rounded-[6px] shadow-2xl p-6 space-y-4">
            
            <div className="text-center space-y-2">
              <div className="mx-auto w-10 h-10 bg-slate-900/60 border border-slate-805 rounded-full flex items-center justify-center text-cyan-400">
                <Lock size={18} />
              </div>
              <h3 className="text-sm font-sans font-black text-slate-100 uppercase tracking-widest">
                VERIVIKASI PIN OPERATOR
              </h3>
              <p className="text-[10px] font-mono text-slate-400 uppercase">
                Masukkan PIN manual untuk memisahkan mode monitoring & mengaktifkan kendali relai.
              </p>
            </div>

            {pinError && (
              <div className="p-2.5 bg-rose-950/30 border border-rose-900/70 text-[10px] font-mono text-rose-400 rounded text-center font-bold uppercase">
                {pinError}
              </div>
            )}

            <div className="space-y-1.5 text-left font-sans">
              <label className="text-[10.5px] font-extrabold text-cyan-400 tracking-wider">MASUKKAN PIN TABLET</label>
              <input
                type="password"
                maxLength={8}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="****"
                className="w-full text-center bg-[#0d121f] text-[#00ffd0] tracking-[1em] text-xl font-bold py-2 border border-slate-800 rounded focus:border-[#00ffd0] focus:outline-none outline-none font-mono placeholder:tracking-normal placeholder:text-slate-700"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handlePinSubmit();
                }}
              />
            </div>

            <div className="flex gap-2 font-mono pt-2">
              <button
                onClick={() => {
                  setShowPinModal(false);
                  setPinInput("");
                  setPinError(null);
                }}
                className="w-1/2 py-2 bg-slate-800 hover:bg-slate-750 text-slate-350 hover:text-white rounded text-[10.5px] font-bold uppercase transition-all"
              >
                Batal
              </button>
              <button
                onClick={handlePinSubmit}
                className="w-1/2 py-2 bg-[#00ffd0] hover:bg-[#00e5ff] text-black rounded text-[10.5px] font-black uppercase transition-all shadow-md"
              >
                Konfirmasi
              </button>
            </div>
            
            <div className="text-center">
              <span className="text-[7.5px] font-mono text-slate-500 uppercase">
                DEFAULT PIN SEED: 1234 atau 8888
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
