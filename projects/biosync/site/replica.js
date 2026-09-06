// The exported Neural ODE, ported. Same MLP, same RK4, same step. Runs what-ifs client-side.
(function () {
  const C = window.CASE || {};
  const W = C.weights, dt = C.dt, EMB = 3;
  if (!W) { window.Replica = null; return; }
  const W1 = W.W1, b1 = W.b1, W2 = W.W2, b2 = W.b2;

  function f(z, u) {
    const a = z.concat(u), h = new Array(b1.length);
    for (let j = 0; j < b1.length; j++) { let s = b1[j]; for (let i = 0; i < a.length; i++) s += a[i] * W1[i][j]; h[j] = Math.tanh(s); }
    const o = new Array(b2.length);
    for (let k = 0; k < b2.length; k++) { let s = b2[k]; for (let j = 0; j < h.length; j++) s += h[j] * W2[j][k]; o[k] = s; }
    return o;
  }
  const axpy = (z, a, k) => z.map((v, i) => v + a * k[i]);
  function step(z, u) {
    const k1 = f(z, u), k2 = f(axpy(z, dt / 2, k1), u), k3 = f(axpy(z, dt / 2, k2), u), k4 = f(axpy(z, dt, k3), u);
    return z.map((v, i) => v + dt / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
  }
  // meal absorption proxy from a carbs-per-slot array, same first-order filter as training
  function mealProxy(carbs) {
    let q = 0; const out = [];
    for (const c of carbs) { q += c; q *= Math.exp(-5 / 40); out.push(q / 100); }
    return out;
  }
  window.Replica = {
    // inputs: {meal[], act[], sleep[]} per 5-min slot; anchor every `re` slots on truth if given
    rollout(z0, inputs, pid, re, anchor) {
      const emb = C.emb[pid];
      let z = z0.slice(), out = [z.slice()];
      for (let t = 0; t < inputs.meal.length; t++) {
        if (re && anchor && t % re === 0 && t > 0) { z = [anchor.g[t] / 100, anchor.hr[t] / 100, 0, 0]; }
        z = step(z, [inputs.meal[t], inputs.act[t], inputs.sleep[t]].concat(emb));
        out.push(z.slice());
      }
      return out;
    },
    mealProxy
  };
})();
