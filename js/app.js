/**
 * PIXORA - Main Application Controller
 * "Find the Best. Skip the Rest."
 */

class PhotoCullerApp {
  constructor() {
    this.photos = [];
    this.activeTab = "good";
    this.selectedIds = new Set();
    this.previewPhotoId = null;
    this.isScanning = false;
    this.filterReason = "all";
    this.filterMatchedPersonOnly = false;
    this.referencePersonActive = false;

    this.initDOMElements();
    this.attachEventListeners();
    this.updateUI();
  }

  initDOMElements() {
    // Inputs & Buttons
    this.dropZone = document.getElementById("dropZone");
    this.folderInput = document.getElementById("folderInput");
    this.fileInput = document.getElementById("fileInput");
    this.btnFolderSelect = document.getElementById("btnFolderSelect");
    this.btnFilesSelect = document.getElementById("btnFilesSelect");
    this.btnDownloadZip = document.getElementById("btnDownloadZip");
    this.btnDeleteAllBad = document.getElementById("btnDeleteAllBad");
    this.btnEmptyTrash = document.getElementById("btnEmptyTrash");
    this.btnSelectAll = document.getElementById("btnSelectAll");
    this.btnBulkMoveGood = document.getElementById("btnBulkMoveGood");
    this.btnBulkMoveBad = document.getElementById("btnBulkMoveBad");

    // VIP Person Finder Elements
    this.personInput = document.getElementById("personInput");
    this.btnSelectPerson = document.getElementById("btnSelectPerson");
    this.personActiveCard = document.getElementById("personActiveCard");
    this.personAvatarImg = document.getElementById("personAvatarImg");
    this.personMatchCountText = document.getElementById("personMatchCountText");
    this.btnFilterMatchedOnly = document.getElementById("btnFilterMatchedOnly");
    this.btnFilterMatchedText = document.getElementById("btnFilterMatchedText");
    this.btnExportPersonZip = document.getElementById("btnExportPersonZip");
    this.btnClearPerson = document.getElementById("btnClearPerson");

    // Interactive Face Picker Modal Elements
    this.facePickerModal = document.getElementById("facePickerModal");
    this.facePickerRefImg = document.getElementById("facePickerRefImg");
    this.facePickerBoxesOverlay = document.getElementById("facePickerBoxesOverlay");
    this.facePickerCards = document.getElementById("facePickerCards");
    this.btnCloseFacePicker = document.getElementById("btnCloseFacePicker");

    // In-App Toast Container
    this.toastContainer = document.getElementById("toastContainer");

    // Futuristic HUD Scanning Telemetry Elements
    this.scanThumbImg = document.getElementById("scanThumbImg");
    this.scanCurrentFilename = document.getElementById("scanCurrentFilename");
    this.scanFacesTelemetry = document.getElementById("scanFacesTelemetry");
    this.scanFocusTelemetry = document.getElementById("scanFocusTelemetry");
    this.scanEarTelemetry = document.getElementById("scanEarTelemetry");
    this.scanSpeedTelemetry = document.getElementById("scanSpeedTelemetry");

    // Containers & Views
    this.photoGrid = document.getElementById("photoGrid");
    this.emptyState = document.getElementById("emptyState");
    this.scannerBanner = document.getElementById("scannerBanner");
    this.scanProgressBar = document.getElementById("scanProgressBar");
    this.scanProgressText = document.getElementById("scanProgressText");
    this.selectionToolbar = document.getElementById("selectionToolbar");
    this.selectedCountText = document.getElementById("selectedCountText");

    // Badges & Counters
    this.countTotal = document.getElementById("countTotal");
    this.countGood = document.getElementById("countGood");
    this.countBad = document.getElementById("countBad");
    this.countDuplicates = document.getElementById("countDuplicates");
    this.countTrash = document.getElementById("countTrash");
    this.badgeGood = document.getElementById("badgeGood");
    this.badgeBad = document.getElementById("badgeBad");
    this.badgeDuplicates = document.getElementById("badgeDuplicates");
    this.badgeTrash = document.getElementById("badgeTrash");

    // Tabs
    this.tabs = {
      good: document.getElementById("tabGood"),
      bad: document.getElementById("tabBad"),
      duplicate: document.getElementById("tabDuplicate"),
      trash: document.getElementById("tabTrash")
    };

    // Filter Bad Sub-buttons
    this.filterContainer = document.getElementById("badFilterContainer");

    // Modal
    this.previewModal = document.getElementById("previewModal");
    this.previewImg = document.getElementById("previewImg");
    this.previewTitle = document.getElementById("previewTitle");
    this.previewMetrics = document.getElementById("previewMetrics");
    this.previewCategoryBadge = document.getElementById("previewCategoryBadge");
    this.btnClosePreview = document.getElementById("btnClosePreview");
    this.btnPrevPreview = document.getElementById("btnPrevPreview");
    this.btnNextPreview = document.getElementById("btnNextPreview");
    this.btnModalMoveGood = document.getElementById("btnModalMoveGood");
    this.btnModalMoveBad = document.getElementById("btnModalMoveBad");
    this.btnModalDelete = document.getElementById("btnModalDelete");

    // ZIP Progress Modal
    this.zipModal = document.getElementById("zipModal");
    this.zipProgressBar = document.getElementById("zipProgressBar");
    this.zipProgressText = document.getElementById("zipProgressText");
  }

  attachEventListeners() {
    // File / Folder picking
    this.btnFolderSelect.addEventListener("click", () => this.folderInput.click());
    this.btnFilesSelect.addEventListener("click", () => this.fileInput.click());
    this.folderInput.addEventListener("change", (e) => this.handleFiles(e.target.files));
    this.fileInput.addEventListener("change", (e) => this.handleFiles(e.target.files));

    // Drag and Drop
    this.dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      this.dropZone.classList.add("border-brand-500", "bg-brand-500/10");
    });
    this.dropZone.addEventListener("dragleave", () => {
      this.dropZone.classList.remove("border-brand-500", "bg-brand-500/10");
    });
    this.dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      this.dropZone.classList.remove("border-brand-500", "bg-brand-500/10");
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        this.handleFiles(e.dataTransfer.files);
      }
    });

    // Tab Navigation
    Object.keys(this.tabs).forEach((tabKey) => {
      this.tabs[tabKey].addEventListener("click", () => this.switchTab(tabKey));
    });

    // Bad Tab Filters
    if (this.filterContainer) {
      this.filterContainer.querySelectorAll("[data-filter]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          this.filterReason = e.target.getAttribute("data-filter");
          this.filterContainer.querySelectorAll("[data-filter]").forEach((b) => {
            b.classList.remove("bg-rose-600", "text-white", "font-semibold");
            b.classList.add("bg-white/[0.06]", "text-slate-300");
          });
          e.target.classList.add("bg-rose-600", "text-white", "font-semibold");
          e.target.classList.remove("bg-white/[0.06]", "text-slate-300");
          this.renderGrid();
        });
      });
    }

    // Bulk & Actions
    this.btnDownloadZip.addEventListener("click", () => this.startZipDownload());
    this.btnDeleteAllBad.addEventListener("click", () => this.deleteAllBadPhotos());
    this.btnEmptyTrash.addEventListener("click", () => this.emptyTrash());
    this.btnSelectAll.addEventListener("click", () => this.toggleSelectAll());
    this.btnBulkMoveGood.addEventListener("click", () => this.bulkMoveTo("good"));
    this.btnBulkMoveBad.addEventListener("click", () => this.bulkMoveTo("bad"));

    // VIP Person Finder Listeners
    if (this.btnSelectPerson && this.personInput) {
      this.btnSelectPerson.addEventListener("click", () => this.personInput.click());
      this.personInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files.length > 0) {
          this.handleReferencePersonUpload(e.target.files[0]);
        }
      });
    }

    if (this.btnFilterMatchedOnly) {
      this.btnFilterMatchedOnly.addEventListener("click", () => {
        this.filterMatchedPersonOnly = !this.filterMatchedPersonOnly;
        this.updatePersonFinderUI();
        this.renderGrid();
      });
    }

    if (this.btnExportPersonZip) {
      this.btnExportPersonZip.addEventListener("click", () => this.exportPersonPhotosZip());
    }

    if (this.btnClearPerson) {
      this.btnClearPerson.addEventListener("click", () => this.clearReferencePerson());
    }

    // Interactive Face Picker Modal Listeners
    if (this.btnCloseFacePicker) {
      this.btnCloseFacePicker.addEventListener("click", () => this.closeFacePicker());
    }
    if (this.facePickerModal) {
      this.facePickerModal.addEventListener("click", (e) => {
        if (e.target === this.facePickerModal) this.closeFacePicker();
      });
    }

    // Preview Modal Actions
    this.btnClosePreview.addEventListener("click", () => this.closePreview());
    this.btnPrevPreview.addEventListener("click", () => this.navigatePreview(-1));
    this.btnNextPreview.addEventListener("click", () => this.navigatePreview(1));
    this.btnModalMoveGood.addEventListener("click", () => {
      this.moveToCategory(this.previewPhotoId, "good");
      this.updatePreviewContent();
    });
    this.btnModalMoveBad.addEventListener("click", () => {
      this.moveToCategory(this.previewPhotoId, "bad");
      this.updatePreviewContent();
    });
    this.btnModalDelete.addEventListener("click", () => {
      const curId = this.previewPhotoId;
      this.navigatePreview(1);
      this.moveToCategory(curId, "trash");
    });

    // Keyboard Shortcuts
    window.addEventListener("keydown", (e) => {
      if (this.previewPhotoId !== null) {
        if (e.key === "Escape") this.closePreview();
        else if (e.key === "ArrowLeft") this.navigatePreview(-1);
        else if (e.key === "ArrowRight") this.navigatePreview(1);
        else if (e.key.toLowerCase() === "g") {
          this.moveToCategory(this.previewPhotoId, "good");
          this.updatePreviewContent();
        } else if (e.key.toLowerCase() === "b") {
          this.moveToCategory(this.previewPhotoId, "bad");
          this.updatePreviewContent();
        } else if (e.key === "Delete" || e.key === "Backspace") {
          const curId = this.previewPhotoId;
          this.navigatePreview(1);
          this.moveToCategory(curId, "trash");
        }
      }
    });

    // Initialize Camera / Mobile Device USB Import
    this.initCameraImportHandlers();
  }

  initCameraImportHandlers() {
    this.btnCameraConnect = document.getElementById("btnCameraConnect");
    this.cameraPermissionModal = document.getElementById("cameraPermissionModal");
    this.btnGrantCameraPermission = document.getElementById("btnGrantCameraPermission");
    this.btnCancelCameraPermission = document.getElementById("btnCancelCameraPermission");
    this.cameraInput = document.getElementById("cameraInput");

    if (this.btnCameraConnect) {
      this.btnCameraConnect.addEventListener("click", () => {
        if (this.cameraPermissionModal) {
          this.cameraPermissionModal.classList.remove("hidden");
        }
      });
    }

    if (this.btnCancelCameraPermission) {
      this.btnCancelCameraPermission.addEventListener("click", () => {
        if (this.cameraPermissionModal) {
          this.cameraPermissionModal.classList.add("hidden");
        }
      });
    }

    if (this.btnGrantCameraPermission) {
      this.btnGrantCameraPermission.addEventListener("click", async () => {
        if (this.cameraPermissionModal) {
          this.cameraPermissionModal.classList.add("hidden");
        }
        await this.requestCameraStorageAccess();
      });
    }

    if (this.cameraInput) {
      this.cameraInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files.length > 0) {
          this.handleFiles(e.target.files);
        }
      });
    }
  }

  async requestCameraStorageAccess() {
    try {
      if (window.showDirectoryPicker) {
        this.showToast("Opening DCIM / Camera Storage picker...", "info");
        const dirHandle = await window.showDirectoryPicker({
          id: "camera-dcim",
          mode: "read",
          startIn: "removable"
        });

        const files = [];
        const scanDir = async (handle) => {
          for await (const entry of handle.values()) {
            if (entry.kind === "file") {
              const file = await entry.getFile();
              if (file.type.startsWith("image/") || /\.(arw|cr2|cr3|nef|dng|heic|tif|tiff|jpg|jpeg|png|webp)$/i.test(file.name)) {
                files.push(file);
              }
            } else if (entry.kind === "directory") {
              await scanDir(entry);
            }
          }
        };

        await scanDir(dirHandle);

        if (files.length > 0) {
          this.showToast(`Found ${files.length} camera/mobile captures! Starting analysis...`, "success");
          this.handleFiles(files);
        } else {
          this.showToast("No photos found in selected directory. Please choose the DCIM folder.", "warning");
        }
      } else {
        if (this.cameraInput) {
          this.cameraInput.click();
        } else if (this.folderInput) {
          this.folderInput.click();
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        this.showToast("Storage access notice: " + (err.message || "Manual selection"), "info");
        if (this.cameraInput) this.cameraInput.click();
      }
    }
  }

  async handleFiles(fileList) {
    if (!fileList || fileList.length === 0) return;

    // Filter valid image types (including RAW formats)
    const validFiles = Array.from(fileList).filter((f) =>
      /\.(jpe?g|png|webp|avif|bmp|arw|cr2|cr3|nef|dng|heic|tif|tiff)$/i.test(f.name)
    );

    if (validFiles.length === 0) {
      alert("Please select valid image files (JPG, PNG, WEBP, AVIF).");
      return;
    }

    this.isScanning = true;
    this.scannerBanner.classList.remove("hidden");
    const scanStartTime = performance.now();
    this.updateScanProgress(0, validFiles.length, null, "Pass 1: Biometric & Focus Verification");

    const newlyAnalyzed = [];
    const startIndex = this.photos.length;

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      try {
        const result = await window.CullingEngine.analyzeFile(file);
        result.id = startIndex + i;
        result.category = result.initialCategory;
        newlyAnalyzed.push(result);
        this.photos.push(result);

        // Update Futuristic HUD Telemetry Live
        if (this.scanThumbImg && result.url) {
          this.scanThumbImg.src = result.url;
        }
        if (this.scanCurrentFilename) {
          this.scanCurrentFilename.innerText = file.name;
        }
        if (this.scanFacesTelemetry) {
          this.scanFacesTelemetry.innerText = `${result.faceCount} Detected`;
        }
        if (this.scanFocusTelemetry) {
          this.scanFocusTelemetry.innerText = `${result.sharpness} Var`;
        }
        if (this.scanEarTelemetry) {
          this.scanEarTelemetry.innerText = result.closedEyesDetected ? 'Blink' : 'Open (0.24)';
        }

        // Live incremental UI update: photos appear live on screen and counters increment!
        this.updateUI();
      } catch (err) {
        console.warn("Error analyzing file:", file.name, err);
      }

      // Calculate real-time ETA & throughput
      const elapsedSec = (performance.now() - scanStartTime) / 1000;
      const avgPerFile = elapsedSec / (i + 1);
      const remainingFiles = validFiles.length - (i + 1);
      const remainingSec = Math.round(remainingFiles * avgPerFile);

      if (this.scanSpeedTelemetry && avgPerFile > 0) {
        const fps = Math.round(1 / avgPerFile);
        this.scanSpeedTelemetry.innerText = `Throughput: ~${Math.max(1, fps)} FPS`;
      }

      this.updateScanProgress(i + 1, validFiles.length, remainingSec, "Deep Dual-Pass Curation");
      // Deliberate high-precision inspection cadence (180ms per capture) for thorough scanning
      await new Promise((r) => setTimeout(r, 180));
    }

    try {
      // Duplicate clustering over entire collection
      let clustered = this.photos;
      try {
        clustered = window.CullingEngine.clusterDuplicates(this.photos);
      } catch (clusterErr) {
        console.warn("[PIXORA] Duplicate clustering error:", clusterErr);
      }
      
      // Apply initial categories from clustering for new photos
      clustered.forEach((p) => {
        if (!p.userOverridden) {
          p.category = p.initialCategory || "good";
        }
        if (!Array.isArray(p.reasons)) {
          p.reasons = [];
        }
      });

      this.photos = clustered;

      // If reference face is active, refresh person match counts
      if (this.referencePersonActive) {
        try {
          window.CullingEngine.recheckCapturesForPerson(this.photos);
        } catch (personErr) {
          console.warn("[PIXORA] Person recheck error:", personErr);
        }
      }
    } catch (e) {
      console.error("[PIXORA] Error processing captures:", e);
    } finally {
      this.isScanning = false;
      if (this.scannerBanner) {
        this.scannerBanner.classList.add("hidden");
      }
      this.updateUI();
    }
  }

  updateScanProgress(current, total, remainingSec = null, stageText = "Deep Dual-Pass Scanning") {
    const percent = Math.round((current / total) * 100);
    this.scanProgressBar.style.width = `${percent}%`;

    let etaString = "";
    if (remainingSec !== null && current > 1) {
      if (remainingSec >= 60) {
        const mins = Math.floor(remainingSec / 60);
        const secs = remainingSec % 60;
        etaString = ` • ETA: ~${mins}m ${secs}s remaining`;
      } else {
        etaString = ` • ETA: ~${remainingSec}s remaining`;
      }
    }

    this.scanProgressText.innerHTML = `
      <span class="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
      Analyzing captures... ${current} / ${total} (${percent}%)${etaString}
    `;
  }

  switchTab(tabKey) {
    this.activeTab = tabKey;
    this.selectedIds.clear();

    // Style active tab
    Object.keys(this.tabs).forEach((key) => {
      const tabEl = this.tabs[key];
      if (key === tabKey) {
        tabEl.classList.add("border-brand-500", "text-brand-300", "font-bold");
        tabEl.classList.remove("border-transparent", "text-slate-400");
      } else {
        tabEl.classList.remove("border-brand-500", "text-brand-300", "font-bold");
        tabEl.classList.add("border-transparent", "text-slate-400");
      }
    });

    // Show/hide bad photo filter pills
    if (this.filterContainer) {
      if (tabKey === "bad") {
        this.filterContainer.classList.remove("hidden");
      } else {
        this.filterContainer.classList.add("hidden");
      }
    }

    // Show/hide tab-specific buttons
    this.btnDeleteAllBad.classList.toggle("hidden", tabKey !== "bad");
    this.btnEmptyTrash.classList.toggle("hidden", tabKey !== "trash");

    this.renderGrid();
    this.updateSelectionToolbar();
  }

  getFilteredPhotos() {
    let filtered = this.photos.filter((p) => p.category === this.activeTab);

    // VIP Person Finder Filter
    if (this.filterMatchedPersonOnly) {
      filtered = filtered.filter((p) => p.isPersonMatch);
    }

    if (this.activeTab === "bad" && this.filterReason !== "all") {
      if (this.filterReason === "blink") {
        filtered = filtered.filter((p) => p.closedEyesDetected);
      } else if (this.filterReason === "blur") {
        filtered = filtered.filter((p) => p.isBlurry);
      } else if (this.filterReason === "dark") {
        filtered = filtered.filter((p) => p.isDark);
      }
    }

    // Prioritize matched person to show at the top of the collection
    if (this.referencePersonActive && !this.filterMatchedPersonOnly) {
      filtered.sort((a, b) => {
        if (a.isPersonMatch && !b.isPersonMatch) return -1;
        if (!a.isPersonMatch && b.isPersonMatch) return 1;
        return 0;
      });
    }

    return filtered;
  }

  renderGrid() {
    const photosToDisplay = this.getFilteredPhotos();

    if (photosToDisplay.length === 0) {
      this.photoGrid.innerHTML = "";
      this.emptyState.classList.remove("hidden");
      return;
    }

    this.emptyState.classList.add("hidden");
    this.photoGrid.innerHTML = "";

    photosToDisplay.forEach((photo) => {
      const card = document.createElement("div");
      const isMatched = photo.isPersonMatch;
      const isSelected = this.selectedIds.has(photo.id);
      let borderClass = "border-white/[0.08]";
      if (isSelected) {
        borderClass = "ring-2 ring-indigo-400 border-indigo-400 shadow-lg shadow-indigo-500/25";
      } else if (isMatched) {
        borderClass = "border-indigo-500/60 shadow-md shadow-indigo-500/15";
      }

      card.className = `photo-card group relative rounded-2xl overflow-hidden glass-panel border transition-all duration-300 ${borderClass}`;

      // Card Header Badges (Clean Typography & SVG)
      let badgeHTML = "";
      if (photo.category === "good") {
        badgeHTML = `<span class="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] px-2.5 py-0.5 rounded-full font-bold shadow-md backdrop-blur-md">Good</span>`;
      } else if (photo.category === "bad") {
        const reasonText = (photo.reasons && photo.reasons[0]) ? photo.reasons[0] : "Flawed";
        badgeHTML = `<span class="bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[11px] px-2.5 py-0.5 rounded-full font-bold shadow-md backdrop-blur-md">${reasonText}</span>`;
      } else if (photo.category === "duplicate") {
        badgeHTML = `<span class="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[11px] px-2.5 py-0.5 rounded-full font-bold shadow-md backdrop-blur-md">Duplicate</span>`;
      } else if (photo.category === "trash") {
        badgeHTML = `<span class="bg-neutral-800 text-neutral-400 border border-neutral-700 text-[11px] px-2.5 py-0.5 rounded-full font-bold shadow-md backdrop-blur-md">Discarded</span>`;
      }

      let personBadge = "";
      if (photo.isPersonMatch) {
        const confText = photo.personMatchConfidence ? `${photo.personMatchConfidence}%` : 'VIP';
        personBadge = `<span class="bg-indigo-600/90 text-indigo-100 border border-indigo-400/50 text-[10px] px-2 py-0.5 rounded-full font-bold shadow-md shadow-indigo-500/25 flex items-center gap-1 backdrop-blur-md">
          <svg class="w-3 h-3 text-indigo-300" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path></svg>
          ${confText} Match
        </span>`;
      }

      // Action buttons depending on current tab
      let actionButtons = "";
      if (photo.category === "good") {
        actionButtons = `
          <button title="Mark as Bad / Flawed" class="btn-move-bad px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/20 transition-all text-xs font-medium">
            Mark Bad
          </button>
          <button title="Move to Trash" class="btn-delete p-1.5 rounded-lg bg-white/[0.05] text-neutral-400 hover:bg-rose-500/20 hover:text-rose-400 border border-white/[0.06] transition-all text-xs">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </button>
        `;
      } else if (photo.category === "bad" || photo.category === "duplicate") {
        actionButtons = `
          <button title="Move to Good Photos" class="btn-move-good px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/30 transition-all text-xs font-semibold">
            Move to Good
          </button>
          <button title="Move to Trash" class="btn-delete p-1.5 rounded-lg bg-white/[0.05] text-neutral-400 hover:bg-rose-500/20 hover:text-rose-400 border border-white/[0.06] transition-all text-xs">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </button>
        `;
      } else if (photo.category === "trash") {
        actionButtons = `
          <button title="Restore Photo" class="btn-restore px-3 py-1 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500 hover:text-white border border-blue-500/30 transition-all text-xs font-medium">
            Restore
          </button>
        `;
      }

      card.innerHTML = `
        <!-- Checkbox Selection -->
        <div class="absolute top-2.5 left-2.5 z-10">
          <input type="checkbox" data-id="${photo.id}" class="photo-select-chk w-4 h-4 text-indigo-600 rounded bg-black/60 border-white/30 focus:ring-indigo-500 cursor-pointer shadow-md" ${
        this.selectedIds.has(photo.id) ? "checked" : ""
      } />
        </div>

        <!-- Badges on top-right -->
        <div class="absolute top-2.5 right-2.5 z-10 flex flex-wrap items-center justify-end gap-1.5 max-w-[85%]">
          ${personBadge}
          ${badgeHTML}
        </div>

        <!-- Thumbnail Image (Click to zoom/preview) -->
        <div class="aspect-[4/3] bg-black/40 overflow-hidden cursor-pointer relative img-container">
          <img src="${photo.url}" alt="${photo.name}" loading="lazy" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
            <span class="bg-white/10 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-md flex items-center gap-1.5 font-medium shadow-lg border border-white/20">Inspect Capture</span>
          </div>
        </div>

        <!-- Card Footer -->
        <div class="p-3 bg-white/[0.02] flex flex-col gap-2">
          <div class="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span class="truncate font-sans font-medium text-slate-300 max-w-[130px]" title="${photo.name}">${photo.name}</span>
            <span class="text-[11px] font-bold ${photo.poseScore >= 8.5 ? 'text-indigo-400' : 'text-slate-400'}">Pose: ${photo.poseScore || 7.5}/10</span>
          </div>
          <div class="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span class="truncate max-w-[120px] text-indigo-300 font-medium">${photo.expressionSummary || 'Natural'}</span>
            <span class="text-slate-500">${photo.framingVerdict || 'Balanced'}</span>
          </div>
          <div class="flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span class="${photo.memoryTier === 'Hero Capture' ? 'text-emerald-400 font-bold' : ''}">${photo.memoryTier || 'Standard'}</span>
            <span>Sharp: ${photo.sharpness}</span>
          </div>
          <div class="flex items-center justify-between pt-1.5 border-t border-white/[0.06]">
            ${actionButtons}
          </div>
        </div>
      `;

      // Event handlers for this card
      const imgContainer = card.querySelector(".img-container");
      imgContainer.addEventListener("click", () => this.openPreview(photo.id));

      const chk = card.querySelector(".photo-select-chk");
      chk.addEventListener("change", (e) => {
        if (e.target.checked) this.selectedIds.add(photo.id);
        else this.selectedIds.delete(photo.id);
        this.updateSelectionToolbar();
      });

      const btnGood = card.querySelector(".btn-move-good");
      if (btnGood) {
        btnGood.addEventListener("click", (e) => {
          e.stopPropagation();
          this.moveToCategory(photo.id, "good");
        });
      }

      const btnBad = card.querySelector(".btn-move-bad");
      if (btnBad) {
        btnBad.addEventListener("click", (e) => {
          e.stopPropagation();
          this.moveToCategory(photo.id, "bad");
        });
      }

      const btnDel = card.querySelector(".btn-delete");
      if (btnDel) {
        btnDel.addEventListener("click", (e) => {
          e.stopPropagation();
          this.moveToCategory(photo.id, "trash");
        });
      }

      const btnRestore = card.querySelector(".btn-restore");
      if (btnRestore) {
        btnRestore.addEventListener("click", (e) => {
          e.stopPropagation();
          this.moveToCategory(photo.id, "good");
        });
      }

      this.photoGrid.appendChild(card);
    });
  }

  moveToCategory(id, targetCategory) {
    const photo = this.photos.find((p) => p.id === id);
    if (!photo) return;
    photo.category = targetCategory;
    photo.userOverridden = true;
    this.updateUI();
  }

  bulkMoveTo(targetCategory) {
    if (this.selectedIds.size === 0) return;
    this.photos.forEach((p) => {
      if (this.selectedIds.has(p.id)) {
        p.category = targetCategory;
        p.userOverridden = true;
      }
    });
    this.selectedIds.clear();
    this.updateUI();
  }

  deleteAllBadPhotos() {
    const badCount = this.photos.filter((p) => p.category === "bad").length;
    if (badCount === 0) return;
    if (confirm(`Are you sure you want to discard all ${badCount} bad photos? (They can be restored from the Trash tab if needed).`)) {
      this.photos.forEach((p) => {
        if (p.category === "bad") {
          p.category = "trash";
          p.userOverridden = true;
        }
      });
      this.updateUI();
    }
  }

  emptyTrash() {
    const trashCount = this.photos.filter((p) => p.category === "trash").length;
    if (trashCount === 0) return;
    if (confirm(`Permanently remove all ${trashCount} discarded photos from session?`)) {
      this.photos = this.photos.filter((p) => p.category !== "trash");
      this.updateUI();
    }
  }

  toggleSelectAll() {
    const visiblePhotos = this.getFilteredPhotos();
    if (this.selectedIds.size === visiblePhotos.length && visiblePhotos.length > 0) {
      this.selectedIds.clear();
    } else {
      visiblePhotos.forEach((p) => this.selectedIds.add(p.id));
    }
    this.renderGrid();
    this.updateSelectionToolbar();
  }

  updateSelectionToolbar() {
    const count = this.selectedIds.size;
    if (count > 0) {
      this.selectionToolbar.classList.remove("hidden");
      this.selectedCountText.innerText = `${count} photos selected`;
    } else {
      this.selectionToolbar.classList.add("hidden");
    }
  }

  updateUI() {
    // Recalculate totals
    const total = this.photos.length;
    const good = this.photos.filter((p) => p.category === "good").length;
    const bad = this.photos.filter((p) => p.category === "bad").length;
    const duplicates = this.photos.filter((p) => p.category === "duplicate").length;
    const trash = this.photos.filter((p) => p.category === "trash").length;

    this.countTotal.innerText = total;
    this.countGood.innerText = good;
    this.countBad.innerText = bad;
    this.countDuplicates.innerText = duplicates;
    this.countTrash.innerText = trash;

    this.badgeGood.innerText = good;
    this.badgeBad.innerText = bad;
    this.badgeDuplicates.innerText = duplicates;
    this.badgeTrash.innerText = trash;

    // Enable/disable ZIP button
    this.btnDownloadZip.disabled = good === 0;

    this.updatePersonFinderUI();
    this.renderGrid();
  }

  // --- VIP PERSON FINDER & TARGET FACE PICKER ---
  async handleReferencePersonUpload(file) {
    if (!file) return;
    try {
      this.scanProgressText.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
        Analyzing reference portrait biometrics...
      `;
      this.scannerBanner.classList.remove("hidden");
      this.scanProgressBar.style.width = "40%";

      const faceData = await window.CullingEngine.detectAllFacesInReferencePhoto(file);
      this.scanProgressBar.style.width = "100%";
      setTimeout(() => {
        this.scannerBanner.classList.add("hidden");
      }, 400);

      if (!faceData || !faceData.faces || faceData.faces.length === 0) {
        throw new Error("No clear face detected in the reference photo. Please choose another portrait.");
      }

      if (faceData.faces.length === 1) {
        // Single person detected — lock immediately
        this.lockSelectedReferenceFace(faceData.faces[0]);
      } else {
        // Multiple persons detected (parent holding baby, couple, group) — open interactive face selector box modal
        this.openFacePicker(faceData);
        this.showToast(`Detected ${faceData.faces.length} faces. Click the box of the person to find.`, "info");
      }
    } catch (err) {
      this.scannerBanner.classList.add("hidden");
      this.showToast(err.message || "Could not detect a clear face. Try another photo.", "error");
    }
  }

  openFacePicker(faceData) {
    if (!this.facePickerModal || !faceData) return;
    this.facePickerRefImg.src = faceData.imgUrl;
    this.facePickerBoxesOverlay.innerHTML = "";
    this.facePickerCards.innerHTML = "";

    faceData.faces.forEach((face) => {
      // 1. Interactive clickable bounding box overlaid on the reference photo
      const box = document.createElement("div");
      box.className = "absolute border-2 border-indigo-400 hover:border-emerald-400 bg-indigo-500/20 hover:bg-emerald-500/30 rounded-xl cursor-pointer transition-all duration-200 group flex items-start justify-end p-1 shadow-lg";
      box.style.left = `${face.box.leftPercent}%`;
      box.style.top = `${face.box.topPercent}%`;
      box.style.width = `${face.box.widthPercent}%`;
      box.style.height = `${face.box.heightPercent}%`;
      
      box.innerHTML = `
        <span class="px-1.5 py-0.5 rounded bg-indigo-600/90 group-hover:bg-emerald-600 text-[10px] font-bold text-white shadow font-mono">
          #${face.index}
        </span>
      `;
      box.title = `Click to find Person #${face.index}`;
      box.addEventListener("click", () => this.lockSelectedReferenceFace(face));
      this.facePickerBoxesOverlay.appendChild(box);

      // 2. Selection Thumbnail Card beneath the image
      const card = document.createElement("div");
      card.className = "glass-panel p-2.5 rounded-2xl border border-white/10 hover:border-indigo-400/50 bg-white/[0.03] hover:bg-white/[0.08] transition-all flex flex-col items-center gap-2 cursor-pointer group";
      card.innerHTML = `
        <div class="w-16 h-16 rounded-xl overflow-hidden border border-white/20 group-hover:border-indigo-400 shadow">
          <img src="${face.cropUrl}" alt="Person #${face.index}" class="w-full h-full object-cover" />
        </div>
        <div class="text-[11px] font-bold text-white">Person #${face.index}</div>
        <button type="button" class="w-full py-1 px-2 rounded-lg bg-indigo-600 group-hover:bg-emerald-600 text-white font-semibold text-[10px] transition-colors shadow">
          Select This Face
        </button>
      `;
      card.addEventListener("click", () => this.lockSelectedReferenceFace(face));
      this.facePickerCards.appendChild(card);
    });

    this.facePickerModal.classList.remove("hidden");
  }

  closeFacePicker() {
    if (this.facePickerModal) {
      this.facePickerModal.classList.add("hidden");
    }
  }

  lockSelectedReferenceFace(face) {
    window.CullingEngine.applyReferenceSignature(face.signature, face.cropUrl);
    this.referencePersonActive = true;
    if (this.personAvatarImg) {
      this.personAvatarImg.src = face.cropUrl;
    }
    this.closeFacePicker();

    // Recheck album captures against this locked target face
    const matchCount = window.CullingEngine.recheckCapturesForPerson(this.photos);
    // Automatically filter to show only this person's photos
    if (matchCount > 0) {
      this.filterMatchedPersonOnly = true;
    }
    this.updatePersonFinderUI(matchCount);
    this.renderGrid();

    this.showToast(`Person locked! Filtered ${matchCount} capture${matchCount === 1 ? '' : 's'}.`, "success");
  }

  showToast(message, type = "info") {
    if (!this.toastContainer) return;
    const toast = document.createElement("div");
    
    let borderCls = "border-white/10";
    let bgCls = "bg-slate-900/90";
    let textCls = "text-white";
    let iconSvg = "";

    if (type === "success") {
      borderCls = "border-emerald-500/40";
      bgCls = "bg-emerald-950/90";
      textCls = "text-emerald-200";
      iconSvg = `<svg class="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
    } else if (type === "error") {
      borderCls = "border-rose-500/40";
      bgCls = "bg-rose-950/90";
      textCls = "text-rose-200";
      iconSvg = `<svg class="w-4 h-4 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;
    } else if (type === "warning") {
      borderCls = "border-amber-500/40";
      bgCls = "bg-amber-950/90";
      textCls = "text-amber-200";
      iconSvg = `<svg class="w-4 h-4 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`;
    } else {
      borderCls = "border-indigo-500/40";
      bgCls = "bg-indigo-950/90";
      textCls = "text-indigo-200";
      iconSvg = `<svg class="w-4 h-4 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
    }

    toast.className = `pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-2xl ${bgCls} ${borderCls} border shadow-xl backdrop-blur-md text-xs font-medium ${textCls} transition-all duration-300 translate-y-2 opacity-0`;
    toast.innerHTML = `${iconSvg}<span>${message}</span>`;
    
    this.toastContainer.appendChild(toast);
    
    requestAnimationFrame(() => {
      toast.classList.remove("translate-y-2", "opacity-0");
    });

    setTimeout(() => {
      toast.classList.add("translate-y-2", "opacity-0");
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  }

  clearReferencePerson() {
    window.CullingEngine.clearReferenceFace();
    this.referencePersonActive = false;
    this.filterMatchedPersonOnly = false;
    this.photos.forEach(p => p.isPersonMatch = false);
    if (this.personInput) this.personInput.value = "";
    this.updatePersonFinderUI();
    this.renderGrid();
    this.showToast("Reference person cleared.", "info");
  }

  updatePersonFinderUI(matchCountOverride) {
    if (!this.personActiveCard) return;

    if (this.referencePersonActive && window.CullingEngine.hasReferenceFace()) {
      this.personActiveCard.classList.remove("hidden");
      const count = matchCountOverride !== undefined ? matchCountOverride : this.photos.filter(p => p.isPersonMatch).length;
      if (this.personMatchCountText) {
        this.personMatchCountText.innerText = `${count} capture${count === 1 ? '' : 's'} matched`;
      }
      if (this.btnFilterMatchedOnly) {
        if (this.filterMatchedPersonOnly) {
          this.btnFilterMatchedOnly.className = "px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white border border-indigo-400 font-semibold text-xs shadow-md shadow-indigo-500/30 transition-all flex items-center gap-1.5";
          this.btnFilterMatchedText.innerText = "Showing: Matched Person Only";
        } else {
          this.btnFilterMatchedOnly.className = "px-3.5 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-slate-200 border border-white/10 font-semibold text-xs transition-all flex items-center gap-1.5";
          this.btnFilterMatchedText.innerText = "Filter: Only This Person";
        }
      }
    } else {
      this.personActiveCard.classList.add("hidden");
      this.filterMatchedPersonOnly = false;
    }
  }

  async exportPersonPhotosZip() {
    const personPhotos = this.photos.filter(p => p.isPersonMatch && p.category === "good");
    if (personPhotos.length === 0) {
      const anyPersonPhotos = this.photos.filter(p => p.isPersonMatch);
      if (anyPersonPhotos.length === 0) {
        this.showToast("No photos containing this person were detected in your loaded album.", "warning");
      } else {
        this.showToast(`Found ${anyPersonPhotos.length} photo(s) of this person, but none are currently in the 'Good' tab.`, "warning");
      }
      return;
    }

    this.zipModal.classList.remove("hidden");
    this.zipProgressBar.style.width = "0%";
    this.zipProgressText.innerText = "Exporting matched person captures...";

    try {
      await window.ZipExporter.exportPhotos(
        personPhotos,
        (percent) => {
          this.zipProgressBar.style.width = `${percent}%`;
          this.zipProgressText.innerText = `Compressing ${personPhotos.length} captures... ${percent}%`;
        },
        "Pixora_Target_Person_Captures.zip"
      );
      this.zipProgressText.innerText = "Download Ready";
      setTimeout(() => {
        this.zipModal.classList.add("hidden");
        this.showToast("VIP person archive downloaded successfully!", "success");
      }, 1500);
    } catch (err) {
      this.showToast("Error generating VIP person archive: " + err.message, "error");
      this.zipModal.classList.add("hidden");
    }
  }

  // --- PREVIEW MODAL ---
  openPreview(id) {
    this.previewPhotoId = id;
    this.updatePreviewContent();
    this.previewModal.classList.remove("hidden");
  }

  closePreview() {
    this.previewModal.classList.add("hidden");
    this.previewPhotoId = null;
  }

  navigatePreview(direction) {
    const currentList = this.getFilteredPhotos();
    if (currentList.length === 0) return;
    const currentIndex = currentList.findIndex((p) => p.id === this.previewPhotoId);
    let nextIndex = currentIndex + direction;
    if (nextIndex < 0) nextIndex = currentList.length - 1;
    if (nextIndex >= currentList.length) nextIndex = 0;
    this.previewPhotoId = currentList[nextIndex].id;
    this.updatePreviewContent();
  }

  updatePreviewContent() {
    const photo = this.photos.find((p) => p.id === this.previewPhotoId);
    if (!photo) {
      this.closePreview();
      return;
    }

    this.previewImg.src = photo.url;
    this.previewTitle.innerText = photo.name;
    const matchMetric = photo.isPersonMatch ? ` | Target Match: ${photo.personMatchConfidence || 95}%` : '';
    this.previewMetrics.innerText = `Pose: ${photo.poseScore || 7.5}/10 | ${photo.framingVerdict || 'Balanced'} | ${photo.expressionSummary || 'Natural'} | ${photo.memoryTier || 'Standard'} | Sharpness: ${photo.sharpness}${matchMetric}`;

    // Badge styling in modal
    if (photo.category === "good") {
      this.previewCategoryBadge.className = "px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
      this.previewCategoryBadge.innerText = "Good Capture";
    } else if (photo.category === "bad") {
      this.previewCategoryBadge.className = "px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30";
      const reasonsList = (Array.isArray(photo.reasons) && photo.reasons.length > 0) ? photo.reasons.join(", ") : "Flawed";
      this.previewCategoryBadge.innerText = `Flawed (${reasonsList})`;
    } else if (photo.category === "duplicate") {
      this.previewCategoryBadge.className = "px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30";
      this.previewCategoryBadge.innerText = "Duplicate Twin";
    } else {
      this.previewCategoryBadge.className = "px-3 py-1 rounded-full text-xs font-bold bg-neutral-800 text-neutral-300 border border-neutral-700";
      this.previewCategoryBadge.innerText = "Discarded";
    }
  }

  // --- ZIP EXPORT ---
  async startZipDownload() {
    const goodPhotos = this.photos.filter((p) => p.category === "good");
    if (goodPhotos.length === 0) {
      this.showToast("No approved good photos available to download!", "warning");
      return;
    }

    this.zipModal.classList.remove("hidden");
    this.zipProgressBar.style.width = "0%";
    this.zipProgressText.innerText = "Preparing archive...";

    try {
      await window.ZipExporter.exportPhotos(
        goodPhotos,
        (percent) => {
          this.zipProgressBar.style.width = `${percent}%`;
          this.zipProgressText.innerText = `Compressing photos... ${percent}%`;
        },
        "Pixora_Selected_Photos.zip"
      );
      this.zipProgressText.innerText = "Download Ready";
      setTimeout(() => {
        this.zipModal.classList.add("hidden");
        this.showToast("Album archive downloaded successfully!", "success");
      }, 1500);
    } catch (err) {
      this.showToast("Error generating ZIP package: " + err.message, "error");
      this.zipModal.classList.add("hidden");
    }
  }
}

// Bootstrap on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  window.app = new PhotoCullerApp();
});
