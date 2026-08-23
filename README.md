<div align="center">

  <img src="https://github.com/satyam-umrao/ToolNest-AI/blob/fe69a2b4ca13c58e405aff8d4cb525bc71df18da/public/logo-icon.png" alt="ToolNest AI" width="150" />

  <p align="center">
    <strong>Enterprise-grade, privacy-first document and image intelligence engine running 100% in-browser with $0 infrastructure overhead.</strong>
  </p>

  <p align="center">
    <a href="https://github.com/Technologies-Satyam/toolnest-ai/blob/main/LICENSE">
      <img src="https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge" alt="License: MIT" />
    </a>
    <a href="https://nextjs.org/">
      <img src="https://img.shields.io/badge/Next.js-14.1-black.svg?style=for-the-badge&logo=next.js" alt="Next.js 14" />
    </a>
    <a href="https://www.typescriptlang.org/">
      <img src="https://img.shields.io/badge/TypeScript-5.3-3178C6.svg?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    </a>
    <a href="https://tailwindcss.com/">
      <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    </a>
    <a href="https://webassembly.org/">
      <img src="https://img.shields.io/badge/WebAssembly-Wasm-654FF0.svg?style=for-the-badge&logo=webassembly&logoColor=white" alt="WebAssembly" />
    </a>
    <a href="https://github.com/Technologies-Satyam">
      <img src="https://img.shields.io/badge/Maintained_By-Technologies_Satyam-indigo.svg?style=for-the-badge" alt="Technologies Satyam" />
    </a>
  </p>

  <h3>
    <a href="#-architecture--sandboxing">Architecture</a>
    <span> | </span>
    <a href="#-core-tool-suites">Features</a>
    <span> | </span>
    <a href="#-mathematical-foundation">Engine Specs</a>
    <span> | </span>
    <a href="#-quick-start">Quick Start</a>
    <span> | </span>
    <a href="#-benchmarks--security">Security</a>
  </h3>

</div>

---

## 🌟 Executive Summary

**ToolNest AI** is a client-side document manipulation and computer vision platform engineered by **[Technologies Satyam](https://github.com/Technologies-Satyam)**. Built on top of **Next.js 14 App Router, WebAssembly, HTML5 Canvas 2D/WebGL, and Framer Motion**, ToolNest AI eliminates backend computing costs by delegating compute-heavy operations directly to the client's local CPU and GPU.

```mermaid
graph TD
    subgraph Browser ["User Browser Runtime"]
        UI["Client Device / User Interface"]

        subgraph Sandbox ["100% In-Browser Memory Sandbox"]
            MEM_BUF["Local Memory Buffer"]
            WASM_GPU["Wasm / Canvas / GPU Engine"]
            
            subgraph Features ["Guarantees & Performance"]
                SEC["✖ ZERO Server Uploads<br/>✖ ZERO File Retention"]
                TEL["✖ ZERO Telemetry<br/>✖ ZERO API Quotas"]
                PERF["✔ $0 Server Cost<br/>✔ Sub-10ms Latency"]
            end
        end

        UI -->|Input Data| MEM_BUF
        MEM_BUF --> WASM_GPU
        WASM_GPU --> Features
    end
```

---

## ⚡ Core Value Pillars

| Pillar           | Industry Standard                                | ToolNest AI Standard                               |
| :--------------- | :----------------------------------------------- | :------------------------------------------------- |
| **Server Cost**  | $0.005 – $0.05 per document processing API call  | **$0.00 Forever** (Runs on user's device)          |
| **Data Privacy** | File uploads stored on third-party cloud servers | **100% Air-Gapped** (Zero data leaves browser)     |
| **Latency**      | Network roundtrip upload + queue wait + download | **Sub-millisecond** (In-memory execution)          |
| **Compliance**   | Requires complex HIPAA/GDPR data processing DPA  | **Zero-Liability** (No data ingested or processed) |
| **File Limits**  | Strict 25MB–50MB API paywalls                    | **Unlimited** (Bound only by client device RAM)    |

---

## 🛡️ Architecture & Sandboxing

```mermaid
graph TD
    subgraph Browser ["User Browser Runtime (V8 Engine)"]
        UI["React 18 / Next.js 14 UI (Framer Motion 60FPS)"]

        subgraph Sandbox ["Isolated Memory Sandbox (Zero Network Exfiltration)"]
            PDF_LIB["pdf-lib In-Memory Parser"]
            CANVAS_ENGINE["Canvas 2D / WebGL Pixel Engine"]
            WASM_AI["WebAssembly AI Runtime"]
            REV_ALPHA["Reverse Alpha Blending Engine"]
        end

        UI --> PDF_LIB
        UI --> CANVAS_ENGINE
        UI --> WASM_AI
        UI --> REV_ALPHA
    end

    Files["User Files (PDF, PNG, JPG, WebP)"] -->|File Reader API| Sandbox
    Sandbox -->|Blob Object URL| Export["Instant 1-Click Client Export"]
```

---

## 🛠️ Core Tool Suites

### 1. 📄 PDF Intelligence Suite (`/pdf`)

_Powered by pure in-memory `pdf-lib` byte stream parser:_

- **Multi-Document Merge**: Sequentially stitches PDF byte streams without server uploads.
- **Split & Extraction**: Extracts custom page ranges with instantaneous binary slicing.
- **Page Sorter & Deletion**: Drag-and-drop live thumbnail page matrix with index reordering.
- **Image-to-PDF Engine**: Compiles mixed-format image arrays (`PNG`, `JPG`, `WebP`) into ISO-compliant PDFs.
- **Annotation & Stamping Layer**: Vector text stamping, digital signatures, and watermark insertion.

### 2. 🖼️ Computer Vision Image Suite (`/image`)

_Hardware-accelerated pixel manipulation via HTML5 Canvas 2D:_

- **Aspect-Locked Cropper**: Bounding box geometry supporting `1:1`, `16:9`, `4:3`, `9:16`, and freeform.
- **Lossless Matrix Resizer**: Bilinear pixel resampling with dynamic format conversion (`PNG`, `JPEG`, `WebP`).
- **Affine Transforms**: Matrix rotations (90°, 180°, 270°) with horizontal/vertical axis flipping.
- **Parametric Filters**: Hardware-composited adjustments for brightness, contrast, saturation, and sharpness.
- **In-Browser Background Removal**: Lightweight WebAssembly AI inference executing locally.

### 3. 🎯 Color Intelligence & Loupe (`/color-picker`)

_Pixel-level screen and image inspection:_

- **Native EyeDropper API**: Universal 1-click screen color sampling across external desktop windows and tabs.
- **Floating Optical Loupe**: Real-time canvas pixel magnification with live RGB/HEX coordinate inspection.
- **K-Means Palette Extractor**: Quantizes image palettes into dominant brand swatches with 1-click clipboard copying (`HEX`, `RGB`, `HSL`, `CMYK`).

### 4. ✨ Gemini AI Watermark Remover (`/watermark`)

_Mathematical Reverse Alpha Blending Engine:_

- **Reverse Alpha De-Blending**: Inverts semi-transparent watermark overlays with zero generative hallucinations.
- **Split Comparison Slider**: Real-time before/after interactive comparison viewport.
- **Batch Processing Array**: Multi-threaded batch clearing with 1-click PNG bundle downloads.
- **Magic Inpainter**: Interactive localized brush for manual pixel restoration.

---

## 📐 Mathematical Foundation: Reverse Alpha Blending

Traditional watermark removers use generative AI inpainting, which blurs or hallucinates pixel values. ToolNest AI implements mathematical **Reverse Alpha Blending**:

Given the standard alpha compositing formula:
$$C_{\text{watermarked}} = \alpha \times C_{\text{logo}} + (1 - \alpha) \times C_{\text{original}}$$

Where $C_{\text{logo}} = 255$ (pure white watermark overlay) and $\alpha$ is the calibrated opacity layer, ToolNest AI solves for the original lossless pixel value:

$$C_{\text{original}} = \frac{C_{\text{watermarked}} - \alpha \times 255}{1 - \alpha}$$

```typescript
// Core Reverse Alpha Transform
export function reverseAlpha(
  watermarkedColor: number,
  alpha: number,
  logoColor = 255,
): number {
  if (alpha >= 1.0) return watermarkedColor;
  const original = (watermarkedColor - alpha * logoColor) / (1 - alpha);
  return Math.min(255, Math.max(0, Math.round(original)));
}
```

---

## 🚀 Quick Start

### System Requirements

- **Node.js**: `18.0.0` or higher
- **Package Manager**: `npm` (>= 9.0) or `pnpm` (>= 8.0)

### 1. Clone & Enter Project

```bash
git clone https://github.com/Technologies-Satyam/toolnest-ai.git
cd toolnest-ai/ToolNest-AI
```

### 2. Install Dependencies

```bash
npm install --legacy-peer-deps
```

### 3. Launch Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

---

## 📦 Production Build & Static Deployment

ToolNest AI can be deployed to any static host with **$0 server footprint**:

```bash
# Type check and generate production static pages
npm run build

# Start local production preview
npm run start
```

### Deployment Targets:

- **Vercel**: 1-click zero-config deployment.
- **Cloudflare Pages**: High-speed edge distribution.
- **Netlify**: Automatic static CI/CD pipeline.
- **GitHub Pages**: Static export hosting.

---

## 🔒 Security & Privacy Benchmark

```
[Security Model Analysis]
─────────────────────────────────────────────────────────────────────────────
Network Traffic During Processing:   0 Bytes (Zero external HTTP POST requests)
Data at Rest:                        0 Bytes (In-memory ArrayBuffers only)
Data in Transit:                     0 Bytes (Local execution only)
GDPR / HIPAA / SOC2 Compliance:      Natively Compliant (Zero Data Collection)
─────────────────────────────────────────────────────────────────────────────
```

---

## 🏢 Organization & Maintainers

Maintained with ❤️ by **[Technologies Satyam](https://github.com/Technologies-Satyam)**.

- **GitHub**: [@Technologies-Satyam](https://github.com/Technologies-Satyam)
- **Engine Source**: [GargantuaX/gemini-watermark-remover](https://github.com/GargantuaX/gemini-watermark-remover)
- **License**: [MIT License](LICENSE)

---

<div align="center">
  <sub>© 2026 Technologies Satyam. ToolNest AI is free, open-source, and privacy-first software.</sub>
</div>
