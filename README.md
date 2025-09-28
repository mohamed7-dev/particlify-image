# 🎆 particlify-image
A lightweight React component that transforms any image into a beautiful animated **particle visualization**.  
Built with **TypeScript**, **React**, and **Vite**.

---

## ✨ Features

- 🎨 Convert any image into particles.
- ⚡ Built with React + TypeScript.
---
## 🧩 TypeScript

This package ships with type declarations. You can import the props type if needed:

```ts
import type { ParticlifyImageProps } from "particlify-image";
```
---
## 🛠️ Environment Notes

- **Peer deps**: React 19 is a peer dependency. Ensure your app uses compatible versions of `react` and `react-dom`.
- **SSR**: The component draws to a `<canvas>` and uses browser APIs (e.g., `window`, `OffscreenCanvas`). Use it in client‑side contexts.
- **Styling**: The canvas has no default size beyond what you pass in `width` and `height`. Wrap it in a container if you need layout control.

---
## 📦 Installation

```bash
npm install particlify-image
```
---
## 🚀 Usage

Basic example in a React component:

```tsx
import React from "react";
import { ParticlifyImage } from "particlify-image";

export default function Hero() {
  return (
    <div style={{ width: 800, height: 500 }}>
      <ParticlifyImage
        width={800}
        height={500}
        src="https://images.unsplash.com/photo-1511485977113-f34c92461ad9?auto=format&fit=crop&w=1170&q=80"
        particleSize={2}
        // particlesCount is optional; see behavior below
        // particlesCount={3000}
      />
    </div>
  );
}
```
You can use both remote and local images. For local assets, ensure they resolve to a valid URL at runtime (e.g., via your bundler or a public folder).

---
## 📘 API

`<ParticlifyImage />`

- **`width`** (number) – Canvas width in pixels. Required.
- **`height`** (number) – Canvas height in pixels. Required.
- **`src`** (string) – Image URL or path. Required.
- **`particleSize`** (number) – Radius of each particle in pixels. Required.
- **`particlesCount`** (number, optional) – Target number of particles to render.
  - If omitted, an automatic budget is computed from canvas area and particle size for good performance.
  - If provided, it's capped by the number of opaque pixels in the source image.

---
## 🧠 How it works (high‑level)

- The image is downloaded and sampled on an offscreen canvas.
- Transparent pixels (alpha ≤ 128) are ignored.
- Opaque pixels become particles positioned proportionally inside your canvas, with their color taken from the image.
- Mouse movement gently pushes nearby particles; they smoothly drift back to their base positions.
- For detailed images, sampling is automatically downscaled and/or downsampled to keep performance smooth.

---
## ⚙️ Behavior & Performance

- **Auto particle cap**: When `particlesCount` is not provided, the component computes a sensible cap based on canvas area and `particleSize`, with a safety ceiling to prevent overload.
- **Downscaling**: Large images are downscaled during sampling to avoid creating a particle for every pixel on very high‑resolution sources.
- **Interactivity radius**: Particles react to the mouse within a dynamic radius derived from canvas size.
- **Tips**:
  - Prefer reasonable canvas sizes (e.g., up to ~1200×800 for most use cases).
  - Increase `particleSize` to reduce particle count and draw calls.
  - If needed, explicitly set `particlesCount` to balance quality/performance.

---
## 🧩 TypeScript

This package ships with type declarations. You can import the props type if needed:

```ts
import type { ParticlifyImageProps } from "particlify-image";
```
---
## 🛠️ Environment Notes

- **Peer deps**: React 19 is a peer dependency. Ensure your app uses compatible versions of `react` and `react-dom`.
- **SSR**: The component draws to a `<canvas>` and uses browser APIs (e.g., `window`, `OffscreenCanvas`). Use it in client‑side contexts.
- **Styling**: The canvas has no default size beyond what you pass in `width` and `height`. Wrap it in a container if you need layout control.

---
## 🧪 Local demo

This repo includes an example app under `example/`. Run:

```bash
pnpm install
pnpm dev
```
It will open a page showcasing multiple image sources and settings.

---
## 📄 License

MIT
