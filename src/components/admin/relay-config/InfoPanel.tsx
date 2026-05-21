import React from "react";
import { AlertTriangle } from "lucide-react";

export const InfoPanel: React.FC = () => {
  return (
    <div className="bg-[#fefce8] border border-[#fef08a] rounded-[6px] p-4 text-slate-800 font-sans shadow-xs shrink-0 select-none text-left">
      <div className="flex items-start gap-2 text-[#ca8a04]">
        <AlertTriangle size={15} className="mt-0.5 shrink-0" />
        <span className="text-[12px] font-bold tracking-wide uppercase">
          PENTING - Sistem Hidrolik Solenoid Pintu Mixer:
        </span>
      </div>

      <ul className="mt-2.5 space-y-2 pl-5 list-disc text-[11px] leading-relaxed text-slate-700">
        <li>
          <strong className="text-slate-800">Pintu Mixer Buka (Relay #14):</strong>
          <div className="pl-4 mt-0.5 space-y-0.5 list-none">
            <div>
              <strong className="text-slate-800">Timer 1, 3, 5:</strong> Durasi solenoid BUKA ON (dalam ms) - pintu terbuka bertahap
            </div>
            <div>
              <strong className="text-slate-800">Timer 2, 4, 6:</strong> Durasi DIAM (solenoid OFF, pintu tetap di posisi terakhir)
            </div>
            <div className="text-[#ca8a04] font-medium leading-normal">
              Sequence: 7cm → diam → 24cm → diam → 30cm → diam
            </div>
          </div>
        </li>

        <li>
          <strong className="text-slate-800">Pintu Mixer Tutup (Relay #15):</strong>
          <div className="pl-4 mt-0.5">
            <div>
              <strong className="text-slate-800">Timer 1:</strong> Durasi solenoid TUTUP ON untuk menutup pintu penuh (dalam ms)
            </div>
            <div className="text-slate-500 font-medium italic mt-0.5">
              Hanya aktif SETELAH semua siklus buka selesai
            </div>
          </div>
        </li>
      </ul>
    </div>
  );
};
