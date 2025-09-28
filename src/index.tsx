import React from "react";

/**
 * It partitions the canvas into a grid of cells
 * each cell contains particles that are close to it
 * this is used to optimize the performance of the particle system lookup.
 */
class SpatialGrid {
  rows: number;
  cols: number;
  cells: GridCell[][];
  constructor(rows: number, cols: number) {
    this.rows = rows;
    this.cols = cols;
    this.cells = [];
    for (let i = 0; i < rows; i++) {
      this.cells[i] = [];
      for (let j = 0; j < cols; j++) {
        this.cells[i][j] = new GridCell();
      }
    }
  }
}

class GridCell {
  particles: Set<Particle>;
  constructor() {
    this.particles = new Set();
  }
  add(p: Particle) {
    this.particles.add(p);
  }
  remove(p: Particle) {
    this.particles.delete(p);
  }
}

class Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  color: string;
  size: number;
  density: number;
  row: number;
  col: number;
  system: ParticleSystem;

  constructor(
    system: ParticleSystem,
    x: number,
    y: number,
    color: string,
    size: number
  ) {
    this.system = system;
    this.x = x;
    this.y = y;
    this.baseX = x;
    this.baseY = y;
    this.color = color;
    this.size = size;
    this.density = Math.random() * 30 + 1;
    this.row = Math.floor(this.y / this.system.mouseRadius);
    this.col = Math.floor(this.x / this.system.mouseRadius);
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  }

  calculateGridPosition() {
    const row = Math.floor(this.y / this.system.mouseRadius);
    const col = Math.floor(this.x / this.system.mouseRadius);

    if (row !== this.row || col !== this.col) {
      if (this.row >= 0 && this.col >= 0) {
        this.system.grid.cells[this.row][this.col].remove(this);
      }
      if (
        row >= 0 &&
        row < this.system.grid.rows &&
        col >= 0 &&
        col < this.system.grid.cols
      ) {
        this.system.grid.cells[row][col].add(this);
        this.row = row;
        this.col = col;
      } else {
        this.row = -1;
        this.col = -1;
      }
    }
  }

  update(mouseX: number, mouseY: number, mouseMoved: boolean) {
    if (!mouseMoved) return;

    const dx = mouseX - this.x;
    const dy = mouseY - this.y;
    const distSq = dx * dx + dy * dy;

    if (distSq < this.system.maxDistanceSquared + this.size * this.size) {
      const force = 1 - distSq / this.system.maxDistanceSquared;
      const dirX = (dx / this.system.mouseRadius) * force * this.density;
      const dirY = (dy / this.system.mouseRadius) * force * this.density;
      this.x -= dirX;
      this.y -= dirY;
      this.calculateGridPosition();
    }
  }

  applyForceBack() {
    this.x -= (this.x - this.baseX) / 15;
    this.y -= (this.y - this.baseY) / 15;
    this.calculateGridPosition();
  }
}

export class ParticleSystem {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  particleSize: number;
  mouseRadius: number;
  maxDistanceSquared: number;
  numParticles: number;
  grid: SpatialGrid;
  particles: Particle[];
  imageOffsetX = 0.2;
  imageOffsetY = 0.2;
  mouse = { x: 0, y: 0 };
  mouseMoved = false;
  isNumParticlesSet: boolean;
  // Limit source image sampling resolution to avoid generating a particle per pixel for detailed images
  imageSampleMaxSide = 768; // px

  constructor(
    canvas: HTMLCanvasElement,
    width: number,
    height: number,
    particleSize: number,
    numParticles: number | null
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.width = width;
    this.height = height;
    this.particleSize = particleSize;
    // the effective distance within which particles are affected by moving mouse cursor.
    this.mouseRadius = (width + height) / 12;
    this.maxDistanceSquared = this.mouseRadius * this.mouseRadius;
    this.isNumParticlesSet = numParticles !== null;
    this.numParticles = numParticles ?? 1000;
    this.grid = new SpatialGrid(
      Math.ceil(height / this.mouseRadius),
      Math.ceil(width / this.mouseRadius)
    );
    this.particles = [];

    this.canvas.width = width;
    this.canvas.height = height;

    window.addEventListener("mousemove", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
      this.mouseMoved = true;
    });
  }

  async downloadImage(path: string) {
    const blob = await fetch(path).then((r) => r.blob());
    const bitmap = await createImageBitmap(blob);
    // Downscale the image before sampling to reduce pixel count for detailed images
    const srcW = bitmap.width;
    const srcH = bitmap.height;
    const scale = Math.min(1, this.imageSampleMaxSide / Math.max(srcW, srcH));
    const sw = Math.max(1, Math.round(srcW * scale));
    const sh = Math.max(1, Math.round(srcH * scale));

    const off = new OffscreenCanvas(sw, sh);
    const offCtx = off.getContext("2d")!;
    offCtx.drawImage(bitmap, 0, 0, sw, sh);
    const data = offCtx.getImageData(0, 0, sw, sh);
    this.particlify(data);
    this.animate();
  }

  particlify(data: ImageData) {
    this.particles = [];
    // data.data is  a flat array, each pixel contributes 4 values (r, g, b, a)
    // filter out transparent pixels
    let numPixels = 0;
    for (let i = 3; i < data.data.length; i += 4) {
      if (data.data[i] > 128) numPixels++;
    }
    // Decide target particle budget
    // If user specified particlesCount, honor it (capped by numPixels).
    // Otherwise, auto-cap based on canvas area and particle size.
    const autoCap = Math.min(
      numPixels,
      // roughly one particle per k pixels of canvas area
      Math.floor(
        (this.width * this.height) / (this.particleSize * this.particleSize * 6)
      ),
      15000 // hard upper safety cap
    );
    this.numParticles = this.isNumParticlesSet
      ? Math.min(this.numParticles, numPixels)
      : autoCap;

    // loop over each row
    for (let y = 0; y < data.height; y++) {
      // loop over each column in a row
      for (let x = 0; x < data.width; x++) {
        // get the alpha value of the pixel
        const alpha = data.data[y * 4 * data.width + x * 4 + 3];
        // if the pixel is transparent, skip it
        if (alpha <= 128) continue;

        // probabilistic downsampling to match target particle budget
        if (
          this.numParticles < numPixels &&
          Math.random() > this.numParticles / numPixels
        ) {
          continue;
        }

        const posX =
          this.width * (this.imageOffsetX / 2) +
          Math.floor((x / data.width) * this.width) * (1 - this.imageOffsetX);
        const posY =
          this.height * (this.imageOffsetY / 2) +
          Math.floor((y / data.height) * this.height) * (1 - this.imageOffsetY);

        const index = y * 4 * data.width + x * 4;
        const r = data.data[index],
          g = data.data[index + 1],
          b = data.data[index + 2];
        const color = `rgb(${r},${g},${b})`;

        const p = new Particle(this, posX, posY, color, this.particleSize);
        this.particles.push(p);
        this.grid.cells[p.row][p.col].add(p);
      }
    }
  }

  animate = () => {
    requestAnimationFrame(this.animate);
    this.ctx.clearRect(0, 0, this.width, this.height);

    if (this.mouseMoved) {
      const mouseRow = Math.floor(this.mouse.y / this.mouseRadius);
      const mouseCol = Math.floor(this.mouse.x / this.mouseRadius);
      const offsets = [
        [0, 1],
        [0, -1],
        [1, 1],
        [1, -1],
        [1, 0],
        [-1, 0],
        [0, 0],
        [-1, -1],
        [-1, 1],
      ];
      for (const [dr, dc] of offsets) {
        const r = mouseRow + dr,
          c = mouseCol + dc;
        if (r < 0 || r >= this.grid.rows || c < 0 || c >= this.grid.cols)
          continue;
        for (const p of this.grid.cells[r][c].particles) {
          p.update(this.mouse.x, this.mouse.y, this.mouseMoved);
        }
      }
    }

    for (const p of this.particles) {
      if (p.x !== p.baseX || p.y !== p.baseY) {
        p.applyForceBack();
      }
      p.draw(this.ctx);
    }
    this.mouseMoved = false;
  };
}

interface ParticlifyImageProps {
  width: number;
  height: number;
  src: string;
  particleSize: number;
  particlesCount?: number;
}

export function ParticlifyImage(props: ParticlifyImageProps) {
  const { src, width, height, particlesCount, particleSize } = props;
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    if (!canvasRef || !canvasRef.current) return undefined;
    const system = new ParticleSystem(
      canvasRef.current,
      width,
      height,
      particleSize,
      particlesCount ?? null
    );
    system.downloadImage(src);
  }, [src, width, height, particleSize, particlesCount]);

  return <canvas ref={canvasRef} />;
}

export type { ParticlifyImageProps };
