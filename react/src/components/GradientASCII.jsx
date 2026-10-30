import { useEffect, useRef } from 'react';
import './GradientASCII.css';

// The site's backdrop: light drifting over a dark horizon, drawn as JetBrains
// Mono characters. Adapted from React Bits' GradientASCII and cut down to the
// one look the site uses, so everything it is drawn with is fixed here.

// The site's black, white and silver: the light runs from charcoal at the
// shadow's edge through silver to white, and the dark stays transparent over
// the black body.
const COLORS = ['#3d3d3d', '#989898', '#c0c0c0', '#ffffff'];
const FONT = "'JetBrains Mono', monospace";
// Characters from dimmest to brightest.
const CHARACTERS = ' =+xX0S8#@';
// Faint, so the glow never washes out the text that scrolls over it.
const GRADIENT_OPACITY = 0.2;
const GLYPH_OPACITY = 0.85;
const GLOW = 0.2;
const GRAIN = 0.08;
const DENSITY = 0.8;
const FLICKER = 0.2;
const SOFTNESS = 0.5;
const FLOW = 0.5;
const SCRAMBLE_RADIUS = 0.1;
// The light drifts slowly, so 30 frames a second reads the same as the
// display's 60-120 at half (or a quarter) of the GPU time.
const FPS = 30;

const MAX_CLICKS = 4;
const MAX_TRAIL = 24;
const CLICK_LIFE = 1.2;
const TRAIL_LIFE = 0.7;
const TRAIL_STEP = 0.015;
const INTRO_SECONDS = 2.4;
const ATLAS_CELL_W = 60;
const ATLAS_CELL_H = 100;
const FONT_SCALE = 0.78;
// A character cell in CSS pixels. The canvas draws one device pixel per CSS
// pixel: on HiDPI screens anything more is 4x the fragment work for a
// background.
const CELL_H = 18;
const CELL_W = CELL_H * (ATLAS_CELL_W / ATLAS_CELL_H);

// A JS number as a GLSL float literal.
const glsl = n => (Number.isInteger(n) ? `${n}.0` : `${n}`);

const VERTEX = `#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const COMMON = `
float hash12(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
`;

const FIELD = `#version 300 es
precision highp float;
precision highp int;
const int RAMP = ${COLORS.length};
uniform float uAspect;
uniform float uTime;
uniform vec3 uRamp[RAMP];
uniform vec4 uTrail[${MAX_TRAIL}];
uniform vec4 uClicks[${MAX_CLICKS}];
uniform float uIntro;
uniform float uFrame;
in vec2 vUv;
layout(location = 0) out vec4 outColor;
layout(location = 1) out vec4 outAux;
${COMMON}
vec2 hash22(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.103, 0.0973));
  q += dot(q, q.yzx + 33.33);
  return fract((q.xx + q.yz) * q.zy) * 2.0 - 1.0;
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = dot(hash22(i), f);
  float b = dot(hash22(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
  float c = dot(hash22(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
  float d = dot(hash22(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
  return 0.5 + 0.5 * mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

vec3 labToRgb(vec3 lab) {
  float l = lab.x + 0.3963377774 * lab.y + 0.2158037573 * lab.z;
  float m = lab.x - 0.1055613458 * lab.y - 0.0638541728 * lab.z;
  float s = lab.x - 0.0894841775 * lab.y - 1.2914855480 * lab.z;
  l = l * l * l;
  m = m * m * m;
  s = s * s * s;
  return vec3(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
  );
}

vec3 encode(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}

vec3 horizon(vec2 p, float time, out float order) {
  float span = 0.5 * max(uAspect, 1.0);
  float x = p.x / span;
  float arch = -0.17 - 0.2 * x * x + 0.02 * sin(time * 0.6);
  float soft = mix(0.05, 0.22, ${glsl(SOFTNESS)});
  float edge = p.y - arch;
  float rim = 0.38 * smoothstep(-soft, 0.42, edge);
  vec2 sun = vec2(0.08 * sin(time * 0.31) * span, 0.58);
  float spread = length((p - sun) / vec2(0.95 * span, 0.75));
  float sky = mix(0.55, 1.0, smoothstep(0.2, 0.95, spread));
  order = clamp(edge * 1.3, 0.0, 1.0);
  return vec3(rim, sky, smoothstep(0.18, 0.62, edge));
}

vec4 tone(float t) {
  float x = smoothstep(0.3, 1.0, t) * float(RAMP - 1);
  int index = int(floor(x));
  return vec4(mix(uRamp[index], uRamp[min(index + 1, RAMP - 1)], fract(x)), smoothstep(0.0, 0.38, t));
}

void main() {
  vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
  vec2 warp = vec2(
    noise(p * 1.6 + vec2(0.0, uTime * 0.3)),
    noise(p * 1.6 + vec2(4.3, -uTime * 0.24))
  ) - 0.5;
  vec2 q = p + warp * ${glsl(FLOW)} * 0.18;
  float order = 0.0;
  vec3 shape = horizon(q, uTime, order);

  float reveal = clamp((uIntro * 1.45 - order) / 0.45, 0.0, 1.0);
  reveal = reveal * reveal * (3.0 - 2.0 * reveal);

  // The cursor's trail and each click's expanding ring scramble the glyphs.
  float scramble = 0.0;
  for (int i = 0; i < ${MAX_TRAIL}; i++) {
    vec4 point = uTrail[i];
    if (point.z <= 0.0) continue;
    vec2 d = p - point.xy;
    scramble = max(scramble, point.z * exp(-dot(d, d) / (${glsl(SCRAMBLE_RADIUS)} * ${glsl(SCRAMBLE_RADIUS)})));
  }
  for (int i = 0; i < ${MAX_CLICKS}; i++) {
    vec4 c = uClicks[i];
    if (c.w <= 0.0) continue;
    float d = length(p - c.xy);
    scramble = max(scramble, exp(-pow((d - c.z * 0.75) / 0.06, 2.0)) * c.w);
  }
  vec2 t = clamp(shape.xy * mix(0.7, 1.0, reveal), 0.0, 1.0);
  vec4 mixed = mix(tone(t.x), tone(t.y), shape.z);
  vec3 color = encode(labToRgb(mixed.rgb));
  float alpha = mixed.a * reveal;
  float dither = (hash12(gl_FragCoord.xy + uFrame * 13.7) - 0.5) / 255.0;
  outColor = clamp(vec4(color * alpha + dither, alpha + dither), 0.0, 1.0);
  outAux = vec4(reveal, scramble, 0.0, 1.0);
}`;

// The atlas is one row of glyphs, CHARACTERS.length cells wide.
const GLYPHS = `
uniform sampler2D uField;
uniform sampler2D uAux;
uniform sampler2D uAtlas;
uniform vec2 uResolution;
uniform vec2 uOffset;
uniform float uFlicker;
uniform float uGlyphTime;
const vec2 CELL = vec2(${glsl(CELL_W)}, ${glsl(CELL_H)});
const float COUNT = ${glsl(CHARACTERS.length)};
${COMMON}
float sampleGlyph(float index, vec2 local, vec2 coord) {
  vec2 atlasUv = vec2((index + local.x) / COUNT, 1.0 - local.y);
  vec2 continuous = coord / vec2(COUNT, 1.0);
  return textureGrad(uAtlas, atlasUv, dFdx(continuous), dFdy(continuous)).a;
}

vec4 glyphAt(vec2 px) {
  vec2 coord = (px - uOffset) / CELL;
  vec2 cell = floor(coord);
  vec2 local = coord - cell;
  vec2 uv = clamp(((cell + 0.5) * CELL + uOffset) / uResolution, vec2(0.0), vec2(1.0));
  vec4 field = texture(uField, uv);
  vec4 aux = texture(uAux, uv);
  float value = dot(field.rgb, vec3(0.2126, 0.7152, 0.0722));
  float pick = hash12(cell);
  float level = hash12(cell * 1.73 + 4.1);
  float tick = floor(uGlyphTime * 9.0 + level * 9.0);
  float wobble = (hash12(cell * 2.31 + tick * 17.7) - 0.5) * uFlicker * 0.4 + (level - 0.5) * 0.1;
  float tone = clamp(pow(value, 0.75) + wobble, 0.0, 1.0);
  float index = floor(tone * (COUNT - 1.0) + 0.5);
  float decode = max(aux.g, 1.0 - aux.r);
  if (decode > 0.02) {
    float frame = floor(uGlyphTime * 20.0);
    if (hash12(cell * 3.7 + frame * 5.3) < decode * 1.25) index = 1.0 + floor(hash12(cell + frame * 1.37) * (COUNT - 1.0));
  }
  float present = step(pick, ${glsl(DENSITY)} * mix(1.0, 0.3 + tone * 1.1, 0.55));
  float cutoff = smoothstep(0.03, 0.1, value);
  float coverage = sampleGlyph(index, local, coord);
  float alpha = ${glsl(GLYPH_OPACITY)} * present * cutoff * coverage * mix(1.0, 0.35 + 0.65 * level, 0.55);
  vec3 light = field.rgb * 0.55 + vec3(0.03) * field.a;
  return vec4(light * alpha, 0.6 * field.a * alpha);
}
`;

const HALO = `#version 300 es
precision highp float;
uniform float uDownscale;
in vec2 vUv;
out vec4 outColor;
${GLYPHS}
void main() {
  outColor = glyphAt(gl_FragCoord.xy * uDownscale);
}`;

const BLUR = `#version 300 es
precision highp float;
uniform sampler2D uSource;
uniform vec2 uStep;
in vec2 vUv;
out vec4 outColor;
void main() {
  vec4 sum = texture(uSource, vUv) * 0.2270270270;
  sum += texture(uSource, vUv + uStep * 1.3846153846) * 0.3162162162;
  sum += texture(uSource, vUv - uStep * 1.3846153846) * 0.3162162162;
  sum += texture(uSource, vUv + uStep * 3.2307692308) * 0.0702702703;
  sum += texture(uSource, vUv - uStep * 3.2307692308) * 0.0702702703;
  outColor = sum;
}`;

const COMPOSITE = `#version 300 es
precision highp float;
uniform sampler2D uHalo;
uniform float uFrame;
in vec2 vUv;
out vec4 outColor;
${GLYPHS}
void main() {
  vec4 base = texture(uField, vUv) * ${glsl(GRADIENT_OPACITY)};
  vec4 glyph = glyphAt(gl_FragCoord.xy);
  vec4 halo = texture(uHalo, vUv) * ${glsl(GLOW)};
  vec4 color = base + glyph + halo;
  float grain = (hash12(gl_FragCoord.xy + uFrame * vec2(17.0, 59.0)) + hash12(gl_FragCoord.xy * 1.31 + uFrame * 7.0) - 1.0) * ${glsl(GRAIN)};
  float body = clamp(color.a, 0.0, 1.0);
  color.rgb += grain * (0.25 + body) * 0.5;
  color.a = clamp(color.a, 0.0, 1.0);
  color.rgb = clamp(color.rgb, 0.0, color.a);
  outColor = color;
}`;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const toLinear = value => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);

const toLab = hex => {
  const [lr, lg, lb] = [1, 3, 5].map(i => toLinear(parseInt(hex.slice(i, i + 2), 16) / 255));
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  ];
};

// No status checks here: asking whether a shader compiled or a program linked
// blocks until the driver has finished (~170 ms for these four on an
// integrated GPU). A failed compile fails the link, which finishLink checks
// once the program is ready.
const compile = (gl, type, source) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
};

const startLink = (gl, fragmentSource) => {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  return program;
};

const finishLink = (gl, program) => {
  if (!program || !gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  const uniforms = {};
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (!info) continue;
    const name = info.name.replace(/\[0\]$/, '');
    uniforms[name] = gl.getUniformLocation(program, name);
  }
  return { program, uniforms };
};

const createTarget = (gl, count) => {
  const textures = Array.from({ length: count }, () => {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture;
  });
  return { textures, framebuffer: gl.createFramebuffer(), width: 0, height: 0 };
};

const sizeTarget = (gl, target, width, height) => {
  if (target.width === width && target.height === height) return;
  target.width = width;
  target.height = height;
  gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
  target.textures.forEach((texture, i) => {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, texture, 0);
  });
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};

const buildAtlas = gl => {
  const canvas = document.createElement('canvas');
  canvas.width = ATLAS_CELL_W * CHARACTERS.length;
  canvas.height = ATLAS_CELL_H;
  const context = canvas.getContext('2d');
  context.font = `300 ${Math.round(ATLAS_CELL_H * FONT_SCALE)}px ${FONT}`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = '#fff';
  [...CHARACTERS].forEach((char, index) => {
    context.fillText(char, index * ATLAS_CELL_W + ATLAS_CELL_W / 2, ATLAS_CELL_H / 2 + 3);
  });
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return texture;
};

const GradientASCII = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    // A fresh canvas per mount: cleanup loses the WebGL context, and a canvas
    // only ever hands out that one context, so a remount on the same element
    // (StrictMode does one in development) would get a dead context back.
    const canvas = document.createElement('canvas');
    canvas.className = 'gradient-ascii-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    container.appendChild(canvas);
    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false
    });
    if (!gl) {
      canvas.remove();
      return undefined;
    }

    // With KHR_parallel_shader_compile the driver compiles in the background
    // and the programs are polled once a frame until they are ready; without
    // it, finishLink's status check simply waits.
    const parallel = gl.getExtension('KHR_parallel_shader_compile');
    const programs = [FIELD, HALO, BLUR, COMPOSITE].map(source => startLink(gl, source));
    const compiled = () =>
      !parallel || programs.every(p => !p || gl.getProgramParameter(p, parallel.COMPLETION_STATUS_KHR));
    let poll = 0;
    let teardown = null;

    const begin = () => {
      poll = 0;
      if (!compiled()) {
        poll = requestAnimationFrame(begin);
        return;
      }
      const linked = programs.map(p => finishLink(gl, p));
      if (linked.every(Boolean)) teardown = run(...linked);
    };
    begin();

    function run(field, halo, blur, composite) {
      const vao = gl.createVertexArray();
      const fieldTarget = createTarget(gl, 2);
      const haloA = createTarget(gl, 1);
      const haloB = createTarget(gl, 1);

      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const clickData = new Float32Array(MAX_CLICKS * 4);
      const clicks = [];
      const trailData = new Float32Array(MAX_TRAIL * 4);
      const trail = [];
      const pointer = { x: 0, y: 0, inside: false };
      const offset = { x: 0, y: 0 };
      let atlas = buildAtlas(gl);
      let time = 0;
      let glyphTime = 0;
      let introClock = reduce ? 1 : 0;
      let frameSeed = 0;
      let grainClock = 0;
      let raf = 0;
      let last = 0;
      let disposed = false;

      // The palette, the flicker and the samplers never change: set them once.
      gl.useProgram(field.program);
      gl.uniform3fv(field.uniforms.uRamp, COLORS.flatMap(toLab));
      [halo, composite].forEach(({ program, uniforms }) => {
        gl.useProgram(program);
        gl.uniform1i(uniforms.uField, 0);
        gl.uniform1i(uniforms.uAux, 1);
        gl.uniform1i(uniforms.uAtlas, 2);
        gl.uniform1f(uniforms.uFlicker, reduce ? 0 : FLICKER);
      });
      gl.useProgram(blur.program);
      gl.uniform1i(blur.uniforms.uSource, 0);
      gl.useProgram(composite.program);
      gl.uniform1i(composite.uniforms.uHalo, 3);

      // The atlas is drawn straight away in whatever face is ready, then again
      // once JetBrains Mono's light weight has loaded.
      document.fonts.load(`300 64px ${FONT}`, CHARACTERS).then(
        () => {
          if (disposed) return;
          gl.deleteTexture(atlas);
          atlas = buildAtlas(gl);
          draw();
        },
        () => {}
      );

      const bindGlyphs = program => {
        const u = program.uniforms;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, fieldTarget.textures[0]);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, fieldTarget.textures[1]);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, atlas);
        gl.uniform2f(u.uResolution, canvas.width, canvas.height);
        gl.uniform2f(u.uOffset, offset.x, offset.y);
        gl.uniform1f(u.uGlyphTime, glyphTime);
      };

      const draw = () => {
        gl.bindVertexArray(vao);
        gl.disable(gl.BLEND);

        gl.bindFramebuffer(gl.FRAMEBUFFER, fieldTarget.framebuffer);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
        gl.viewport(0, 0, fieldTarget.width, fieldTarget.height);
        gl.useProgram(field.program);
        const fu = field.uniforms;
        gl.uniform1f(fu.uAspect, canvas.width / canvas.height);
        gl.uniform1f(fu.uTime, time);
        gl.uniform4fv(fu.uTrail, trailData);
        gl.uniform4fv(fu.uClicks, clickData);
        gl.uniform1f(fu.uIntro, introClock);
        gl.uniform1f(fu.uFrame, frameSeed);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        // The glyphs again at a quarter of the resolution, blurred into a glow.
        gl.bindFramebuffer(gl.FRAMEBUFFER, haloA.framebuffer);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
        gl.viewport(0, 0, haloA.width, haloA.height);
        gl.useProgram(halo.program);
        bindGlyphs(halo);
        gl.uniform1f(halo.uniforms.uDownscale, canvas.width / haloA.width);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        gl.useProgram(blur.program);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, haloB.framebuffer);
        gl.bindTexture(gl.TEXTURE_2D, haloA.textures[0]);
        gl.uniform2f(blur.uniforms.uStep, 1 / haloA.width, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.bindFramebuffer(gl.FRAMEBUFFER, haloA.framebuffer);
        gl.bindTexture(gl.TEXTURE_2D, haloB.textures[0]);
        gl.uniform2f(blur.uniforms.uStep, 0, 1 / haloA.height);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.useProgram(composite.program);
        bindGlyphs(composite);
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, haloA.textures[0]);
        gl.uniform1f(composite.uniforms.uFrame, frameSeed);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      };

      const resize = () => {
        canvas.width = Math.max(1, container.clientWidth);
        canvas.height = Math.max(1, container.clientHeight);
        offset.x = (canvas.width - Math.ceil(canvas.width / CELL_W) * CELL_W) / 2;
        offset.y = (canvas.height - Math.ceil(canvas.height / CELL_H) * CELL_H) / 2;
        sizeTarget(
          gl,
          fieldTarget,
          Math.max(1, Math.round(canvas.width / 2)),
          Math.max(1, Math.round(canvas.height / 2))
        );
        const haloWidth = Math.max(1, Math.round(canvas.width / 4));
        const haloHeight = Math.max(1, Math.round(canvas.height / 4));
        sizeTarget(gl, haloA, haloWidth, haloHeight);
        sizeTarget(gl, haloB, haloWidth, haloHeight);
        draw();
        wake();
      };

      const updateInput = dt => {
        trail.forEach(point => {
          point.age += dt;
        });
        while (trail.length && trail[trail.length - 1].age > TRAIL_LIFE) trail.pop();
        for (let i = 0; i < MAX_TRAIL; i++) {
          const point = trail[i];
          if (!point) {
            trailData[i * 4 + 2] = 0;
            continue;
          }
          const k = 1 - point.age / TRAIL_LIFE;
          trailData.set([point.x, point.y, k * k, 0], i * 4);
        }
        clicks.forEach(click => {
          click.age += dt;
        });
        while (clicks.length && clicks[clicks.length - 1].age > CLICK_LIFE) clicks.pop();
        for (let i = 0; i < MAX_CLICKS; i++) {
          const click = clicks[i];
          if (!click) {
            clickData[i * 4 + 3] = 0;
            continue;
          }
          const k = click.age / CLICK_LIFE;
          const envelope = Math.min(1, click.age / 0.08) * (1 - k) * (1 - k);
          clickData.set([click.x, click.y, click.age, envelope], i * 4);
        }
      };

      const frame = now => {
        raf = 0;
        if (disposed || document.hidden) return;
        // Frames in between are skipped; half a frame of slack lets a 60 Hz
        // display land on every other one.
        if (last && now - last < 1000 / FPS - 8) {
          raf = requestAnimationFrame(frame);
          return;
        }
        const dt = last ? clamp((now - last) / 1000, 0.001, 0.05) : 1 / 60;
        last = now;
        if (!reduce) {
          time += dt * 0.5;
          glyphTime += dt;
        }
        if (introClock < 1) introClock = Math.min(1, introClock + dt / INTRO_SECONDS);
        grainClock += dt;
        if (!reduce && grainClock > 1 / 24) {
          grainClock = 0;
          frameSeed = (frameSeed + 1) % 97;
        }
        updateInput(dt);
        draw();
        const busy = !reduce || introClock < 1 || clicks.length > 0 || trail.length > 0;
        if (busy) raf = requestAnimationFrame(frame);
        else last = 0;
      };

      // The canvas is a fixed full-viewport backdrop, never scrolled out of
      // view, so only page visibility pauses it.
      function wake() {
        if (!raf && !disposed && !document.hidden) raf = requestAnimationFrame(frame);
      }

      const locate = event => {
        const rect = container.getBoundingClientRect();
        const x = (event.clientX - rect.left) / Math.max(1, rect.width);
        const y = 1 - (event.clientY - rect.top) / Math.max(1, rect.height);
        const aspect = rect.width / Math.max(1, rect.height);
        pointer.inside = x >= 0 && x <= 1 && y >= 0 && y <= 1;
        pointer.x = (x - 0.5) * aspect;
        pointer.y = y - 0.5;
      };

      const onPointerMove = event => {
        locate(event);
        if (!pointer.inside || reduce) return;
        const head = trail[0];
        const gap = head ? Math.hypot(pointer.x - head.x, pointer.y - head.y) : Infinity;
        if (gap < TRAIL_STEP) return;
        if (head && head.age < 0.1) {
          const steps = Math.min(6, Math.floor(gap / (TRAIL_STEP * 2)));
          for (let i = 1; i <= steps; i++) {
            const k = i / (steps + 1);
            trail.unshift({ x: head.x + (pointer.x - head.x) * k, y: head.y + (pointer.y - head.y) * k, age: 0 });
          }
        }
        trail.unshift({ x: pointer.x, y: pointer.y, age: 0 });
        trail.length = Math.min(trail.length, MAX_TRAIL);
        wake();
      };

      const onPointerDown = event => {
        locate(event);
        if (!pointer.inside || reduce) return;
        clicks.unshift({ x: pointer.x, y: pointer.y, age: 0 });
        if (clicks.length > MAX_CLICKS) clicks.pop();
        wake();
      };

      const onVisibility = () => {
        last = 0;
        wake();
      };

      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(container);
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('pointerdown', onPointerDown, { passive: true });
      document.addEventListener('visibilitychange', onVisibility);
      resize();

      return () => {
        disposed = true;
        cancelAnimationFrame(raf);
        resizeObserver.disconnect();
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerdown', onPointerDown);
        document.removeEventListener('visibilitychange', onVisibility);
        [fieldTarget, haloA, haloB].forEach(target => {
          target.textures.forEach(texture => gl.deleteTexture(texture));
          gl.deleteFramebuffer(target.framebuffer);
        });
        gl.deleteTexture(atlas);
        gl.deleteVertexArray(vao);
      };
    }

    return () => {
      cancelAnimationFrame(poll);
      teardown?.();
      programs.forEach(p => p && gl.deleteProgram(p));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      canvas.remove();
    };
  }, []);

  return <div ref={containerRef} className="gradient-ascii-container" />;
};

export default GradientASCII;
