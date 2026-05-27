/**
 * FIRMWARE KONTROLER RELAI ARDUINO MEGA 2560 - BATCHING PLANT HMI
 * 
 * Deskripsi:
 * Sketch ini menerima instruksi status relai dari aplikasi HMI berbasis web
 * (melalui Web Serial API) dengan baudrate 115200 bps. Program ini memicu 27 relai output
 * secara individual pada pin digital yang telah ditentukan di bawah.
 * 
 * Dilengkapi dengan Fitur Keselamatan "Hardware Safety Watchdog" yang otomatis mematikan
 * seluruh relai/katup jika komputer terputus atau tidak mengirim data dalam waktu 5 detik.
 * 
 * Hubungkan modul relay Anda ke Pin pada Arduino Mega 2560 sesuai urutan berikut:
 * - Relay 1  (Pin 22): Mixer
 * - Relay 2  (Pin 24): Konveyor Atas (Main Feeder)
 * - Relay 3  (Pin 26): Konveyor Bawah (Bottom Conveyor)
 * - Relay 4  (Pin 28): Kompressor
 * - Relay 5  (Pin 30): Pintu Pasir 1
 * - Relay 6  (Pin 32): Pintu Pasir 2
 * - Relay 7  (Pin 34): Pintu Batu 1
 * - Relay 8  (Pin 36): Pintu Batu 2
 * - Relay 9  (Pin 38): Dump Material 1 (Dump Pasir Hopper)
 * - Relay 10 (Pin 40): Dump Material 2 (Dump Batu Hopper)
 * - Relay 11 (Pin 42): Vibrator
 * - Relay 12 (Pin 44): Tuang Air (Valve Air Timbang)
 * - Relay 13 (Pin 48): Tuang Additive
 * - Relay 14 (Pin 50): Pintu Mixer Buka
 * - Relay 15 (Pin 52): Pintu Mixer Tutup
 * - Relay 16 (Pin 33): Klakson
 * - Relay 17 (Pin 31): Silo 1
 * - Relay 18 (Pin 35): Silo 2
 * - Relay 19 (Pin 37): Silo 3
 * - Relay 20 (Pin 39): Silo 4
 * - Relay 21 (Pin 41): Silo 5
 * - Relay 22 (Pin 43): Silo 6
 * - Relay 23 (Pin 45): Spare 1
 * - Relay 24 (Pin 47): Spare 2
 * - Relay 25 (Pin 49): Spare 3
 * - Relay 26 (Pin 51): Spare 4
 * - Relay 27 (Pin 53): Spare 5
 */

// Konfigurasi Jenis Modul Relai (Ubah ke true jika menggunakan modul relay aktif LOW)
const bool ACTIVE_LOW_RELAYS = true; 

// Konfigurasi Pin Digital Arduino
const int NUM_RELAYS = 27;
const int relayPins[NUM_RELAYS] = {
  22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 48, 50, 52, 33, 31, 35, 37, 39, 41, 43, 45, 47, 49, 51, 53
};

// State penyimpanan
bool currentStates[NUM_RELAYS] = {false};

// LED Indikator Onboard
const int LED_INDICATOR = 13;

// Safety Watchdog (Otomatis MATI jika koneksi terputus)
unsigned long lastHeartbeatTime = 0;
const unsigned long TIMEOUT_THRESHOLD_MS = 5000; // 5 Detik

void setup() {
  // Inisialisasi komunikasi Serial dengan Baud Rate tinggi
  Serial.begin(115200);
  
  // Konfigurasi seluruh Pin Relai sebagai OUTPUT
  for (int i = 0; i < NUM_RELAYS; i++) {
    pinMode(relayPins[i], OUTPUT);
    // Set level inisial (Semua OFF)
    digitalWrite(relayPins[i], ACTIVE_LOW_RELAYS ? HIGH : LOW);
  }
  
  pinMode(LED_INDICATOR, OUTPUT);
  digitalWrite(LED_INDICATOR, LOW);
  
  lastHeartbeatTime = millis();
  
  // Kirim sinyal boot ke konsol HMI
  Serial.println("ARDUINO MEGA 2560 BATCHING PLANT CONTROLLER READY: OK");
  Serial.print("PIN CONFIGURATION: 22 TO 39 CONTIGUOUS. RELAY TOTAL: ");
  Serial.println(NUM_RELAYS);
}

void loop() {
  // Mengecek ketersediaan data incoming buffer serial
  if (Serial.available() > 0) {
    String inputLine = Serial.readStringUntil('\n');
    inputLine.trim();
    
    // Protokol Frame: "RELAY:1,0,0,1,0..."
    if (inputLine.startsWith("RELAY:")) {
      lastHeartbeatTime = millis(); // Refresh watchdog timer
      digitalWrite(LED_INDICATOR, HIGH); // Flash LED visual
      
      String payload = inputLine.substring(6); // Ambil data setelah "RELAY:"
      parseAndApplyRelays(payload);
      
      // Kirim balik verifikasi status (ACK) ke konsol HMI
      Serial.print("ACK_OK:STATES=");
      Serial.println(payload);
      
      delay(5);
      digitalWrite(LED_INDICATOR, LOW);
    }
  }
  
  // --- HARDWARE SAFETY WATCHDOG DISCONNECT CHECKS ---
  if (millis() - lastHeartbeatTime > TIMEOUT_THRESHOLD_MS) {
    bool hasActiveOutputs = false;
    for (int i = 0; i < NUM_RELAYS; i++) {
      if (currentStates[i]) {
        hasActiveOutputs = true;
        break;
      }
    }
    
    if (hasActiveOutputs) {
      emergencySafetyShutdown();
    }
  }
}

/**
 * Memisahkan baris comma-delimited string dan menerapkan output ke pin relay fisik
 */
void parseAndApplyRelays(String data) {
  int relayIndex = 0;
  int strIndex = 0;
  
  while (relayIndex < NUM_RELAYS && strIndex < data.length()) {
    int commaIndex = data.indexOf(',', strIndex);
    String bitValStr;
    
    if (commaIndex == -1) {
      bitValStr = data.substring(strIndex);
      strIndex = data.length(); // End of string reached
    } else {
      bitValStr = data.substring(strIndex, commaIndex);
      strIndex = commaIndex + 1;
    }
    
    bitValStr.trim();
    bool stateValue = (bitValStr == "1");
    currentStates[relayIndex] = stateValue;
    
    // Terapkan level tegangan berdasarkan konfigurasi relai (Active-High/Active-Low)
    if (ACTIVE_LOW_RELAYS) {
      digitalWrite(relayPins[relayIndex], stateValue ? LOW : HIGH);
    } else {
      digitalWrite(relayPins[relayIndex], stateValue ? HIGH : LOW);
    }
    
    relayIndex++;
  }
}

/**
 * Mematikan semua relai secara instan demi keamanan jika komputer/koneksi terputus
 */
void emergencySafetyShutdown() {
  for (int i = 0; i < NUM_RELAYS; i++) {
    currentStates[i] = false;
    digitalWrite(relayPins[i], ACTIVE_LOW_RELAYS ? HIGH : LOW);
  }
  
  // Flash LED indikator dengan pola cepat sebagai indikator gangguan link serial
  for (int k = 0; k < 6; k++) {
    digitalWrite(LED_INDICATOR, HIGH);
    delay(75);
    digitalWrite(LED_INDICATOR, LOW);
    delay(75);
  }
  
  Serial.println("[WARNING] KONEKSI SERIAL TERPUTUS! SAFETY SHUTDOWN RELE DI_AKTIFKAN.");
  // Amankan waktu heartbeat agar tidak looping alarm
  lastHeartbeatTime = millis();
}
