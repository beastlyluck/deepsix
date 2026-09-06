// Raw WebGL spatial map. No library. Points for drones, line strips for
// trails, a ground grid. Camera orbits around the formation centre.
(function () {
  const canvas = document.getElementById("gl");
  const gl = canvas.getContext("webgl", { antialias: true });
  if (!gl) { canvas.replaceWith(Object.assign(document.createElement("p"), { textContent: "WebGL unavailable" })); return; }

  const VS = `
    attribute vec3 aPos; attribute vec3 aCol; attribute float aSize;
    uniform mat4 uMVP; varying vec3 vCol;
    void main(){ gl_Position = uMVP * vec4(aPos, 1.0); gl_PointSize = aSize; vCol = aCol; }`;
  const FS = `
    precision mediump float; varying vec3 vCol; uniform bool uRound;
    void main(){
      if (uRound) { vec2 d = gl_PointCoord - 0.5; if (dot(d,d) > 0.25) discard; }
      gl_FragColor = vec4(vCol, 1.0); }`;

  function shader(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
  const prog = gl.createProgram();
  gl.attachShader(prog, shader(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog); gl.useProgram(prog);
  const aPos = gl.getAttribLocation(prog, "aPos"), aCol = gl.getAttribLocation(prog, "aCol"), aSize = gl.getAttribLocation(prog, "aSize");
  const uMVP = gl.getUniformLocation(prog, "uMVP"), uRound = gl.getUniformLocation(prog, "uRound");
  const buf = gl.createBuffer();

  function mat4mul(a, b) {
    const o = new Float32Array(16);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; o[i * 4 + j] = s;
    }
    return o;
  }
  function perspective(fov, aspect, n, f) {
    const t = 1 / Math.tan(fov / 2), r = 1 / (n - f);
    return new Float32Array([t / aspect, 0, 0, 0, 0, t, 0, 0, 0, 0, (n + f) * r, -1, 0, 0, 2 * n * f * r, 0]);
  }
  function lookAt(eye, at, up) {
    const z = norm(sub(eye, at)), x = norm(cross(up, z)), y = cross(z, x);
    return new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0,
      -dot(x, eye), -dot(y, eye), -dot(z, eye), 1]);
  }
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = a => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

  function draw(mode, verts, round) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.DYNAMIC_DRAW);
    const stride = 7 * 4;
    gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(aCol); gl.vertexAttribPointer(aCol, 3, gl.FLOAT, false, stride, 12);
    gl.enableVertexAttribArray(aSize); gl.vertexAttribPointer(aSize, 1, gl.FLOAT, false, stride, 24);
    gl.uniform1i(uRound, round ? 1 : 0);
    gl.drawArrays(mode, 0, verts.length / 7);
  }

  // Ground grid once.
  const grid = [];
  for (let i = -10; i <= 10; i += 2) {
    grid.push(i, -10, 0, 0.12, 0.17, 0.25, 1, i, 10, 0, 0.12, 0.17, 0.25, 1);
    grid.push(-10, i, 0, 0.12, 0.17, 0.25, 1, 10, i, 0, 0.12, 0.17, 0.25, 1);
  }

  const palette = [[0.21, 0.78, 1], [0.43, 0.94, 1], [1, 0.7, 0.28], [0.6, 1, 0.6], [1, 0.37, 0.48], [0.8, 0.7, 1]];
  const reasonCol = { gust: [1, 0.7, 0.28], formation: [1, 0.37, 0.48], spacing: [0.8, 0.7, 1] };

  window.AeroGL = {
    render(frames, k, yawDeg) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0.043, 0.055, 0.078, 1); gl.clear(gl.COLOR_BUFFER_BIT);
      const yaw = yawDeg * Math.PI / 180;
      const eye = [22 * Math.cos(yaw), 22 * Math.sin(yaw), 20], at = [0, 0, 11];
      const mvp = mat4mul(perspective(0.9, canvas.width / canvas.height, 0.1, 200), lookAt(eye, at, [0, 0, 1]));
      gl.uniformMatrix4fv(uMVP, false, mvp);
      draw(gl.LINES, grid, false);
      if (!frames.length) return;
      const n = frames[0].drones.length;
      for (let d = 0; d < n; d++) {
        const trail = [];
        for (let i = Math.max(0, k - 120); i <= k; i++) {
          const p = frames[i].drones[d].p, c = palette[d % palette.length], f = (i - (k - 120)) / 120;
          trail.push(p[0], p[1], p[2], c[0] * f, c[1] * f, c[2] * f, 1);
        }
        if (trail.length >= 14) draw(gl.LINE_STRIP, trail, false);
      }
      const pts = [];
      frames[k].drones.forEach((dr, d) => {
        const c = reasonCol[dr.reason] || palette[d % palette.length];
        pts.push(dr.p[0], dr.p[1], dr.p[2], c[0], c[1], c[2], dr.reason === "nominal" ? 9 : 13);
        pts.push(dr.p[0], dr.p[1], 0, 0.15, 0.2, 0.3, 4);   // ground shadow
      });
      draw(gl.POINTS, pts, true);
    }
  };
})();
