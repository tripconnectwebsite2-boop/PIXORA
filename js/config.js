/**
 * PIXORA — Global Configuration & Admin State Manager
 * Synchronizes website maintenance mode, broadcast announcements, and vision thresholds
 * Developed by AB Designing | Designed by Adharsh
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

class PixoraConfig {
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

  static save(updatedConfig) {
    try {
      const current = this.get();
      const merged = {
        ...current,
        ...updatedConfig,
        announcement: { ...current.announcement, ...(updatedConfig.announcement || {}) },
        maintenance: { ...current.maintenance, ...(updatedConfig.maintenance || {}) }
      };
      localStorage.setItem("pixora_config", JSON.stringify(merged));
      window.dispatchEvent(new Event("pixora_config_changed"));
      this.renderGlobalBanners();
      return true;
    } catch (e) {
      console.error("[PIXORA Config] Error saving config", e);
      return false;
    }
  }

  static reset() {
    localStorage.removeItem("pixora_config");
    window.dispatchEvent(new Event("pixora_config_changed"));
    this.renderGlobalBanners();
    return DEFAULT_CONFIG;
  }

  static renderGlobalBanners() {
    const config = this.get();
    let bannerContainer = document.getElementById("pixoraGlobalNoticeBar");

    // Create top container dynamically if not present
    if (!bannerContainer) {
      bannerContainer = document.createElement("div");
      bannerContainer.id = "pixoraGlobalNoticeBar";
      bannerContainer.className = "w-full z-50 transition-all duration-300";
      document.body.prepend(bannerContainer);
    }

    let html = "";

    // 1. Maintenance Mode Banner (Highest Priority)
    if (config.maintenance && config.maintenance.active) {
      html += `
        <div class="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 py-3 shadow-lg border-b border-amber-400/30 flex items-center justify-between text-xs sm:text-sm font-semibold">
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
        <div id="pixoraBroadcastItem" class="bg-gradient-to-r ${bgClasses} text-white px-4 py-2.5 shadow-md border-b flex items-center justify-between text-xs font-medium">
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

// Auto-initialize when DOM ready and listen for storage changes
if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    PixoraConfig.renderGlobalBanners();
  });
  window.addEventListener("storage", (e) => {
    if (e.key === "pixora_config") {
      PixoraConfig.renderGlobalBanners();
    }
  });
  window.addEventListener("pixora_config_changed", () => {
    PixoraConfig.renderGlobalBanners();
  });
}

window.PixoraConfig = PixoraConfig;
