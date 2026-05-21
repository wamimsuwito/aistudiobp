import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { DashboardCards } from "./DashboardCards";
import { ChartPanel } from "./ChartPanel";
import { SystemStatus } from "./SystemStatus";
import { RelayConfigView } from "./relay-config/RelayConfigView";
import { MixingSequenceConfig, MixingSequence } from "./MixingSequenceConfig";
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

  // Calculate live statistics based on real HMI batch logs if any exist
  const totalBatch = logs.length;
  const totalVolume = logs.reduce((acc, curr) => acc + curr.volume, 0);

  // Helper to render dynamic view based on sidebar selection
  const renderContent = () => {
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
            <SystemStatus username="admin" role="admin" />
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
          <div className="flex-1 bg-[#0b1329]/80 border border-[#1e293b]/70 rounded-[6px] p-6 flex flex-col justify-between overflow-hidden">
            <div className="space-y-4 overflow-y-auto pr-2 max-h-[300px]">
              <div className="flex items-center gap-2.5 text-[#00e5ff]">
                <FileCheck size={20} />
                <h4 className="text-sm font-sans font-black tracking-widest uppercase">
                  TABEL JOB MIX FORMULA (JMF)
                </h4>
              </div>
              <p className="text-[10px] font-mono text-slate-405 uppercase">
                Daftar formula agregat beton dan aditif pencampur aktif.
              </p>

              <table className="w-full text-left text-[10px] font-mono border-collapse mt-4">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500">
                    <th className="py-2 px-1">KODE REAKSI</th>
                    <th className="py-2">NAMA FORMULA</th>
                    <th className="py-2 text-right">PASIR (KG)</th>
                    <th className="py-2 text-right">BATU (KG)</th>
                    <th className="py-2 text-right">SEMEN (KG)</th>
                    <th className="py-2 text-right">AIR (KG)</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300 divide-y divide-slate-900">
                  <tr>
                    <td className="py-2.5 px-1 font-bold text-[#00e5ff]">K-300 FA</td>
                    <td>MUTU BETON K300 FLY ASH</td>
                    <td className="text-right">670</td>
                    <td className="text-right">1010</td>
                    <td className="text-right">310</td>
                    <td className="text-right">180</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-1 font-bold text-[#00e5ff]">K-250 NFA</td>
                    <td>MUTU BETON K250 NORMAL</td>
                    <td className="text-right">720</td>
                    <td className="text-right">980</td>
                    <td className="text-right">290</td>
                    <td className="text-right">175</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-1 font-bold text-[#00e5ff]">K-350 FA</td>
                    <td>MUTU BETON K350 FLY ASH</td>
                    <td className="text-right">620</td>
                    <td className="text-right">1040</td>
                    <td className="text-right">350</td>
                    <td className="text-right">190</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-[#112211]/30 border-2 border-emerald-500/30 rounded-[4px] p-3 flex items-start gap-2.5">
              <Zap size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <div className="flex flex-col text-left">
                <span className="text-[9.5px] font-sans font-black text-emerald-400 uppercase">JMF SYNC OK</span>
                <span className="text-[8.5px] font-mono text-slate-400 uppercase mt-1 leading-relaxed">
                  Semua formula lokal sinkron sepenuhnya dengan memori registrasi Modbus PLC-OMRON-300M.
                </span>
              </div>
            </div>
          </div>
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
          <div className="flex-1 bg-[#0b1329]/80 border border-[#1e293b]/70 rounded-[6px] p-6 flex flex-col justify-between overflow-hidden">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 text-[#00e5ff]">
                <Cpu size={20} />
                <h4 className="text-sm font-sans font-black tracking-widest uppercase">
                  SETTING PORT KOMUNIKASI MODBUS / RS485
                </h4>
              </div>
              <p className="text-[10px] font-mono text-slate-405 uppercase">
                Konfigurasi interface serial port rintangan fisik controller timbangan batching plant.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-sans font-bold text-slate-400">BAUD RATE</span>
                  <select disabled className="bg-[#05080e] border border-slate-800 text-slate-300 p-2 text-xs font-mono rounded-[4px]">
                    <option>9600 bps</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-sans font-bold text-slate-400">SERIAL PORT CONNECTOR</span>
                  <select disabled className="bg-[#05080e] border border-slate-800 text-slate-500 p-2 text-xs font-mono rounded-[4px]">
                    <option>COM3 - PROLIFIC USB-TO-SERIAL</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-[#112211]/30 border-2 border-emerald-500/30 rounded-[4px] p-3 flex items-start gap-2.5">
              <Clock size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <div className="flex flex-col text-left">
                <span className="text-[9.5px] font-sans font-black text-emerald-400 uppercase">PORT STATUS ACTIVE</span>
                <span className="text-[8.5px] font-mono text-slate-400 uppercase mt-1 leading-relaxed">
                  Koneksi RS485 Timbangan transmitter lancar. Latensi transfer paket 12ms.
                </span>
              </div>
            </div>
          </div>
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
