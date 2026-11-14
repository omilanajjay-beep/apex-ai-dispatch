'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
const STAGE_SIZE = 1080;
const FACE_WIDTH = 560;
const FACE_HEIGHT = 720;
const CARD_COUNT = 5;
const LOOP_SECONDS = 15.5;
const CARD_SECONDS = LOOP_SECONDS / CARD_COUNT;
const HOLD_SECONDS = 2.2;
const TRANSITION_SECONDS = CARD_SECONDS - HOLD_SECONDS;

const metrics = [
  {
    name: 'Thermostat',
    eyebrow: 'THERMOSTAT SETPOINT',
    caption: 'ROOM TARGET / °F',
    values: ['68', '70', '72'],
    unit: '°F',
    accent: '#C99559',
    gauge: 'ruler',
  },
  {
    name: 'Airflow',
    eyebrow: 'SUPPLY AIRFLOW',
    caption: 'REGISTER FLOW / CFM',
    values: ['320', '760', '1200'],
    unit: 'CFM',
    accent: '#78A9B9',
    gauge: 'fan',
  },
  {
    name: 'System load',
    eyebrow: 'SYSTEM LOAD',
    caption: 'HEATING + COOLING / %',
    values: ['40', '70', '100'],
    unit: '%',
    accent: '#A1B58B',
    gauge: 'bars',
  },
  {
    name: 'Humidity',
    eyebrow: 'RELATIVE HUMIDITY',
    caption: 'INDOOR RH / %',
    values: ['35', '45', '55'],
    unit: '%',
    accent: '#D6B879',
    gauge: 'humidity',
  },
  {
    name: 'Filter pressure',
    eyebrow: 'FILTER PRESSURE',
    caption: 'PRESSURE DROP / in. w.c.',
    values: ['0.2', '0.4', '0.6'],
    unit: 'in. w.c.',
    accent: '#C87970',
    gauge: 'histogram',
  },
] as const;

type Metric = (typeof metrics)[number];
type Face = { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D };
type CardPose = {
  relative: number;
  step: number;
  mix: number;
  progress: number;
  bend: number;
  opacity: number;
  direction: number;
  centerX: number;
  centerY: number;
};
type Frame = { time: number; cards: CardPose[] };

declare global {
  interface Window {
    __render?: (t: number) => void;
    __LOOP?: number;
    __MANUAL?: boolean;
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const x = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return x * x * (3 - 2 * x);
}

function poseAt(t: number): Frame {
  const time = ((t % LOOP_SECONDS) + LOOP_SECONDS) % LOOP_SECONDS;
  const cardPosition = time / CARD_SECONDS;
  const currentIndex = Math.min(CARD_COUNT - 1, Math.floor(cardPosition));
  const localSeconds = time - currentIndex * CARD_SECONDS;
  const transition = smoothstep(0, 1, (localSeconds - HOLD_SECONDS) / TRANSITION_SECONDS);
  const focus = currentIndex + transition;
  const cards = metrics.map((_, index): CardPose => {
    let relative = index - focus;
    while (relative < -CARD_COUNT / 2) relative += CARD_COUNT;
    while (relative > CARD_COUNT / 2) relative -= CARD_COUNT;
    const distance = Math.abs(relative);
    const bend = smoothstep(0.33, 1.8, distance);
    const direction = relative === 0 ? 0 : Math.sign(relative);
    const ahead = (index - currentIndex + CARD_COUNT) % CARD_COUNT;
    const valuePhase = index === currentIndex
      ? Math.min(2.99999, (clamp(localSeconds, 0, HOLD_SECONDS) / HOLD_SECONDS) * 3)
      : ahead <= 2 ? 0 : 2;
    const step = Math.min(2, Math.floor(valuePhase));
    const segment = valuePhase - step;
    const mix = step < 2 ? smoothstep(0.72, 0.98, segment) : 0;
    const progress = (step + mix) / 2;
    const curve = smoothstep(0.28, 2.35, distance);
    return {
      relative,
      step,
      mix,
      progress,
      bend,
      opacity: 1 - smoothstep(2.0, 2.55, distance) * 0.72,
      direction,
      centerX: STAGE_SIZE / 2 + relative * 342,
      centerY: STAGE_SIZE / 2 + direction * curve * 100,
    };
  });
  return { time, cards };
}

function roundedRectPath(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.lineTo(x + width - r, y);
  context.quadraticCurveTo(x + width, y, x + width, y + r);
  context.lineTo(x + width, y + height - r);
  context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  context.lineTo(x + r, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
  context.closePath();
}

function drawRuleGauge(context: CanvasRenderingContext2D, progress: number, accent: string) {
  const left = 56;
  const right = FACE_WIDTH - 56;
  const center = FACE_WIDTH / 2;
  const baseline = 566;
  context.strokeStyle = 'rgba(241,237,226,.28)';
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(left, baseline);
  context.lineTo(right, baseline);
  context.stroke();
  const shift = progress * 30;
  for (let i = -7; i <= 7; i += 1) {
    const x = center + i * 32 - shift;
    if (x < left || x > right) continue;
    const major = i % 3 === 0;
    context.strokeStyle = major ? 'rgba(241,237,226,.54)' : 'rgba(241,237,226,.26)';
    context.beginPath();
    context.moveTo(x, baseline);
    context.lineTo(x, baseline - (major ? 32 : 17));
    context.stroke();
    if (major) {
      context.fillStyle = 'rgba(230,226,216,.52)';
      context.font = '11px "JetBrains Mono", monospace';
      context.textAlign = 'center';
      context.fillText(`${Math.round(68 + (i * 2) + progress * 5)}°`, x, baseline + 25);
    }
  }
  context.fillStyle = '#BA534B';
  context.beginPath();
  context.moveTo(center, baseline - 62);
  context.lineTo(center - 9, baseline - 43);
  context.lineTo(center + 9, baseline - 43);
  context.closePath();
  context.fill();
  context.fillStyle = accent;
  context.beginPath();
  context.arc(center, baseline - 66, 4, 0, Math.PI * 2);
  context.fill();
}

function drawFanGauge(context: CanvasRenderingContext2D, progress: number, time: number, accent: string) {
  const cx = 145;
  const cy = 560;
  context.save();
  context.translate(cx, cy);
  context.rotate((time / LOOP_SECONDS) * Math.PI * 8);
  for (let blade = 0; blade < 8; blade += 1) {
    context.rotate(Math.PI / 4);
    context.fillStyle = blade % 2 === 0 ? accent : 'rgba(120,169,185,.42)';
    context.beginPath();
    context.moveTo(7, -7);
    context.quadraticCurveTo(44, -47, 18, -59);
    context.quadraticCurveTo(5, -42, -5, -10);
    context.closePath();
    context.fill();
  }
  context.restore();
  context.fillStyle = '#101C2D';
  context.strokeStyle = 'rgba(241,237,226,.42)';
  context.lineWidth = 2;
  context.beginPath();
  context.arc(cx, cy, 10, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  const x = 248;
  const width = 258;
  for (let i = 0; i < 6; i += 1) {
    const y = 518 + i * 17;
    const segment = (i + 1) / 6;
    const active = clamp(progress * 1.15 + 0.12, 0, 1) >= segment;
    context.fillStyle = active ? accent : 'rgba(241,237,226,.13)';
    context.fillRect(x, y, width * (0.56 + ((i % 3) * 0.14)), 5);
  }
  context.fillStyle = 'rgba(230,226,216,.52)';
  context.font = '11px "JetBrains Mono", monospace';
  context.textAlign = 'left';
  context.fillText('AIR MOVEMENT', x, 644);
}

function drawLoadGauge(context: CanvasRenderingContext2D, progress: number, accent: string) {
  const columns = 8;
  const gap = 10;
  const width = (FACE_WIDTH - 112 - gap * (columns - 1)) / columns;
  for (let i = 0; i < columns; i += 1) {
    const x = 56 + i * (width + gap);
    const height = 32 + i * 11;
    const y = 604 - height;
    context.fillStyle = 'rgba(241,237,226,.12)';
    roundedRectPath(context, x, y, width, height, 4);
    context.fill();
    const amount = clamp(progress * 1.18 + 0.04, 0, 1);
    const fillHeight = Math.max(5, height * amount);
    context.fillStyle = i / columns < amount ? accent : 'rgba(241,237,226,.1)';
    roundedRectPath(context, x, 604 - fillHeight, width, fillHeight, 4);
    context.fill();
  }
  context.fillStyle = 'rgba(230,226,216,.52)';
  context.font = '11px "JetBrains Mono", monospace';
  context.textAlign = 'left';
  context.fillText('MODULATING OUTPUT', 56, 644);
  context.textAlign = 'right';
  context.fillText('40     70     100%', FACE_WIDTH - 56, 644);
}

function drawHumidityGauge(context: CanvasRenderingContext2D, progress: number) {
  const x = 56;
  const y = 544;
  const width = FACE_WIDTH - 112;
  const gradient = context.createLinearGradient(x, 0, x + width, 0);
  gradient.addColorStop(0, '#7197AA');
  gradient.addColorStop(0.37, '#A6B695');
  gradient.addColorStop(0.69, '#D6B879');
  gradient.addColorStop(1, '#C67869');
  roundedRectPath(context, x, y, width, 18, 9);
  context.fillStyle = gradient;
  context.fill();
  const markerX = x + progress * width;
  context.fillStyle = '#F6F1E7';
  context.strokeStyle = '#0B1728';
  context.lineWidth = 4;
  context.beginPath();
  context.arc(markerX, y + 9, 13, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.fillStyle = 'rgba(230,226,216,.56)';
  context.font = '11px "JetBrains Mono", monospace';
  context.textAlign = 'left';
  context.fillText('DRY', x, 602);
  context.textAlign = 'center';
  context.fillText('BALANCED', x + width / 2, 602);
  context.textAlign = 'right';
  context.fillText('HUMID', x + width, 602);
}

function drawPressureGauge(context: CanvasRenderingContext2D, progress: number) {
  const left = 60;
  const top = 505;
  const bars = 18;
  const gap = 8;
  const width = (FACE_WIDTH - 120 - gap * (bars - 1)) / bars;
  const peakX = left + progress * (FACE_WIDTH - 120);
  for (let i = 0; i < bars; i += 1) {
    const x = left + i * (width + gap);
    const center = x + width / 2;
    const bell = Math.exp(-Math.pow((center - peakX) / 74, 2));
    const height = 18 + bell * 76;
    context.fillStyle = Math.abs(center - peakX) < 20 ? '#BA534B' : 'rgba(200,121,112,.38)';
    roundedRectPath(context, x, top + 105 - height, width, height, 3);
    context.fill();
  }
  context.strokeStyle = '#E78C80';
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(peakX, top + 1);
  context.lineTo(peakX, top + 106);
  context.stroke();
  context.fillStyle = '#BA534B';
  context.beginPath();
  context.arc(peakX, top + 4, 6, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = 'rgba(230,226,216,.54)';
  context.font = '11px "JetBrains Mono", monospace';
  context.textAlign = 'left';
  context.fillText('LOW', left, 644);
  context.textAlign = 'right';
  context.fillText('HIGH', FACE_WIDTH - left, 644);
}

function drawMetricFace(face: Face, metric: Metric, pose: CardPose, time: number, index: number) {
  const { context } = face;
  const accent = metric.accent;
  context.clearRect(0, 0, FACE_WIDTH, FACE_HEIGHT);
  context.save();
  roundedRectPath(context, 2, 2, FACE_WIDTH - 4, FACE_HEIGHT - 4, 26);
  context.clip();
  context.fillStyle = '#0D192B';
  context.fillRect(0, 0, FACE_WIDTH, FACE_HEIGHT);
  const glow = context.createRadialGradient(430, 30, 15, 430, 30, 500);
  glow.addColorStop(0, `${accent}24`);
  glow.addColorStop(1, '#0D192B00');
  context.fillStyle = glow;
  context.fillRect(0, 0, FACE_WIDTH, FACE_HEIGHT);

  context.fillStyle = accent;
  context.fillRect(52, 49, 4, 29);
  context.fillStyle = 'rgba(237,232,220,.66)';
  context.font = '11px "JetBrains Mono", monospace';
  context.textAlign = 'left';
  context.fillText('APEX AI  /  COMFORT SYSTEMS', 69, 69);
  context.textAlign = 'right';
  context.fillStyle = 'rgba(237,232,220,.42)';
  context.fillText(`${String(index + 1).padStart(2, '0')} / 05`, FACE_WIDTH - 52, 69);

  context.strokeStyle = 'rgba(214,184,121,.2)';
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(52, 99);
  context.lineTo(FACE_WIDTH - 52, 99);
  context.stroke();

  context.textAlign = 'left';
  context.fillStyle = accent;
  context.font = '12px "JetBrains Mono", monospace';
  context.fillText(metric.eyebrow, 56, 145);
  context.fillStyle = '#F6F1E7';
  context.font = '500 37px Geist, "Plus Jakarta Sans", Arial, sans-serif';
  context.fillText(metric.name, 56, 196);

  const oldValue = metric.values[pose.step];
  const nextValue = metric.values[Math.min(2, pose.step + 1)];
  const valueY = 319;
  context.save();
  context.beginPath();
  context.rect(45, 214, FACE_WIDTH - 90, 148);
  context.clip();
  context.textAlign = 'left';
  context.font = '600 112px Geist, "Plus Jakarta Sans", Arial, sans-serif';
  context.fillStyle = '#F6F1E7';
  const roll = pose.step < 2 ? pose.mix : 0;
  context.globalAlpha = 1 - roll;
  context.fillText(oldValue, 56, valueY - roll * 40);
  if (roll > 0.001) {
    context.globalAlpha = roll;
    context.fillText(nextValue, 56, valueY + (1 - roll) * 40);
  }
  context.restore();
  context.textAlign = 'left';
  context.fillStyle = accent;
  context.font = '15px "JetBrains Mono", monospace';
  context.fillText(metric.unit, 59, 354);
  context.fillStyle = 'rgba(237,232,220,.58)';
  context.font = '11px "JetBrains Mono", monospace';
  context.fillText(metric.caption, 56, 405);

  context.strokeStyle = 'rgba(214,184,121,.17)';
  context.beginPath();
  context.moveTo(56, 448);
  context.lineTo(FACE_WIDTH - 56, 448);
  context.stroke();
  if (metric.gauge === 'ruler') drawRuleGauge(context, pose.progress, accent);
  if (metric.gauge === 'fan') drawFanGauge(context, pose.progress, time + index * 0.6, accent);
  if (metric.gauge === 'bars') drawLoadGauge(context, pose.progress, accent);
  if (metric.gauge === 'humidity') drawHumidityGauge(context, pose.progress);
  if (metric.gauge === 'histogram') drawPressureGauge(context, pose.progress);

  context.fillStyle = 'rgba(237,232,220,.44)';
  context.font = '10px "JetBrains Mono", monospace';
  context.textAlign = 'left';
  context.fillText('APEX / HOME COMFORT', 56, 688);
  context.textAlign = 'right';
  context.fillText('ILLUSTRATIVE READING', FACE_WIDTH - 56, 688);
  context.restore();
  context.save();
  roundedRectPath(context, 2, 2, FACE_WIDTH - 4, FACE_HEIGHT - 4, 26);
  context.strokeStyle = `${accent}8A`;
  context.lineWidth = 2;
  context.stroke();
  context.restore();
}

function createProgram(gl: WebGL2RenderingContext, vertexSource: string, fragmentSource: string) {
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) throw new Error('WebGL shader creation failed');
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader) || 'WebGL shader compilation failed';
      gl.deleteShader(shader);
      throw new Error(message);
    }
    return shader;
  };
  const vertex = compile(gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!program) throw new Error('WebGL program creation failed');
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) || 'WebGL program link failed';
    gl.deleteProgram(program);
    throw new Error(message);
  }
  return program;
}

function createWebGLRenderer(canvas: HTMLCanvasElement, faces: Face[]) {
  const gl = canvas.getContext('webgl2', { alpha: true, antialias: true, premultipliedAlpha: true });
  if (!gl) return null;
  const vertexSource = `#version 300 es
    precision highp float;
    in vec2 aPosition;
    in vec2 aUv;
    uniform vec2 uCenter;
    uniform vec2 uSize;
    uniform float uBend;
    uniform float uDirection;
    uniform float uAngle;
    out vec2 vUv;
    out float vBend;
    out float vEdge;
    void main() {
      float edge = abs(aPosition.x) * 2.0;
      float curl = pow(edge, 1.65);
      vec2 local = vec2(
        aPosition.x * uSize.x * (1.0 + uBend * 0.2 * edge),
        aPosition.y * uSize.y * (1.0 + uBend * 0.1 * edge)
      );
      local.y += uDirection * uBend * curl * 46.0;
      float cs = cos(uAngle);
      float sn = sin(uAngle);
      vec2 bent = vec2(local.x * cs - local.y * sn, local.x * sn + local.y * cs);
      vec2 pixel = uCenter + bent;
      gl_Position = vec4(pixel.x / 540.0 - 1.0, 1.0 - pixel.y / 540.0, 0.0, 1.0);
      vUv = aUv;
      vBend = uBend;
      vEdge = edge;
    }
  `;
  const fragmentSource = `#version 300 es
    precision highp float;
    uniform sampler2D uTexture;
    uniform float uBend;
    uniform float uDirection;
    uniform float uOpacity;
    in vec2 vUv;
    in float vBend;
    in float vEdge;
    out vec4 outColor;
    void main() {
      float chroma = (0.001 + vBend * 0.012) * (0.3 + vEdge * 0.7);
      vec4 base = texture(uTexture, vUv);
      float red = texture(uTexture, clamp(vUv + vec2(uDirection * chroma, 0.0), 0.0, 1.0)).r;
      float blue = texture(uTexture, clamp(vUv - vec2(uDirection * chroma, 0.0), 0.0, 1.0)).b;
      float edgeDistance = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
      float softEdge = smoothstep(0.0, 0.024, edgeDistance);
      vec4 pulled = texture(uTexture, clamp(vUv + vec2(uDirection * chroma * 2.0, 0.0), 0.0, 1.0));
      vec3 fringe = vec3(red, base.g, blue);
      vec3 color = mix(base.rgb, fringe, min(0.78, vBend * 0.48));
      color = mix(color, pulled.rgb, vBend * 0.13 * vEdge);
      outColor = vec4(color, base.a * softEdge * uOpacity);
    }
  `;

  const program = createProgram(gl, vertexSource, fragmentSource);
  const vao = gl.createVertexArray();
  const vertexBuffer = gl.createBuffer();
  const indexBuffer = gl.createBuffer();
  if (!vao || !vertexBuffer || !indexBuffer) throw new Error('WebGL buffer creation failed');
  const columns = 32;
  const rows = 36;
  const vertices = new Float32Array((columns + 1) * (rows + 1) * 4);
  for (let row = 0; row <= rows; row += 1) {
    for (let column = 0; column <= columns; column += 1) {
      const index = (row * (columns + 1) + column) * 4;
      const u = column / columns;
      const v = row / rows;
      vertices[index] = u - 0.5;
      vertices[index + 1] = v - 0.5;
      vertices[index + 2] = u;
      vertices[index + 3] = v;
    }
  }
  const indices = new Uint16Array(columns * rows * 6);
  let cursor = 0;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const topLeft = row * (columns + 1) + column;
      const topRight = topLeft + 1;
      const bottomLeft = topLeft + columns + 1;
      const bottomRight = bottomLeft + 1;
      indices[cursor++] = topLeft;
      indices[cursor++] = bottomLeft;
      indices[cursor++] = topRight;
      indices[cursor++] = topRight;
      indices[cursor++] = bottomLeft;
      indices[cursor++] = bottomRight;
    }
  }

  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'aPosition');
  const uv = gl.getAttribLocation(program, 'aUv');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 16, 0);
  gl.enableVertexAttribArray(uv);
  gl.vertexAttribPointer(uv, 2, gl.FLOAT, false, 16, 8);

  const centerLocation = gl.getUniformLocation(program, 'uCenter');
  const sizeLocation = gl.getUniformLocation(program, 'uSize');
  const bendLocation = gl.getUniformLocation(program, 'uBend');
  const directionLocation = gl.getUniformLocation(program, 'uDirection');
  const angleLocation = gl.getUniformLocation(program, 'uAngle');
  const opacityLocation = gl.getUniformLocation(program, 'uOpacity');
  const textureLocation = gl.getUniformLocation(program, 'uTexture');
  // The mesh uses top-left canvas UVs, so the uploaded faces must not be flipped.
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
  const textures = faces.map((face) => {
    const texture = gl.createTexture();
    if (!texture) throw new Error('WebGL texture creation failed');
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, face.canvas);
    return texture;
  });
  gl.useProgram(program);
  gl.uniform1i(textureLocation, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  return (frame: Frame) => {
    gl.viewport(0, 0, STAGE_SIZE, STAGE_SIZE);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.bindVertexArray(vao);
    gl.activeTexture(gl.TEXTURE0);
    const ordered = frame.cards.map((pose, index) => ({ pose, index })).sort((a, b) => Math.abs(b.pose.relative) - Math.abs(a.pose.relative));
    for (const { pose, index } of ordered) {
      gl.bindTexture(gl.TEXTURE_2D, textures[index]);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, faces[index].canvas);
      gl.uniform2f(centerLocation, pose.centerX, pose.centerY);
      gl.uniform2f(sizeLocation, FACE_WIDTH * (1 + pose.bend * 0.19), FACE_HEIGHT * (1 + pose.bend * 0.08));
      gl.uniform1f(bendLocation, pose.bend);
      gl.uniform1f(directionLocation, pose.direction);
      gl.uniform1f(angleLocation, pose.direction * pose.bend * 0.14);
      gl.uniform1f(opacityLocation, pose.opacity);
      gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    }
  };
}

function drawFlatFrame(context: CanvasRenderingContext2D, faces: Face[], frame: Frame) {
  context.clearRect(0, 0, STAGE_SIZE, STAGE_SIZE);
  const ordered = frame.cards.map((pose, index) => ({ pose, index })).sort((a, b) => Math.abs(b.pose.relative) - Math.abs(a.pose.relative));
  for (const { pose, index } of ordered) {
    const scale = 1 + pose.bend * 0.07;
    const width = FACE_WIDTH * scale;
    const height = FACE_HEIGHT * scale;
    context.globalAlpha = pose.opacity;
    context.drawImage(faces[index].canvas, pose.centerX - width / 2, pose.centerY - height / 2, width, height);
  }
  context.globalAlpha = 1;
}

export default function ComfortSystemsCarousel({ onPlanVisit }: { onPlanVisit: () => void }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const webglRef = useRef<HTMLCanvasElement>(null);
  const flatRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    if (typeof IntersectionObserver === 'undefined') { setReady(true); return; }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setReady(true);
        observer.disconnect();
      }
    }, { rootMargin: '400px 0px' });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!ready) return;
    const stage = stageRef.current;
    const webglCanvas = webglRef.current;
    const flatCanvas = flatRef.current;
    const flatContext = flatCanvas?.getContext('2d');
    if (!stage || !webglCanvas || !flatCanvas || !flatContext) return;

    webglCanvas.width = STAGE_SIZE;
    webglCanvas.height = STAGE_SIZE;
    flatCanvas.width = STAGE_SIZE;
    flatCanvas.height = STAGE_SIZE;
    const faces: Face[] = metrics.map(() => {
      const canvas = document.createElement('canvas');
      canvas.width = FACE_WIDTH;
      canvas.height = FACE_HEIGHT;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('2D canvas is unavailable for the comfort carousel');
      return { canvas, context };
    });

    let renderWebGL: ((frame: Frame) => void) | null = null;
    try {
      renderWebGL = createWebGLRenderer(webglCanvas, faces);
    } catch {
      renderWebGL = null;
    }
    stage.dataset.renderer = renderWebGL ? 'webgl2' : 'flat';

    let alive = true;
    let visible = typeof IntersectionObserver === 'undefined';
    let raf = 0;
    let lastTime = 0;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const originalRender = window.__render;
    const originalLoop = window.__LOOP;
    const originalManual = Object.getOwnPropertyDescriptor(window, '__MANUAL');
    let manual = Boolean(window.__MANUAL);

    const renderAt = (time: number) => {
      if (!alive || !Number.isFinite(time)) return;
      lastTime = time;
      const frame = poseAt(time);
      for (let index = 0; index < metrics.length; index += 1) {
        drawMetricFace(faces[index], metrics[index], frame.cards[index], frame.time, index);
      }
      if (renderWebGL) renderWebGL(frame);
      else drawFlatFrame(flatContext, faces, frame);
    };
    const deterministicRender = (time: number) => renderAt(time);

    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const start = () => {
      if (!alive || reducedMotion || manual || !visible || raf) return;
      const tick = (timestamp: number) => {
        raf = 0;
        if (!alive || reducedMotion || manual || !visible) return;
        renderAt((timestamp - origin) / 1000);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const origin = performance.now();

    window.__LOOP = LOOP_SECONDS;
    window.__render = deterministicRender;
    Object.defineProperty(window, '__MANUAL', {
      configurable: true,
      enumerable: false,
      get: () => manual,
      set: (value: boolean) => {
        manual = Boolean(value);
        if (manual) stop();
        else start();
      },
    });

    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      if (visible) start();
      else stop();
    }, { threshold: 0.01 });
    observer?.observe(stage);

    renderAt(0);
    if (!reducedMotion) start();
    void document.fonts?.ready.then(() => renderAt(lastTime)).catch(() => {});

    return () => {
      alive = false;
      stop();
      observer?.disconnect();
      if (window.__render === deterministicRender) {
        if (originalRender === undefined) delete window.__render;
        else window.__render = originalRender;
      }
      if (originalLoop === undefined) delete window.__LOOP;
      else window.__LOOP = originalLoop;
      if (originalManual) Object.defineProperty(window, '__MANUAL', originalManual);
      else delete window.__MANUAL;
      if (renderWebGL) webglCanvas.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [ready]);

  return (
    <section className="comfort-metrics-section" aria-labelledby="comfort-metrics-title">
      <div className="metrics-intro">
        <div>
          <span className="eyebrow">SYSTEMS / IN MOTION</span>
          <h2 id="comfort-metrics-title">Comfort is a system.<br /><i>See the moving parts.</i></h2>
        </div>
        <div className="metrics-intro-copy">
          <p>Temperature, airflow and humidity work together. This small system study shows the kinds of conditions an HVAC professional may consider while learning what your home needs.</p>
          <button type="button" className="metrics-visit-link" onClick={onPlanVisit}>Talk through your home <ArrowUpRight size={16} /></button>
        </div>
      </div>

      <div
        className="metrics-stage"
        ref={stageRef}
        data-renderer="flat"
        role="img"
        aria-label="Animated illustration of five HVAC comfort settings: thermostat setpoint, airflow, system load, humidity and filter pressure. Values are illustrative, not live readings."
      >
        <canvas ref={webglRef} className="metrics-canvas metrics-webgl" width={STAGE_SIZE} height={STAGE_SIZE} aria-hidden="true" />
        <canvas ref={flatRef} className="metrics-canvas metrics-flat" width={STAGE_SIZE} height={STAGE_SIZE} aria-hidden="true" />
        <div className="metrics-stage-labels" aria-hidden="true"><span>APEX AI / HOME COMFORT</span><span>ILLUSTRATIVE · NOT LIVE DATA</span></div>
        <div className="metrics-stage-footer" aria-hidden="true"><span>COMFORT CONDITIONS</span><span>1080 × 1080 / SYSTEM STUDY</span></div>
      </div>
      <ol className="metrics-screen-reader-list">
        {metrics.map((metric) => <li key={metric.name}>{metric.name}: {metric.values.join(', ')} {metric.unit}. An illustrative setting, not a live diagnostic reading.</li>)}
      </ol>
      <p className="metrics-disclaimer">Illustrative comfort values only — not live telemetry or a diagnosis. A technician assesses the actual equipment and home before making recommendations.</p>
    </section>
  );
}
