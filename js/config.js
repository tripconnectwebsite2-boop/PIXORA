/**
 * PIXORA — Global Configuration & Admin State Manager
 * Synchronizes algorithm sensitivity and broadcast announcements across pages
 */

const DEFAULT_CONFIG = {
  earBlinkThreshold: 0.17,      // Eye Aspect Ratio for closed eyes
  earHalfClosedThreshold: 0.20, // Eye Aspect Ratio for drowsy / half-closed eyes
  blurThreshold: 85,            // Laplacian variance sharpness cutoff
  duplicateDistance: 10,        // dHash Hamming distance
  announcement: {
    active: false,
    text: "Welcome to PIXORA. Client-side air-gapped photo curation active.",
    type: "info" // info, alert, maintenance
  },
  maintenanceMode: false,
  designerCredit: "Designed by Adharsh"
};

class PixoraConfig {
  static get() {
    try {
      const stored = localStorage.getItem("pixora_config");
      if (stored) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn("Error reading config from localStorage", e);
    }
    return DEFAULT_CONFIG;
  }

  static save(updatedConfig) {
    try {
      const current = this.get();
      const merged = { ...current, ...updatedConfig };
      localStorage.setItem("pixora_config", JSON.stringify(merged));
      // Dispatch storage event for other tabs/pages
      window.dispatchEvent(new Event("pixora_config_changed"));
      return true;
    } catch (e) {
      console.error("Error saving config", e);
      return false;
    }
  }

  static reset() {
    localStorage.removeItem("pixora_config");
    window.dispatchEvent(new Event("pixora_config_changed"));
    return DEFAULT_CONFIG;
  }

  static renderAnnouncementBanner(containerId = "globalAnnouncementBanner") {
    const bannerEl = document.getElementById(containerId);
    if (!bannerEl) return;

    const config = this.get();
    if (config.announcement && config.announcement.active && config.announcement.text) {
      bannerEl.classList.remove("hidden");
      bannerEl.innerHTML = `
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between text-xs font-medium">
          <div class="flex items-center gap-2.5">
            <span class="w-2 h-2 rounded-full ${config.announcement.type === 'alert' ? 'bg-red-500 animate-ping' : 'bg-blue-400'}"></span>
            <span class="text-slate-200">${config.announcement.text}</span>
          </div>
          <button onclick="document.getElementById('${containerId}').classList.add('hidden')" class="text-slate-400 hover:text-white px-2 py-0.5 rounded transition-colors">
            Dismiss
          </button>
        </div>
      `;
    } else {
      bannerEl.classList.add("hidden");
      bannerEl.innerHTML = "";
    }
  }
}

window.PixoraConfig = PixoraConfig;
