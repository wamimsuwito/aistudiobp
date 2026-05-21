export interface RelayRow {
  name: string;
  relay: number;
  modbusCoil: string;
  timer1: string;
  timer2: string;
  timer3: string;
  timer4: string;
  timer5: string;
  timer6: string;
}

const STORAGE_KEY = "hmi_relay_configuration";

export const DEFAULT_RELAY_DATA: RelayRow[] = [
  { name: "Mixer", relay: 1, modbusCoil: "0", timer1: "0", timer2: "", timer3: "", timer4: "", timer5: "", timer6: "" },
  { name: "Konveyor atas", relay: 2, modbusCoil: "1", timer1: "1000", timer2: "", timer3: "", timer4: "", timer5: "", timer6: "" },
  { name: "Konveyor bawah", relay: 3, modbusCoil: "2", timer1: "1000", timer2: "", timer3: "", timer4: "", timer5: "", timer6: "" },
  { name: "Kompressor", relay: 4, modbusCoil: "3", timer1: "0", timer2: "", timer3: "", timer4: "", timer5: "", timer6: "" },
  { name: "Pintu pasir 1", relay: 5, modbusCoil: "4", timer1: "0", timer2: "", timer3: "", timer4: "", timer5: "", timer6: "" },
  { name: "Pintu pasir 2", relay: 6, modbusCoil: "5", timer1: "0", timer2: "", timer3: "", timer4: "", timer5: "", timer6: "" },
  { name: "Pintu batu 1", relay: 7, modbusCoil: "6", timer1: "0", timer2: "", timer3: "", timer4: "", timer5: "", timer6: "" },
  { name: "Pintu batu 2", relay: 8, modbusCoil: "7", timer1: "0", timer2: "", timer3: "", timer4: "", timer5: "", timer6: "" },
  { name: "Dump material", relay: 9, modbusCoil: "8", timer1: "0", timer2: "", timer3: "", timer4: "", timer5: "", timer6: "" },
  { name: "Dump material 2", relay: 10, modbusCoil: "9", timer1: "0", timer2: "", timer3: "", timer4: "", timer5: "", timer6: "" },
  { name: "Vibrator", relay: 11, modbusCoil: "10", timer1: "0", timer2: "", timer3: "", timer4: "", timer5: "", timer6: "" },
  { name: "Tuang air", relay: 12, modbusCoil: "11", timer1: "0", timer2: "", timer3: "", timer4: "", timer5: "", timer6: "" },
  { name: "Tuang additive", relay: 13, modbusCoil: "12", timer1: "0", timer2: "", timer3: "", timer4: "", timer5: "", timer6: "" },
  { name: "Pintu mixer buka", relay: 14, modbusCoil: "13", timer1: "2000", timer2: "5000", timer3: "2000", timer4: "5000", timer5: "2000", timer6: "5000" },
  { name: "Pintu mixer tutup", relay: 15, modbusCoil: "14", timer1: "4000", timer2: "", timer3: "", timer4: "", timer5: "", timer6: "" },
  { name: "Klakson", relay: 16, modbusCoil: "15", timer1: "0", timer2: "", timer3: "", timer4: "", timer5: "", timer6: "" },
  { name: "Silo 1", relay: 17, modbusCoil: "16", timer1: "0", timer2: "", timer3: "", timer4: "", timer5: "", timer6: "" },
  { name: "Silo 2", relay: 18, modbusCoil: "17", timer1: "0", timer2: "", timer3: "", timer4: "", timer5: "", timer6: "" },
  { name: "Silo 3", relay: 19, modbusCoil: "18", timer1: "0", timer2: "", timer3: "", timer4: "", timer5: "", timer6: "" },
  { name: "Silo 4", relay: 20, modbusCoil: "19", timer1: "0", timer2: "", timer3: "", timer4: "", timer5: "", timer6: "" },
  { name: "Silo 5", relay: 21, modbusCoil: "20", timer1: "0", timer2: "", timer3: "", timer4: "", timer5: "", timer6: "" },
  { name: "Silo 6", relay: 22, modbusCoil: "21", timer1: "0", timer2: "", timer3: "", timer4: "", timer5: "", timer6: "" },
  { name: "Spare 1", relay: 23, modbusCoil: "22", timer1: "0", timer2: "", timer3: "", timer4: "", timer5: "", timer6: "" },
  { name: "Spare 2", relay: 24, modbusCoil: "23", timer1: "0", timer2: "", timer3: "", timer4: "", timer5: "", timer6: "" }
];

export const loadRelayConfig = (): RelayRow[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Gagal memuat konfigurasi relay dari localStorage:", e);
  }
  return DEFAULT_RELAY_DATA;
};

export const saveRelayConfig = (data: RelayRow[]): boolean => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error("Gagal mengekalkan konfigurasi relay ke dalam localStorage:", e);
    return false;
  }
};
