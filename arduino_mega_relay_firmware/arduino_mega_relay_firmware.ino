/**
 * FIRMWARE KONTROLER RELAI ARDUINO MEGA 2560 - BATCHING PLANT HMI
 * 
 * Deskripsi:
 * Sketch ini menerima instruksi status relai dari aplikasi HMI berbasis web
 * (melalui Web Serial API) dengan baudrate 115200 bps. Program ini memicu 18 relai output
 * secara individual pada pin digital contiguous 22 sampai 39.
 * 
 * Dilengkapi dengan Fitur Keselamatan "Hardware Safety Watchdog" yang otomatis mematikan
 * seluruh relai/katup jika komputer terputus atau tidak mengirim data dalam waktu 5 detik.
 * 
 * Hubungkan modul relay Anda ke Pin 22 - Pin 39 pada Arduino Mega 2560:
 * - Pin 22: Silo Pasir Utama
 * - Pin 23: Silo Pasir 1
 * - Pin 24: Silo Pasir 2
 * - Pin 25: Silo Batu Utama
 * - Pin 26: Silo Batu 1
 * - Pin 27: Silo Batu 2
 * - Pin 28: Screw Conveyor Semen
 * - Pin 29: Valve Air Timbang
 * - Pin 30: Dump Gate Pasir Hopper
 * - Pin 31: Dump Gate Batu Hopper
 * - Pin 32: Dump Gate Semen Hopper
 * - Pin 33: Dump Gate Air Hopper
 * - Pin 34: Conveyor Belt Bawah (Bottom Conveyor)
 * - Pin 35: Conveyor Belt Atas (Main Feeder)
 * - Pin 36: Motor Twin Shaft Mixer
 * - Pin 37: Pintu Mixer Buang 1
 * - Pin 38: Pintu Mixer Buang 2
 * - Pin 39: Pintu Mixer Buang 3
 */

// Konfigurasi Jenis Modul Relai (Ubah ke true jika menggunakan modul relay aktif LOW)
const bool ACTIVE_LOW_RELAYS = false; 

// Konfigurasi Pin Digital Arduino
const int NUM_RELAYS = 18;
const int relayPins[NUM_RELAYS] = {
  22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39
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
