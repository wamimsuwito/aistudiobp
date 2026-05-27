import React, { useState, useEffect } from "react";
import { InfoPanel } from "./InfoPanel";
import { RelayTable } from "./RelayTable";
import { ActionButtons } from "./ActionButtons";
import { RelayRow, loadRelayConfig, saveRelayConfig } from "./ConfigState";
import { CheckCircle, HelpCircle } from "lucide-react";

interface RelayConfigViewProps {
  activePins?: Record<string, boolean>;
}

export const RelayConfigView: React.FC<RelayConfigViewProps> = ({ activePins }) => {
  const [rows, setRows] = useState<RelayRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Load initial config from localStorage or fallback to template defaults
    const loaded = loadRelayConfig();
    setRows(loaded);
  }, []);

  const handleRowChange = (index: number, updatedField: keyof RelayRow, newVal: string) => {
    setRows((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [updatedField]: newVal,
      };
      return copy;
    });
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      const ok = saveRelayConfig(rows);
      setIsSaving(false);
      if (ok) {
        setShowSuccess(true);
        // Force a window storage event to reload configurations dynamically
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new Event("hmi_pin_config_updated"));
        setTimeout(() => setShowSuccess(false), 3000);
      }
    }, 500);
  };

  const handleExport = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(rows, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "scada_relay_modbus_config.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      console.error("Export falied: ", e);
      alert("Gagal melakukan export konfigurasi.");
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3 min-h-0 overflow-hidden font-sans">
      {/* Top Solenoid Info Panel */}
      <InfoPanel />

      {/* Real-time Output Monitor Grid */}
      <div className="bg-[#0c1220] border border-[#1e293b] rounded-[8px] p-3 shrink-0 select-none text-left shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
          <h4 className="text-[10.5px] font-sans font-black tracking-widest text-[#00ffd0] uppercase">
            MONITOR REALTIME OUTPUT ARDUINO COILS
          </h4>
        </div>
        <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-9 gap-1.5 pt-1 max-h-[140px] overflow-y-auto pr-1">
          {rows.map((row) => {
            const pinVal = row.arduinoPin;
            if (!pinVal) return null;
            const isPinOn = activePins ? !!activePins[pinVal] : false;
            return (
              <div
                key={row.relay}
                className={`py-1 px-1.5 border rounded flex flex-col items-center justify-center text-center transition-all duration-200 ${
                  isPinOn
                    ? "bg-emerald-950/60 border-emerald-500/50 text-[#00ffd0] shadow-[0_0_6px_rgba(16,185,129,0.15)]"
                    : "bg-slate-900/40 border-slate-800/80 text-slate-500"
                }`}
              >
                <span className="text-[7.5px] font-sans font-bold leading-tight uppercase truncate max-w-[70px]">
                  {row.name}
                </span>
                <span className="text-[9px] font-mono font-black mt-0.5">
                  PIN {pinVal}: {isPinOn ? "ON" : "OFF"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Catatan sub-label right above the table header */}
      <div className="flex items-center justify-between px-1 select-none shrink-0">
        <div className="flex items-center gap-1.5 text-slate-400 font-sans text-[10.5px]">
          <HelpCircle size={12} className="text-slate-500 shrink-0" />
          <span>
            <strong>Catatan:</strong> Nilai dalam milliseconds (ms). Contoh: <span className="font-mono font-bold text-[#00ffd0]">2000</span> = 2 detik.
          </span>
        </div>

        {/* Temporary green success notification badge */}
        {showSuccess && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/60 border border-emerald-500/50 rounded-[4px] text-emerald-400 text-[10px] font-sans font-bold uppercase tracking-wider animate-bounce select-none">
            <CheckCircle size={11} className="text-emerald-400 shrink-0" />
            <span>Konfigurasi Berhasil Disimpan</span>
          </div>
        )}
      </div>

      {/* Main SCADA Scrollable Grid Table */}
      <RelayTable rows={rows} onRowChange={handleRowChange} activePins={activePins} />

      {/* Footer trigger buttons area */}
      <ActionButtons onSave={handleSave} onExport={handleExport} isSaving={isSaving} />
    </div>
  );
};
