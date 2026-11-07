# PIXORA
> **"Find the Best. Skip the Rest."**  
> *A Flagship Product of AB Designing | Designed by Adharsh*

An intelligent, air-gapped photo curation platform designed for professional wedding and event photographers. Effortlessly filter out blinks, squinting kids, blurry shots, and duplicate burst sequences in seconds on your own device.

---

## 💎 Features & Capabilities

- **Children & Group Blink Detection**:
  - Neural multi-face landmark tracking across up to 12 subjects simultaneously.
  - Distinguishes joyful smiling squints from awkward half-closed lids and true blinks.
- **Burst Sequence Clustering**:
  - Automatically groups rapid-fire captures using Perceptual Difference Hashing (dHash) and isolates the sharpest frame.
- **Google Gemini 1.5 Flash Vision Ready (Optional BYOK)**:
  - Bring your free Google AI Studio key to unlock neural pose scoring, candid memory highlights ("Cherished Moment", "Kids Candid"), and emotional expression ranking.
  - If no key is provided, PIXORA runs 100% locally with zero external network dependencies.
- **Air-Gapped Privacy Architecture**:
  - 0 Bytes transmitted to any external server. Complete confidentiality for your clients' private wedding photos.
- **One-Click Client ZIP Export**:
  - Directly packages curated high-resolution photos into a clean ZIP archive in-browser.

---

## 🚀 How to Run Locally

1. Double-click `start.bat` in the project directory, or run:
   ```bash
   node server.js
   ```
2. Open your browser:
   - **Local PC**: [http://localhost:3000](http://localhost:3000)
   - **Mobile on Wi-Fi**: `http://192.168.1.6:3000`

---

## ⚡ Deploying to Vercel

PIXORA is pre-configured and 100% **Vercel-ready**:
1. Push this folder to your GitHub repository.
2. Import the repository in [Vercel](https://vercel.com).
3. Click **Deploy**! (Pre-configured `vercel.json` included).
