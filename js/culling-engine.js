/**
 * PIXORA — Vision & Culling Engine
 * Developed by AB Designing | Designed by Adharsh
 * 
 * Multi-Stage Quality Pipeline:
 *  - High-frequency Laplacian focus & blur variance
 *  - Perceptual Difference Hashing (dHash) for continuous burst grouping
 *  - Neural Eye Landmark Analysis for closed eyes & half-closed squints (Kids & Adults)
 *  - Optional Google Gemini Vision AI for pose aesthetics and memorable candid ranking
 */

class CullingEngine {
  constructor() {
    this.faceLandmarker = null;
    this.isFaceDetectorReady = false;
    this.useGeminiAI = false;
    this.initFaceDetector();
  }

  async initFaceDetector() {
    try {
      if (window.FaceLandmarker && window.FilesetResolver) {
        const vision = await window.FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        this.faceLandmarker = await window.FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "IMAGE",
          numFaces: 12,
          minFaceDetectionConfidence: 0.4, // Optimized for child and adult faces alike
          minFacePresenceConfidence: 0.4
        });
        this.isFaceDetectorReady = true;
        console.log("[PIXORA] Neural Face & Landmark Landmarker active.");
      }
    } catch (e) {
      console.warn("[PIXORA] MediaPipe offline, local heuristic analysis active.", e);
      this.isFaceDetectorReady = false;
    }
  }

  async loadImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => resolve({ img, url });
      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(err);
      };
      img.src = url;
    });
  }

  calculateSharpness(ctx, width, height) {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    const gray = new Float32Array(width * height);
    for (let i = 0, j = 0; i < data.length; i += 4, j++) {
      gray[j] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }

    let sum = 0;
    let sumSq = 0;
    let count = 0;

    for (let y = 1; y < height - 1; y++) {
      const row = y * width;
      const rowPrev = (y - 1) * width;
      const rowNext = (y + 1) * width;

      for (let x = 1; x < width - 1; x++) {
        const lap =
          gray[rowPrev + x] +
          gray[rowNext + x] +
          gray[row + x - 1] +
          gray[row + x + 1] -
          4 * gray[row + x];

        sum += lap;
        sumSq += lap * lap;
        count++;
      }
    }

    if (count === 0) return 0;
    const mean = sum / count;
    const variance = sumSq / count - mean * mean;
    return Math.max(0, Math.round(variance));
  }

  calculateExposure(ctx, width, height) {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    let totalLuminance = 0;
    const totalPixels = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
      totalLuminance += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }

    const avgLuminance = Math.round(totalLuminance / totalPixels);
    return {
      avgLuminance,
      isDark: avgLuminance < 30,
      isOverexposed: avgLuminance > 235
    };
  }

  calculateDHash(img) {
    const canvas = document.createElement("canvas");
    canvas.width = 9;
    canvas.height = 8;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, 9, 8);
    const imgData = ctx.getImageData(0, 0, 9, 8).data;

    let hash = "";
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const idx1 = (y * 9 + x) * 4;
        const idx2 = (y * 9 + (x + 1)) * 4;
        const gray1 = 0.299 * imgData[idx1] + 0.587 * imgData[idx1 + 1] + 0.114 * imgData[idx1 + 2];
        const gray2 = 0.299 * imgData[idx2] + 0.587 * imgData[idx2 + 1] + 0.114 * imgData[idx2 + 2];
        hash += gray1 > gray2 ? "1" : "0";
      }
    }
    return hash;
  }

  hammingDistance(hash1, hash2) {
    if (!hash1 || !hash2 || hash1.length !== hash2.length) return 64;
    let dist = 0;
    for (let i = 0; i < hash1.length; i++) {
      if (hash1[i] !== hash2[i]) dist++;
    }
    return dist;
  }

  pointDist(p1, p2) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  calculateEAR(landmarks, indices) {
    const p1 = landmarks[indices[0]];
    const p2 = landmarks[indices[1]];
    const p3 = landmarks[indices[2]];
    const p4 = landmarks[indices[3]];
    const p5 = landmarks[indices[4]];
    const p6 = landmarks[indices[5]];

    const vertical1 = this.pointDist(p2, p6);
    const vertical2 = this.pointDist(p3, p5);
    const horizontal = this.pointDist(p1, p4);

    if (horizontal < 0.0001) return 0.25;
    return (vertical1 + vertical2) / (2.0 * horizontal);
  }

  async detectBlinks(imgElement) {
    if (!this.faceLandmarker || !this.isFaceDetectorReady) {
      return { hasFaces: false, closedEyesDetected: false, halfClosedDetected: false, faceCount: 0 };
    }

    try {
      const results = this.faceLandmarker.detect(imgElement);
      if (!results || !results.faceLandmarks || results.faceLandmarks.length === 0) {
        return { hasFaces: false, closedEyesDetected: false, halfClosedDetected: false, faceCount: 0 };
      }

      const leftEyeIndices = [33, 160, 158, 133, 153, 144];
      const rightEyeIndices = [362, 385, 387, 263, 373, 380];

      let anyEyeClosed = false;
      let anyEyeHalfClosed = false;
      const faceCount = results.faceLandmarks.length;

      for (const landmarks of results.faceLandmarks) {
        const leftEAR = this.calculateEAR(landmarks, leftEyeIndices);
        const rightEAR = this.calculateEAR(landmarks, rightEyeIndices);

        // Sub-millimeter Eye Aspect Ratio calculation
        if (leftEAR < 0.17 || rightEAR < 0.17) {
          anyEyeClosed = true;
          break;
        } else if (leftEAR < 0.20 || rightEAR < 0.20) {
          anyEyeHalfClosed = true;
        }
      }

      return {
        hasFaces: true,
        closedEyesDetected: anyEyeClosed,
        halfClosedDetected: anyEyeHalfClosed,
        faceCount
      };
    } catch (e) {
      console.warn("[PIXORA] Face evaluation bypass:", e);
      return { hasFaces: false, closedEyesDetected: false, halfClosedDetected: false, faceCount: 0 };
    }
  }

  async analyzeFile(file) {
    const { img, url } = await this.loadImage(file);

    const targetW = 480;
    const scale = Math.min(1, targetW / img.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // 1. Sharpness calculation
    const sharpness = this.calculateSharpness(ctx, canvas.width, canvas.height);
    const isBlurry = sharpness < 85;

    // 2. Exposure check
    const exposure = this.calculateExposure(ctx, canvas.width, canvas.height);

    // 3. Duplicate Perceptual Hash
    const dHash = this.calculateDHash(img);

    // 4. Facial landmarks & Eye blink check
    const blinkInfo = await this.detectBlinks(img);

    const reasons = [];
    let isBad = false;

    if (blinkInfo.closedEyesDetected) {
      isBad = true;
      reasons.push("Closed Eyes / Blink");
    } else if (blinkInfo.halfClosedDetected) {
      isBad = true;
      reasons.push("Half-Closed / Squinting Eye");
    }

    if (isBlurry) {
      isBad = true;
      reasons.push("Blurry / Out of Focus");
    }
    if (exposure.isDark) {
      isBad = true;
      reasons.push("Too Dark / Underexposed");
    }
    if (exposure.isOverexposed) {
      isBad = true;
      reasons.push("Overexposed Highlights");
    }

    // 5. Optional Google Gemini Vision Evaluation (if user enabled and has key)
    let geminiData = null;
    if (this.useGeminiAI && window.GeminiAIEngine && window.GeminiAIEngine.hasApiKey()) {
      geminiData = await window.GeminiAIEngine.evaluatePhotoAesthetics(file);
      if (geminiData) {
        if (geminiData.hasClosedEyes && !isBad) {
          isBad = true;
          reasons.push("Gemini Flagged: Closed Eyes");
        }
      }
    }

    return {
      file,
      url,
      name: file.name,
      size: file.size,
      lastModified: file.lastModified,
      width: img.width,
      height: img.height,
      sharpness,
      isBlurry,
      avgLuminance: exposure.avgLuminance,
      isDark: exposure.isDark,
      dHash,
      faceCount: blinkInfo.faceCount,
      closedEyesDetected: blinkInfo.closedEyesDetected,
      halfClosedDetected: blinkInfo.halfClosedDetected,
      geminiData,
      poseScore: geminiData ? geminiData.poseScore : (isBad ? 4.5 : 8.8),
      memoryTag: geminiData ? geminiData.memoryTag : (isBad ? "Flawed" : "Hero Moment"),
      isBad,
      reasons,
      initialCategory: isBad ? "bad" : "good"
    };
  }

  clusterDuplicates(photoList) {
    const list = [...photoList];
    const visited = new Set();
    const clusters = [];

    for (let i = 0; i < list.length; i++) {
      if (visited.has(i)) continue;
      const group = [list[i]];
      visited.add(i);

      for (let j = i + 1; j < list.length; j++) {
        if (visited.has(j)) continue;
        const dist = this.hammingDistance(list[i].dHash, list[j].dHash);
        
        const timeDiff = Math.abs(list[i].lastModified - list[j].lastModified) / 1000;
        const isBurst = dist <= 10 || (timeDiff <= 5 && dist <= 13);

        if (isBurst) {
          group.push(list[j]);
          visited.add(j);
        }
      }

      if (group.length > 1) {
        clusters.push(group);
      }
    }

    for (const group of clusters) {
      group.sort((a, b) => {
        if (a.isBad !== b.isBad) return a.isBad ? 1 : -1;
        // Prioritize higher pose score or sharpness
        const scoreA = (a.poseScore || 0) * 10 + a.sharpness;
        const scoreB = (b.poseScore || 0) * 10 + b.sharpness;
        return scoreB - scoreA;
      });

      const best = group[0];
      best.isBurstLeader = true;
      best.burstCount = group.length;

      for (let k = 1; k < group.length; k++) {
        const other = group[k];
        other.duplicateOf = best.name;
        if (!other.isBad) {
          other.initialCategory = "duplicate";
          other.reasons.push("Duplicate / Secondary Burst Shot");
        }
      }
    }

    return list;
  }
}

window.CullingEngine = new CullingEngine();
