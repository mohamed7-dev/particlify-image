import React from "react";
import { createRoot } from "react-dom/client";
import { ParticlifyImage } from "../src/index";
import "./index.css";

const App = () => (
  <main>
    <article>
      <h1>ParticlifyImage(JPG)</h1>
      <div style={{ width: 800, height: 500 }}>
        <ParticlifyImage
          width={800}
          height={500}
          src="https://images.unsplash.com/photo-1511485977113-f34c92461ad9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
          particleSize={2}
        />
      </div>
    </article>

    <article>
      <h1>ParticlifyImage(PNG)</h1>
      <div style={{ width: 800, height: 500 }}>
        <ParticlifyImage
          width={800}
          height={500}
          src="https://png.pngtree.com/png-clipart/20221018/ourmid/pngtree-youtube-social-media-3d-stereo-png-image_6308427.png"
          particleSize={2}
        />
      </div>
    </article>
  </main>
);

createRoot(document.getElementById("root")!).render(<App />);
