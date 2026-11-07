/**
 * PIXORA — Global Real-time Configuration & Admin State Manager
 * Synchronizes website maintenance mode, broadcast announcements, and vision thresholds
 * Real-time Multi-Instance synchronization via Firebase Realtime Database (RTDB) & BroadcastChannel
 * Developed by AB Designing | Designed by Adharsh
 * 
 * STRICT PRIVACY GUARANTEE:
 * Customer photos are processed 100% locally in browser memory.
 * No customer photo, face embedding, or user file is ever uploaded or stored in any database.
 */

const DEFAULT_CONFIG = {
  earBlinkThreshold: 0.17,      // Eye Aspect Ratio for closed eyes
  earHalfClosedThreshold: 0.20, // Eye Aspect Ratio for drowsy / half-closed eyes
  blurThreshold: 85,            // Laplacian variance sharpness cutoff
  duplicateDistance: 10,        // dHash Hamming distance
  announcement: {
    active: false,
    text: "Welcome to PIXORA Studio. Ultra-fast private wedding photo curation active.",
    type: "info" // info, success, warning, alert
  },
  maintenance: {
    active: false,
    message: "Scheduled system maintenance in progress. PIXORA Studio features may be temporarily limited."
  },
  designerCredit: "Designed by Adharsh"
};

const BROADCAST_CHANNEL_NAME = "pixora_global_realtime_v1";

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAETe6XVOekxxp77cWJafSqJVNR70qzbpE",
  authDomain: "pixora-7dc8f.firebaseapp.com",
  databaseURL: "https://pixora-7dc8f-default-rtdb.firebaseio.com",
  projectId: "pixora-7dc8f",
  storageBucket: "pixora-7dc8f.firebasestorage.app",
  messagingSenderId: "221600400260",
  appId: "1:221600400260:web:98450bf56be66b46c613d1",
  measurementId: "G-7B2V7VDSWP"
};

class PixoraConfig {
  static broadcastChannel = null;
  static rtdb = null;
  static rtdbRef = null;
  static rtdbSet = null;

  static get() {
    try {
      const stored = localStorage.getItem("pixora_config");
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...DEFAULT_CONFIG,
          ...parsed,
          announcement: { ...DEFAULT_CONFIG.announcement, ...(parsed.announcement || {}) },
          maintenance: { ...DEFAULT_CONFIG.maintenance, ...(parsed.maintenance || {}) }
        };
      }
    } catch (e) {
      console.warn("[PIXORA Config] Error reading config from localStorage", e);
    }
    return DEFAULT_CONFIG;
  }

  static async save(updatedConfig) {
    try {
      const current = this.get();
      const merged = {
        ...current,
        ...updatedConfig,
        announcement: { ...current.announcement, ...(updatedConfig.announcement || {}) },
        maintenance: { ...current.maintenance, ...(updatedConfig.maintenance || {}) },
        lastUpdated: Date.now()
      };

      // 1. Immediate local cache and banner update
      localStorage.setItem("pixora_config", JSON.stringify(merged));
      window.dispatchEvent(new Event("pixora_config_changed"));
      this.renderGlobalBanners();

      // 2. Broadcast immediately across open tabs via BroadcastChannel
      if (this.broadcastChannel) {
        try {
          this.broadcastChannel.postMessage({ type: "CONFIG_UPDATED", config: merged });
        } catch (_) {}
      }

      // 3. Global Remote Broadcast to ALL visitors worldwide via Firebase Realtime Database
      await this.syncToRealtimeDatabase(merged);

      return true;
    } catch (e) {
      console.error("[PIXORA Config] Error saving config", e);
      return false;
    }
  }

  static async reset() {
    localStorage.removeItem("pixora_config");
    window.dispatchEvent(new Event("pixora_config_changed"));
    this.renderGlobalBanners();
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({ type: "CONFIG_RESET" });
      } catch (_) {}
    }
    await this.syncToRealtimeDatabase(DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  }

  static async syncToRealtimeDatabase(configData) {
    try {
      if (!this.rtdb) {
        await this.initRealtimeDatabase();
      }
      if (this.rtdb && this.rtdbRef && this.rtdbSet) {
        const targetRef = this.rtdbRef(this.rtdb, "pixora_config");
        await this.rtdbSet(targetRef, configData);
        console.log("[PIXORA Realtime] Successfully broadcasted to Firebase Realtime Database!");
      }
    } catch (err) {
      console.warn("[PIXORA Realtime] Realtime Database sync notice:", err.message);
    }
  }

  static async initRealtimeDatabase() {
    if (this.rtdb) return;
    try {
      const { initializeApp, getApps } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
      const { getDatabase, ref, set, onValue } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js");

      this.rtdbRef = ref;
      this.rtdbSet = set;

      const app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApps()[0];
      this.rtdb = getDatabase(app, FIREBASE_CONFIG.databaseURL);

      // Listen to real-time changes across the entire world!
      const configRef = ref(this.rtdb, "pixora_config");
      onValue(configRef, (snapshot) => {
        if (snapshot.exists()) {
          const remoteData = snapshot.val();
          const current = this.get();
          // Update only when changed to avoid cycles
          if (JSON.stringify(remoteData) !== JSON.stringify(current)) {
            console.log("[PIXORA Realtime] Received live update from Firebase Realtime Database!");
            localStorage.setItem("pixora_config", JSON.stringify(remoteData));
            window.dispatchEvent(new Event("pixora_config_changed"));
            PixoraConfig.renderGlobalBanners();
          }
        }
      }, (err) => {
        console.info("[PIXORA Realtime] Realtime Database listener notice:", err.message);
      });
    } catch (e) {
      console.info("[PIXORA Realtime] Realtime DB fallback:", e.message);
    }
  }

  static renderGlobalBanners() {
    const config = this.get();
    let bannerContainer = document.getElementById("pixoraGlobalNoticeBar");

    // Create top container dynamically if not present
    if (!bannerContainer) {
      bannerContainer = document.createElement("div");
      bannerContainer.id = "pixoraGlobalNoticeBar";
      bannerContainer.className = "w-full z-50 transition-all duration-300";
      if (document.body) {
        document.body.prepend(bannerContainer);
      }
    }

    if (!bannerContainer) return;

    let html = "";

    // 1. Maintenance Mode Banner (Highest Priority)
    if (config.maintenance && config.maintenance.active) {
      html += `
        <div class="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 py-3 shadow-lg border-b border-amber-400/30 flex items-center justify-between text-xs sm:text-sm font-semibold animate-fade-in">
          <div class="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <span class="flex h-3 w-3 relative">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span class="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
              <div class="flex items-center gap-2">
                <span class="uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-black/25 text-[10px] font-mono">Maintenance Active</span>
                <span>${config.maintenance.message || "Scheduled system maintenance in progress. Services will resume shortly."}</span>
              </div>
            </div>
            <a href="admin.html" class="hidden sm:inline-block px-3 py-1 rounded bg-black/30 hover:bg-black/50 text-amber-200 text-xs font-mono transition-colors">Admin Console</a>
          </div>
        </div>
      `;
    }

    // 2. Custom Visitor Broadcast Announcement Banner
    if (config.announcement && config.announcement.active && config.announcement.text) {
      const type = config.announcement.type || "info";
      let bgClasses = "from-indigo-600 via-violet-600 to-indigo-700 border-indigo-400/30";
      let dotClass = "bg-indigo-300";

      if (type === "alert") {
        bgClasses = "from-rose-600 via-red-600 to-rose-700 border-rose-400/30";
        dotClass = "bg-rose-200";
      } else if (type === "warning") {
        bgClasses = "from-amber-600 via-yellow-600 to-amber-700 border-yellow-400/30";
        dotClass = "bg-amber-200";
      } else if (type === "success") {
        bgClasses = "from-emerald-600 via-teal-600 to-emerald-700 border-emerald-400/30";
        dotClass = "bg-emerald-200";
      }

      html += `
        <div id="pixoraBroadcastItem" class="bg-gradient-to-r ${bgClasses} text-white px-4 py-2.5 shadow-md border-b flex items-center justify-between text-xs font-medium animate-fade-in">
          <div class="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
            <div class="flex items-center gap-2.5">
              <span class="w-2 h-2 rounded-full ${dotClass} animate-pulse"></span>
              <span>${config.announcement.text}</span>
            </div>
            <button type="button" onclick="document.getElementById('pixoraBroadcastItem').style.display='none'" class="text-white/80 hover:text-white px-2 py-0.5 rounded hover:bg-white/10 transition-colors text-xs flex items-center gap-1 font-mono">
              Dismiss &times;
            </button>
          </div>
        </div>
      `;
    }

    bannerContainer.innerHTML = html;
  }
}

// Setup real-time listeners across tabs, windows, and cloud
if (typeof window !== "undefined") {
  // 1. BroadcastChannel API for multi-tab instantaneous sync
  try {
    if ("BroadcastChannel" in window) {
      PixoraConfig.broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      PixoraConfig.broadcastChannel.onmessage = (event) => {
        if (event.data && event.data.type === "CONFIG_UPDATED") {
          localStorage.setItem("pixora_config", JSON.stringify(event.data.config));
          window.dispatchEvent(new Event("pixora_config_changed"));
          PixoraConfig.renderGlobalBanners();
        } else if (event.data && event.data.type === "CONFIG_RESET") {
          localStorage.removeItem("pixora_config");
          window.dispatchEvent(new Event("pixora_config_changed"));
          PixoraConfig.renderGlobalBanners();
        }
      };
    }
  } catch (_) {}

  // 2. Storage event listener (fallback for browsers without BroadcastChannel)
  window.addEventListener("storage", (e) => {
    if (e.key === "pixora_config") {
      PixoraConfig.renderGlobalBanners();
    }
  });

  // 3. Custom internal event
  window.addEventListener("pixora_config_changed", () => {
    PixoraConfig.renderGlobalBanners();
  });

  // 4. Initial DOM mount and Realtime Database Cloud sync listener
  const onReady = () => {
    PixoraConfig.renderGlobalBanners();
    PixoraConfig.initRealtimeDatabase();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onReady);
  } else {
    onReady();
  }
}

window.PixoraConfig = PixoraConfig;
