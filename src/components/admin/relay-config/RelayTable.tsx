import React from "react";
import { RelayRow } from "./ConfigState";
import { TimerInput } from "./TimerInput";

interface RelayTableProps {
  rows: RelayRow[];
  onRowChange: (index: number, updatedField: keyof RelayRow, newVal: string) => void;
  activePins?: Record<string, boolean>;
}

export const RelayTable: React.FC<RelayTableProps> = ({ rows, onRowChange, activePins }) => {
  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#0b1329]/95 border border-[#1e293b]/80 rounded-[8px] overflow-hidden shadow-2xl select-none">
      
      {/* Table Headers (Sticky Area) */}
      <div className="w-full bg-[#0c152a] border-b border-slate-800/90 py-3.5 px-4 grid grid-cols-[1.6fr_0.5fr_0.9fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-2 text-slate-400 font-sans font-black text-[10px] tracking-wider uppercase select-none">
        <div className="text-left">Nama</div>
        <div className="text-right pr-2">Relay</div>
        <div className="text-center">Modbus</div>
        <div className="text-center text-cyan-400 font-extrabold">Pin Arduino</div>
        <div className="text-center">Timer 1 <span className="text-slate-500 font-medium block text-[8px] mt-0.5">(Buka 1)</span></div>
        <div className="text-center">Timer 2 <span className="text-slate-500 font-medium block text-[8px] mt-0.5">(Diam 1)</span></div>
        <div className="text-center">Timer 3 <span className="text-slate-500 font-medium block text-[8px] mt-0.5">(Buka 2)</span></div>
        <div className="text-center">Timer 4 <span className="text-slate-500 font-medium block text-[8px] mt-0.5">(Diam 2)</span></div>
        <div className="text-center">Timer 5 <span className="text-slate-500 font-medium block text-[8px] mt-0.5">(Buka 3)</span></div>
        <div className="text-center">Timer 6 <span className="text-slate-500 font-medium block text-[8px] mt-0.5">(Diam 3)</span></div>
      </div>

      {/* Dynamic Scrollable Rows Part */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-slate-900/60 pr-1">
        {rows.map((row, idx) => {
          const isActive = activePins && row.arduinoPin ? !!activePins[row.arduinoPin] : false;
          return (
            <div
              key={row.relay}
              className={`py-1 px-4 h-[50px] grid grid-cols-[1.6fr_0.5fr_0.9fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-2 items-center hover:bg-slate-800/15 transition-all text-slate-100 ${
                isActive ? "bg-emerald-950/10" : ""
              }`}
            >
              {/* Relay Name */}
              <div className="text-left font-sans font-black text-white text-[12px] tracking-wide truncate flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full inline-block shrink-0 ${
                  isActive ? "bg-[#00ffd0] animate-pulse shadow-[0_0_8px_#00ffd0]" : "bg-slate-700"
                }`} />
                {row.name}
              </div>

              {/* Relay Number (Greyed Badge) */}
              <div className="flex items-center justify-center">
                <div className="w-[34px] h-[32px] bg-[#0c1220] border border-slate-800/80 rounded-[4px] font-mono text-[11px] font-black text-slate-300 flex items-center justify-center">
                  {row.relay}
                </div>
              </div>

              {/* Modbus Coil (Bright White styling with black characters) */}
              <div className="flex items-center justify-center">
                <input
                  type="text"
                  value={row.modbusCoil}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, "");
                    onRowChange(idx, "modbusCoil", val);
                  }}
                  className="w-full h-[32px] bg-white border border-[#cbd5e1] focus:ring-2 focus:ring-[#00e5ff] text-slate-900 font-mono font-black text-[12px] rounded-[4px] text-center outline-hidden transition-all shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.15)]"
                />
              </div>

              {/* Pin Arduino Input */}
              <div className="flex items-center justify-center">
                <input
                  type="text"
                  value={row.arduinoPin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, "");
                    onRowChange(idx, "arduinoPin", val);
                  }}
                  className="w-full h-[32px] bg-[#070b13] border border-slate-850 focus:border-cyan-400 focus:shadow-[0_0_8px_rgba(34,211,238,0.2)] text-cyan-300 font-mono font-semibold text-[11px] rounded-[4px] text-center outline-hidden transition-all"
                />
              </div>

              {/* Timer 1 */}
              <div className="flex items-center justify-center">
                <TimerInput
                  value={row.timer1}
                  onChange={(val) => onRowChange(idx, "timer1", val)}
                />
              </div>

              {/* Timer 2 */}
              <div className="flex items-center justify-center">
                <TimerInput
                  value={row.timer2}
                  onChange={(val) => onRowChange(idx, "timer2", val)}
                />
              </div>

              {/* Timer 3 */}
              <div className="flex items-center justify-center">
                <TimerInput
                  value={row.timer3}
                  onChange={(val) => onRowChange(idx, "timer3", val)}
                />
              </div>

              {/* Timer 4 */}
              <div className="flex items-center justify-center">
                <TimerInput
                  value={row.timer4}
                  onChange={(val) => onRowChange(idx, "timer4", val)}
                />
              </div>

              {/* Timer 5 */}
              <div className="flex items-center justify-center">
                <TimerInput
                  value={row.timer5}
                  onChange={(val) => onRowChange(idx, "timer5", val)}
                />
              </div>

              {/* Timer 6 */}
              <div className="flex items-center justify-center">
                <TimerInput
                  value={row.timer6}
                  onChange={(val) => onRowChange(idx, "timer6", val)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
