"use client";

import { useEffect, useRef } from "react";
// Deep import of the package's unminified build on purpose: its pre-minified entry
// (`@firecms/neat`) has a `/* @__PURE__ */` comment that Next's production minifier
// treats as covering a whole statement, deleting the uniform-lookup loop. The result
// is a solid-red banner in production builds only.
import { NeatGradient } from "@firecms/neat/dist/NeatGradient";
import type { NeatConfig } from "@firecms/neat/dist/types";

// "Prussian" preset from the NEAT editor.
const config: NeatConfig = {
  colors: [
    { color: "#0b3954", enabled: true },
    { color: "#087e8b", enabled: true },
    { color: "#bfd7ea", enabled: true },
    { color: "#ff5a5f", enabled: true },
    { color: "#c81d25", enabled: true },
    { color: "#A8E6CF", enabled: false },
  ],
  speed: 4,
  horizontalPressure: 4,
  verticalPressure: 3,
  waveFrequencyX: 0,
  waveFrequencyY: 0,
  waveAmplitude: 0,
  secondaryWaveEnabled: false,
  secondaryWaveFrequencyX: 3,
  secondaryWaveFrequencyY: 3,
  secondaryWaveAmplitude: 5,
  secondaryWaveSpeed: 0.6,
  secondaryWaveAngle: 1,
  shadows: 2,
  highlights: 7,
  colorBrightness: 1,
  colorSaturation: 8,
  wireframe: false,
  antialias: false,
  colorBlending: 5,
  backgroundColor: "#FF0000",
  backgroundAlpha: 1,
  grainScale: 0,
  grainSparsity: 0,
  grainIntensity: 0,
  grainSpeed: 0,
  resolution: 0.5,
  yOffset: 106,
  yOffsetWaveMultiplier: 1.5,
  yOffsetColorMultiplier: 1.8,
  yOffsetFlowMultiplier: 2,
  flowDistortionA: 5,
  flowDistortionB: 7.7,
  flowScale: 2.6,
  flowEase: 0.36,
  flowEnabled: false,
  enableProceduralTexture: false,
  transparentTextureVoid: false,
  textureMode: "bitmap",
  bakeEdgeSoftness: 1,
  textureVoidLikelihood: 0.22,
  textureVoidWidthMin: 120,
  textureVoidWidthMax: 150,
  textureBandDensity: 1.9,
  textureColorBlending: 0.12,
  textureSeed: 333,
  textureEase: 0.75,
  proceduralBackgroundColor: "#D0DBFB",
  textureShapeTriangles: 20,
  textureShapeCircles: 15,
  textureShapeBars: 15,
  textureShapeSquiggles: 10,
  domainWarpEnabled: false,
  domainWarpIntensity: 0,
  domainWarpScale: 3,
  vignetteIntensity: 0,
  vignetteRadius: 0.8,
  fresnelEnabled: false,
  fresnelPower: 2,
  fresnelIntensity: 0.5,
  fresnelColor: "#FFFFFF",
  iridescenceEnabled: false,
  iridescenceIntensity: 0.5,
  iridescenceSpeed: 1,
  prismEdgeEnabled: false,
  prismEdgeIntensity: 0.5,
  prismEdgeThinness: 3,
  prismEdgeSpread: 1,
  prismEdgeSpeed: 0.5,
  prismEdgeRipple: 1,
  bloomIntensity: 0,
  bloomThreshold: 0.7,
  chromaticAberration: 0,
  shapeType: "plane",
  shapeRotationX: 0,
  shapeRotationY: 0,
  shapeRotationZ: 0,
  shapeAutoRotateSpeedX: 0,
  shapeAutoRotateSpeedY: 0,
  sphereRadius: 15,
  torusRadius: 15,
  torusTube: 5,
  cylinderRadius: 10,
  cylinderHeight: 40,
  planeBend: 0,
  planeTwist: 0,
  silhouetteFade: 0.25,
  cylinderFade: 0.08,
  ribbonFade: 0.05,
  flatShading: true,
  cameraLock: true,
  cameraX: 0,
  cameraY: 0,
  cameraZ: 0,
  cameraRotationX: 0,
  cameraRotationY: 0,
  cameraRotationZ: 0,
  cameraZoom: 1,
};

export function NeatBanner({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let gradient: NeatGradient | null = null;
    try {
      gradient = new NeatGradient({
        ref: canvas,
        ...config,
        speed: reduceMotion ? 0 : config.speed,
        // Optional: a NEAT license key removes the free-tier watermark.
        licenseKey: process.env.NEXT_PUBLIC_NEAT_LICENSE_KEY || undefined,
      });
    } catch {
      // WebGL unavailable: the CSS fallback behind the canvas stays visible.
      return;
    }

    let frame = 0;
    const baseline = config.yOffset ?? 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (gradient) gradient.yOffset = baseline + window.scrollY;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
      gradient?.destroy();
      gradient = null;
    };
  }, []);

  return (
    <div aria-hidden="true" className={`prussian-fallback ${className}`}>
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
