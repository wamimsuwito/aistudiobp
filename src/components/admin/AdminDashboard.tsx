import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { DashboardCards } from "./DashboardCards";
import { ChartPanel } from "./ChartPanel";
import { SystemStatus } from "./SystemStatus";
import { RelayConfigView } from "./relay-config/RelayConfigView";
import { MixingSequenceConfig, MixingSequence } from "./MixingSequenceConfig";
import { SettingComPort } from "./SettingComPort";
import { JogingMaterial } from "./JogingMaterial";
import { SlumpCalibration } from "./SlumpCalibration";
import { JobMixFormula } from "./JobMixFormula";
import { UserManagement } from "./UserManagement";
import {
  BookOpen,
  Layout,
  Settings,
  Cpu,
  Tv,
  Users2,
  AlertOctagon,
  FileCheck,
  Zap,
  Clock,
  Wrench,
  Compass,
  Database
} from "lucide-react";

interface BatchLog {
  id: string;
  recipeName: string;
  volume: number;
  timestamp: string;
}

interface AdminDashboardProps {
  onLogout: () => void;
  logs: BatchLog[];
  mixingSequence: MixingSequence;
  setMixingSequence: React.Dispatch<React.SetStateAction<MixingSequence>>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onLogout,
  logs,
  mixingSequence,
  setMixingSequence
}) => {
  const [activeMenu, setActiveMenu] = useState("Dashboard");

  const [currentUser, setCurrentUser] = useState<any>(() => {
    const saved = localStorage.getItem("batching_plant_active_user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {}
    }
    return { nama: "Administrator", nik: "12001", jabatan: "Admin" };
  });

  // Keep state sync in case user is updated inside user management
  useEffect(() => {
    const handleSync = () => {
      const saved = localStorage.getItem("batching_plant_active_user");
      if (saved) {
        try {
          setCurrentUser(JSON.parse(saved));
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

  const RESTRICTED_ADMIN_MENUS = [
    "Manajemen User",
    "Setting Com dan Port",
    "Pengaturan Relay & Pintu Mixer",
    "Urutan Mixing",
    "Penamaan BP",
    "Pengaturan Perusahaan",
    "Kalibrasi Slump"
  ];

  // Helper to render Access Denied SCADA block
  const renderAccessDenied = (menuName: string) => {
    return (
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="bg-[#150a0f]/90 border-2 border-rose-500/50 rounded-[6px] p-6 flex flex-col items-center justify-center text-center overflow-hidden max-w-md w-full shadow-[0_0_25px_rgba(239,68,68,0.2)] relative">
          {/* Neon border strip */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-pink-600 to-rose-500" />
          
          <div className="p-4 bg-rose-950/40 border border-rose-500/30 rounded-full text-rose-500 animate-pulse mb-4">
            <AlertOctagon size={32} />
          </div>

          <h4 className="text-xs font-sans font-black tracking-widest text-[#ef4444] uppercase">
            AKSES DITOLAK: PRIVILEGE ADMIN DIBUTUHKAN
          </h4>
          <span className="text-[8px] font-mono font-bold text-rose-300 bg-rose-950 border border-rose-800/40 px-2 py-0.5 mt-2 rounded uppercase tracking-wider">
            Otoritas Terbatas [ Operator ]
          </span>

          <div className="mt-5 p-3.5 bg-slate-950/95 border border-slate-900 rounded-md text-left w-full space-y-2.5">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-slate-500 uppercase">Nama:</span>
              <span className="text-slate-200 font-bold uppercase">{currentUser?.nama || "Unknown User"}</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono border-t border-slate-900 pt-2">
              <span className="text-slate-500 uppercase">NIK Karyawan:</span>
              <span className="text-cyan-400 font-bold">{currentUser?.nik || "12000"}</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono border-t border-slate-900 pt-2">
              <span className="text-slate-500 uppercase">Status Role:</span>
              <span className="text-[#ef4444] font-extrabold uppercase">{currentUser?.jabatan || "Operator"}</span>
            </div>
          </div>

          <p className="text-[9.5px] font-mono text-slate-400 uppercase leading-relaxed mt-5">
            Akun Operator Anda dibatasi dan tidak diizinkan membuka menu "{menuName}". Setelan sensitif mesin PLC hanya dapat dimodifikasi oleh Administrator Utama.
          </p>
        </div>
      </div>
    );
  };

  // Calculate live statistics based on real HMI batch logs if any exist
  const totalBatch = logs.length;
  const totalVolume = logs.reduce((acc, curr) => acc + curr.volume, 0);

  // Helper to render dynamic view based on sidebar selection
  const renderContent = () => {
    // Check access restriction
    if (currentUser?.jabatan === "Operator" && RESTRICTED_ADMIN_MENUS.includes(activeMenu)) {
      return renderAccessDenied(activeMenu);
    }

    switch (activeMenu) {
      case "Dashboard":
        return (
          <div className="flex-1 flex flex-col gap-4 min-h-0 overflow-hidden">
            {/* Top Stat Level Cards */}
            <DashboardCards
              totalBatch={totalBatch}
              totalVolume={totalVolume}
              totalCustomer={totalBatch > 0 ? 1 : 0}
              isSystemOnline={true}
            />

            {/* Middle Graphs/Chart row */}
            <ChartPanel logs={logs} />

            {/* Bottom Status panel */}
            <SystemStatus username={currentUser?.nama || "Guest Operator"} role={currentUser?.jabatan || "Operator"} />
          </div>
        );

      case "Penamaan BP":
        return (
          <div className="flex-1 bg-[#0b1329]/80 border border-[#1e293b]/70 rounded-[6px] p-6 flex flex-col justify-between overflow-hidden">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 text-[#00e5ff]">
                <Settings size={20} className="animate-spin" />
                <h4 className="text-sm font-sans font-black tracking-widest uppercase">
                  PENGATURAN PENAMAAN BATCHING PLANT
                </h4>
              </div>
              <p className="text-[10px] font-mono text-slate-405 uppercase">
                Ubah identitas system HMI dan Header yang ditayangkan pada Monitor Utama.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-sans font-bold text-slate-400 uppercase">Nama Perusahaan</span>
                  <input
                    type="text"
                    defaultValue="PT. FARIKA RIAU PERKASA"
                    disabled
                    className="bg-[#05080e] border border-slate-800 text-slate-300 p-2.5 rounded-[4px] text-xs font-mono font-bold cursor-not-allowed uppercase"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-sans font-bold text-slate-400 uppercase">Nama Batching Plant</span>
                  <input
                    type="text"
                    defaultValue="BATCHING PLANT BP-01 PKU"
                    disabled
                    className="bg-[#05080e] border border-slate-800 text-slate-300 p-2.5 rounded-[4px] text-xs font-mono font-bold cursor-not-allowed uppercase"
                  />
                </div>
              </div>
            </div>

            <div className="bg-[#1e1e10]/30 border-2 border-amber-500/30 rounded-[4px] p-3 flex items-start gap-2.5">
              <AlertOctagon size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <div className="flex flex-col text-left">
                <span className="text-[9.5px] font-sans font-black text-amber-500 uppercase">HARDWARE INTERLOCK ACTIVE</span>
                <span className="text-[8.5px] font-mono text-slate-400 uppercase mt-1 leading-relaxed">
                  Konfigurasi penamaan terkunci oleh PLC hardware key. Hubungi vendor teknisi lapang untuk membuka gembok.
                </span>
              </div>
            </div>
          </div>
        );

      case "Job Mix Formula":
        return (
          <JobMixFormula />
        );

      case "Manajemen User":
        return (
          <UserManagement />
        );

      case "Urutan Mixing":
        return (
          <MixingSequenceConfig
            mixingSequence={mixingSequence}
            setMixingSequence={setMixingSequence}
          />
        );

      case "Pengaturan Relay & Pintu Mixer":
        return <RelayConfigView />;

      case "Setting Com dan Port":
        return (
          <SettingComPort />
        );

      case "Joging Material":
        return (
          <JogingMaterial />
        );

      case "Kalibrasi Slump":
        return (
          <SlumpCalibration />
        );

      default:
        return (
          <div className="flex-1 bg-[#0b1329]/80 border border-[#1e293b]/70 rounded-[6px] p-6 flex flex-col items-center justify-center text-center overflow-hidden">
            <Wrench size={36} className="text-cyan-400 opacity-60 animate-bounce" />
            <span className="text-[12px] font-sans font-black text-[#00e5ff] tracking-widest uppercase mt-4">
              KONTROL PANEL [{activeMenu.toUpperCase()}]
            </span>
            <span className="text-[10px] font-mono text-slate-400 uppercase mt-2 max-w-sm leading-relaxed">
              Modul setelan admin ini sedang berada dalam masa sinkronisasi atau penyesuaian hardware pembacaan PLC internal.
            </span>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[250] bg-[#070b13] p-3 flex flex-col h-screen select-none font-sans overflow-hidden">
      
      {/* Top Header Panel */}
      <div className="h-[48px] bg-[#0c1220] border border-slate-800/80 rounded-[6px] flex items-center justify-between px-4 mb-3 shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <Layout size={18} className="text-[#00e5ff] drop-shadow-[0_0_5px_rgba(0,229,255,0.4)]" />
          <span className="text-[12px] font-sans font-black tracking-widest text-white uppercase flex items-center gap-2">
            Batch Plant HMI - Admin Panel
            <span className="text-[7.5px] font-mono font-bold text-cyan-400 bg-cyan-900/45 border border-cyan-800/50 px-1.5 py-0.5 rounded-[3.5px] uppercase select-none tracking-normal">
              Admin Mode
            </span>
          </span>
        </div>

        {/* Current visual active menu breadcrumb */}
        <div className="flex items-center gap-1.5 font-mono text-[9px] text-slate-400 uppercase font-black bg-slate-900/60 px-2 py-1 rounded-[4px] border border-slate-850">
          <Compass size={10} className="text-cyan-400" />
          <span>SYS</span>
          <span className="text-slate-600 font-bold">&gt;</span>
          <span className="text-[#00ffd0]">{activeMenu}</span>
        </div>
      </div>

      {/* Main Dual-Layout View */}
      <div className="flex-1 flex gap-3 min-h-0 overflow-hidden">
        {/* Left Side menu Bar */}
        <Sidebar
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          onLogout={onLogout}
        />

        {/* Right Dynamic Contents Panel Container */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};
