"use client";

import { useEffect, useRef } from "react";

// Animated "Prussian" mesh gradient, drawn by a small fragment shader.
// Five colours drift around on slow Lissajous paths; the sample position is
// domain-warped so the colour fields flow into each other instead of forming
// round blobs. Renders at reduced resolution (it's all soft gradients anyway),
// caps the frame rate, and stops when off-screen / hidden.

const COLORS = ["#0b3954", "#087e8b", "#bfd7ea", "#ff5a5f", "#c81d25"];
// Relative weight of each colour so the navy/teal base dominates and the pale
// blue and coral read as streaks through it.
const WEIGHTS = [1.5, 1.15, 0.85, 0.8, 0.6];

const RENDER_SCALE = 0.5;
const MAX_DPR = 2;
const FRAME_MS = 1000 / 30;
const SPEED = 0.18;

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 u_res;
uniform float u_t;
uniform vec3 u_col[5];
uniform float u_w[5];

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  float ar = u_res.x / u_res.y;
  vec2 p = vec2(gl_FragCoord.x / u_res.y, 1.0 - gl_FragCoord.y / u_res.y);
  float t = u_t;

  // Domain warp: bend the sampling space so the colour fields flow.
  for (int i = 0; i < 3; i++) {
    float k = float(i);
    p += 0.20 * vec2(
      sin(p.y * 2.7 + t * 0.9 + k * 1.7),
      cos(p.x * 2.3 - t * 0.7 + k * 2.3)
    );
  }

  vec3 acc = vec3(0.0);
  float sum = 0.0;
  for (int i = 0; i < 5; i++) {
    float k = float(i);
    vec2 c = vec2(
      ar * (0.5 + 0.55 * sin(t * (0.55 + 0.13 * k) + k * 1.9)),
      0.5 + 0.6 * sin(t * (0.43 + 0.11 * k) + k * 2.7 + 1.0)
    );
    float d = length(p - c);
    float w = u_w[i] / (pow(d, 3.4) + 0.03);
    acc += w * u_col[i];
    sum += w;
  }
  vec3 col = acc / sum;

  // Mixing complementary hues greys them out; push saturation back up.
  float luma = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(luma), col, 1.45);

  // Soft diagonal sheen and a touch of grain to hide 8-bit banding.
  col += 0.025 * sin(p.x * 4.0 + p.y * 3.0 + t * 1.3);
  col += (hash(gl_FragCoord.xy + fract(t)) - 0.5) / 128.0;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function GradientBanner({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!gl) return; // the CSS fallback behind the canvas stays visible

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const program = gl.createProgram();
    if (!vs || !fs || !program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, "u_res");
    const uT = gl.getUniformLocation(program, "u_t");
    gl.uniform3fv(gl.getUniformLocation(program, "u_col"), new Float32Array(COLORS.flatMap(hexToRgb)));
    gl.uniform1fv(gl.getUniformLocation(program, "u_w"), new Float32Array(WEIGHTS));

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let frame = 0;
    let last = 0;
    let running = false;
    let visible = true;
    // Start part-way through the loop so the first frame isn't a degenerate t=0 layout.
    const startOffset = 4 + Math.random() * 20;
    const startedAt = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr * RENDER_SCALE));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr * RENDER_SCALE));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };

    const draw = (now: number) => {
      const scrollDrift = window.scrollY * 0.0025;
      const t = startOffset + ((now - startedAt) / 1000) * SPEED + scrollDrift;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uT, t);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      canvas.style.opacity = "1";
    };

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (now - last < FRAME_MS) return;
      last = now;
      draw(now);
    };

    const start = () => {
      if (running || reduceMotion || !visible || document.hidden) return;
      running = true;
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };

    resize();
    draw(performance.now());
    start();

    const ro = new ResizeObserver(() => {
      resize();
      draw(performance.now());
    });
    ro.observe(canvas);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(canvas);

    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);

    // Reduced motion: a still gradient, nudged only when the page scrolls.
    const onScroll = () => {
      if (reduceMotion) draw(performance.now());
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("scroll", onScroll);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return (
    <div aria-hidden="true" className={`gradient-fallback ${className}`}>
      <canvas
        ref={canvasRef}
        className="block h-full w-full opacity-0 transition-opacity duration-500"
      />
    </div>
  );
}
