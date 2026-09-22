/* Independent check of the numbers the Collatz Oracle puts on screen.
   Run: node tools/verify.mjs   */

function orbitOf(n) {
  const seq = [n];
  let cur = n;
  while (cur !== 1) {
    cur = cur % 2 === 0 ? cur / 2 : 3 * cur + 1;
    seq.push(cur);
  }
  return seq;
}

function stoppingTimes(M) {
  const st = new Float64Array(M + 1);
  const big = new Map();
  for (let i = 2; i <= M; i++) {
    let cur = i, steps = 0;
    while (cur !== 1) {
      if (cur <= M && st[cur] > 0) { steps += st[cur]; break; }
      if (cur > M) { const hit = big.get(cur); if (hit != null) { steps += hit; break; } }
      cur = cur % 2 === 0 ? cur / 2 : 3 * cur + 1;
      steps++;
    }
    st[i] = steps;
  }
  return st;
}

let fails = 0;
const ok = (cond, msg) => { console.log(`${cond ? "PASS" : "FAIL"}  ${msg}`); if (!cond) fails++; };

/* 1 — known orbits */
for (const [n, expect] of [[1, 0], [2, 1], [6, 8], [27, 111], [97, 118], [703, 170], [6171, 261], [77031, 350]]) {
  const o = orbitOf(n);
  ok(o.length - 1 === expect, `orbit(${n}) stopping time = ${o.length - 1} (expected ${expect})`);
}

/* 2 — 27's peak is the well-known 9232 */
{
  const o = orbitOf(27);
  const peak = Math.max(...o);
  ok(peak === 9232, `orbit(27) peak = ${peak} (expected 9232)`);
}

/* 3 — memoised stopping times agree with brute force on a sample */
{
  const M = 3000;
  const st = stoppingTimes(M);
  let mismatch = 0;
  for (let i = 2; i <= M; i++) if (st[i] !== orbitOf(i).length - 1) mismatch++;
  ok(mismatch === 0, `memoised stopping times match brute force for 2..${M} (${mismatch} mismatches)`);
}

/* 4 — the log-normal fit actually fits */
for (const M of [500, 2000, 8000]) {
  const st = stoppingTimes(M);
  const s = [];
  for (let i = 2; i <= M; i++) if (st[i] > 0) s.push(st[i]);
  const logs = s.map(Math.log);
  const mu = logs.reduce((a, b) => a + b, 0) / s.length;
  const sigma = Math.sqrt(logs.reduce((a, b) => a + (b - mu) ** 2, 0) / s.length);
  const mean = s.reduce((a, b) => a + b, 0) / s.length;
  const sd = Math.sqrt(s.reduce((a, b) => a + (b - mean) ** 2, 0) / s.length);
  /* log-normal mean identity: E[X] should equal exp(mu + sigma^2/2) for X ~ LogN */
  const predicted = Math.exp(mu + (sigma * sigma) / 2);
  const relErr = Math.abs(predicted - mean) / mean;
  ok(relErr < 0.05, `M=${M}: E[X]=${mean.toFixed(2)} vs exp(mu+s^2/2)=${predicted.toFixed(2)} (rel err ${(relErr * 100).toFixed(2)}%)`);
  console.log(`      mu=${mu.toFixed(4)} sigma=${sigma.toFixed(4)} sd=${sd.toFixed(2)} skew~${(sd / mean).toFixed(3)}`);
}

console.log(fails === 0 ? "\nALL CHECKS PASSED" : `\n${fails} CHECK(S) FAILED`);
process.exit(fails === 0 ? 0 : 1);
