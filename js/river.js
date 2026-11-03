(function() {
  "use strict";
  var V = {};
  var BREATH = {
    FLOW: 40,
    EASE: 3,
    REST: 8,
    SLOW: .3,
    OPEN: -3
  };
  var LANES = [ "near", "mid", "far" ];
  var MOD = [ 1, .88, 1.06, .92, .97, 1.03 ];
  var JIT = {
    near: [ 0, -26, 18, -12, 26, -8 ],
    mid: [ -10, 14, -18, 6, 20, -14 ],
    far: [ 12, -10, 20, -16, 4, -20 ]
  };
  var FEAT_CAP = 2;
  var DESK = {
    S0: {
      near: 340,
      mid: 220,
      far: 180
    },
    CY: {
      near: 380,
      mid: 570,
      far: 170
    },
    GAP: {
      near: [ 120, 220, 160, 280 ],
      mid: [ 90, 170, 120, 210 ],
      far: [ 80, 150, 110, 190 ]
    },
    STILL: {
      mid: 640,
      far: 760
    },
    INSET: 24,
    W: 2e3,
    H: 760,
    LANES: [ "near", "mid", "far" ]
  };
  var PHONE = {
    S0: {
      near: 260,
      mid: 170
    },
    CY: {
      near: 345,
      mid: 155
    },
    GAP: {
      near: [ 70, 100, 85, 110 ],
      mid: [ 40, 60, 50, 70 ]
    },
    STILL: {
      mid: 160
    },
    INSET: 16,
    W: 640,
    H: 600,
    LANES: [ "near", "mid" ]
  };
  var BANDS = {
    desktop: {
      px: {
        near: 25,
        mid: 15,
        far: 10
      },
      br: [ 40, 3, 8, .3 ],
      A: {
        near: 22,
        mid: 16,
        far: 12
      },
      tmax: 6,
      cap: 3,
      every: [ 7, 12 ],
      hero: 330
    },
    tabletLand: {
      px: {
        near: 28,
        mid: 17,
        far: 11
      },
      br: [ 36, 3, 6, .35 ],
      A: {
        near: 22,
        mid: 16,
        far: 12
      },
      tmax: 6,
      cap: 3,
      every: [ 7, 12 ],
      hero: 330
    },
    tablet: {
      px: {
        near: 32,
        mid: 19,
        far: 13
      },
      br: [ 32, 3, 5, .4 ],
      A: {
        near: 18,
        mid: 13,
        far: 10
      },
      tmax: 5,
      cap: 2,
      every: [ 7, 12 ],
      hero: 330
    },
    phone: {
      px: {
        near: 44,
        mid: 26
      },
      br: [ 24, 2, 3, .5 ],
      A: {
        near: 10,
        mid: 8
      },
      tmax: 3.5,
      cap: 1,
      every: [ 6, 2 ],
      hero: 200
    },
    shortLand: {
      px: {
        near: 36,
        mid: 22,
        far: 14
      },
      br: [ 24, 2, 3, .5 ],
      A: {
        near: 12,
        mid: 9,
        far: 7
      },
      tmax: 4,
      cap: 2,
      every: [ 7, 12 ],
      hero: 330
    }
  };
  var S0, CY, GAP, STILL_X, INSET, STAGE_W, STAGE_H, BUILT, WINS_B, band, P;
  var LEADERS = [ "house", "frog", "woman" ];
  var TAIL_N = 6;
  var LEAD_MARGIN = 400;
  var GOLD_P = .3;
  var GOLD_WIN = 6;
  var REPEAT_GAP = 7;
  var TAIL_GOLD = 2;
  var OPA = {
    near: 1,
    mid: .82,
    far: .62
  };
  var WIN_U = 1600;
  var SHOUT_HI = .6;
  var SHOUT_K = .85;
  var RUNIN_MAX = 4;
  var TAIL_TRIES = 6;
  function shoutOf(c) {
    return c.p98 * (1 - c.lum);
  }
  var M_CAP = .45, M_FLOOR = .72;
  function massMul(c) {
    return c.lum <= M_CAP ? 1 : Math.max(M_FLOOR, Math.sqrt(M_CAP / c.lum));
  }
  function sizeMul(c) {
    var x = shoutOf(c) - .52;
    var shout = x <= 0 ? 1 : Math.max(.8, 1 - SHOUT_K * x);
    return Math.min(shout, massMul(c));
  }
  function windowMass(cards, L, stageH, opa, x) {
    var tot = 0, i, c, a, b, k, hi = x + WIN_U;
    for (k = x < 0 ? -1 : 0; k <= (hi > L ? 1 : 0); k++) {
      for (i = 0; i < cards.length; i++) {
        c = cards[i];
        a = Math.max(x, c.x0 + k * L);
        b = Math.min(x + WIN_U, c.x0 + k * L + c.w);
        if (b > a) tot += (b - a) * c.h * c.lum * opa;
      }
    }
    return tot / (WIN_U * stageH);
  }
  var SLICE_F = .3, W_SLICE = 4;
  var WINS = [ [ 0, WIN_U, 240 ], [ 200, 1200, 150 ] ];
  var WINS_PHONE = [ [ -200, 640, 60 ] ];
  function sliceCost(cards, L, opa, x0, wins) {
    var tot = 0, i, c, k, a, b, lo, hi, off, stub, q, x, win, hide;
    for (q = 0; q < wins.length; q++) {
      x = x0 + wins[q][0];
      win = wins[q][1];
      hide = wins[q][2];
      for (k = -1; k <= 1; k++) {
        for (i = 0; i < cards.length; i++) {
          c = cards[i];
          a = c.x0 + k * L;
          b = a + c.w;
          lo = Math.max(a, x);
          hi = Math.min(b, x + win);
          if (hi <= lo) continue;
          off = lo - a + (b - hi);
          if (off <= 0) continue;
          stub = hi - lo;
          if (off / c.w < SLICE_F || stub <= hide) continue;
          tot += (stub - hide) / win * c.lum * opa;
        }
      }
    }
    return tot;
  }
  function gcd(a, b) {
    while (b) {
      var t = a % b;
      a = b;
      b = t;
    }
    return a;
  }
  function lcm(a, b) {
    return a / gcd(a, b) * b;
  }
  function restX(L, phase, D, c) {
    return ((200 - phase - c * D) % L + L) % L;
  }
  function minMass(cards, L, stageH, opa, step) {
    var m = Infinity, x;
    for (x = 0; x < L; x += step || 25) m = Math.min(m, windowMass(cards, L, stageH, opa, x));
    return m;
  }
  var river = document.querySelector(".river");
  var node = document.getElementById("river-manifest");
  if (!river || !node) return;
  var MANIFEST = JSON.parse(node.textContent);
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var Q = {
    shortLand: window.matchMedia("(max-height: 480px) and (min-width: 600px)"),
    phone: window.matchMedia("(max-width: 599px)"),
    tablet: window.matchMedia("(max-width: 899px)"),
    tabletLand: window.matchMedia("(max-width: 1199px)")
  };
  function bandOf() {
    for (var k in Q) if (Q[k].matches) return k;
    return "desktop";
  }
  function setBand(name) {
    var g = name === "phone" ? PHONE : DESK;
    band = name;
    P = BANDS[name];
    S0 = g.S0;
    CY = g.CY;
    GAP = g.GAP;
    STILL_X = g.STILL;
    INSET = g.INSET;
    STAGE_W = g.W;
    STAGE_H = g.H;
    BUILT = g.LANES;
    WINS_B = name === "phone" ? WINS_PHONE : WINS;
    BREATH.FLOW = P.br[0];
    BREATH.EASE = P.br[1];
    BREATH.REST = P.br[2];
    BREATH.SLOW = P.br[3];
    BEND.A = P.A;
    BEND.BASE = 2 * STAGE_W;
    BEND.JIT_MUL = name === "phone" ? .5 : .15;
    GILD.CAP = P.cap;
    GILD.EVERY = P.every;
    GILD.HERO_WIN = P.hero;
  }
  var seed = Math.random() * 4294967296 >>> 0;
  window.RIVER_SEED = seed;
  function rng() {
    seed |= 0;
    seed = seed + 1831565813 | 0;
    var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  function clone(c) {
    return {
      name: c.name,
      aspect: c.aspect,
      family: c.family,
      featured: !!c.featured,
      alt: c.alt,
      widths: c.widths,
      lum: c.lum,
      p98: c.p98,
      w: c.w,
      h: c.h,
      y: c.y,
      j: c.j,
      lane: c.lane
    };
  }
  function wrapCtx(seq, remaining, span) {
    var k = span - 1 - remaining;
    return k > 0 ? seq.slice(0, k) : [];
  }
  var bag = [];
  function refill(pool) {
    var add = pool.slice(), q, r, t;
    for (q = add.length - 1; q > 0; q--) {
      r = Math.floor(rng() * (q + 1));
      t = add[q];
      add[q] = add[r];
      add[r] = t;
    }
    bag = bag.concat(add);
  }
  function pickImage(seq, remaining, allow, score, pool, gap) {
    var i, pass, ahead = wrapCtx(seq, remaining, gap);
    var best = -1, bestS = -Infinity, sc;
    function near(name) {
      var d = 1e9, q;
      for (q = seq.length - 1; q >= 0; q--) if (seq[q].name === name) {
        d = seq.length - q;
        break;
      }
      for (q = 0; q < ahead.length; q++) if (ahead[q].name === name) {
        d = Math.min(d, remaining + 1 + q);
        break;
      }
      return d;
    }
    for (pass = 0; pass < 4; pass++) {
      for (i = 0; i < bag.length; i++) {
        if (near(bag[i].name) <= gap) continue;
        if (allow && !allow(bag[i])) continue;
        sc = score ? score(bag[i]) : 0;
        if (sc > bestS) {
          bestS = sc;
          best = i;
        }
      }
      if (best >= 0) return bag.splice(best, 1)[0];
      if (pass === 1 && allow) allow = null;
      refill(pool);
    }
    var bestD = -1, bestI = 0;
    for (i = 0; i < bag.length; i++) {
      var d = near(bag[i].name);
      if (d > bestD) {
        bestD = d;
        bestI = i;
      }
    }
    return bag.splice(bestI, 1)[0];
  }
  function goldable(seq, remaining, used) {
    if (used >= TAIL_GOLD) return false;
    var ahead = wrapCtx(seq, remaining, GOLD_WIN), i, n = 0;
    if (seq.length && seq[seq.length - 1].featured) return false;
    if (remaining === 0 && seq[0].featured) return false;
    for (i = Math.max(0, seq.length - (GOLD_WIN - 1)); i < seq.length; i++) if (seq[i].featured) n++;
    for (i = 0; i < ahead.length; i++) if (ahead[i].featured) n++;
    if (n >= FEAT_CAP) return false;
    return rng() < GOLD_P;
  }
  var BEND = {
    A: {
      near: 22,
      mid: 16,
      far: 12
    },
    BASE: 4e3,
    M: {
      near: [ 1, 1.5, 2.5 ],
      mid: [ 1, 2, 3 ],
      far: [ .75, 1.5, 2 ]
    },
    TILT: .5,
    JIT_MUL: .15
  };
  function bendField(k, base, drift) {
    var A = BEND.A[k], ms = BEND.M[k], i;
    var ph = [], w = [], norm = 0;
    for (i = 0; i < ms.length; i++) {
      ph.push(rng() * 2 * Math.PI);
      w.push(1 / ms[i]);
      norm += w[i];
    }
    return function(x, t, deriv) {
      var y = 0, i, kx, a;
      for (i = 0; i < ms.length; i++) {
        kx = 2 * Math.PI * ms[i] / base;
        a = A * w[i] / norm;
        var p = ph[i] + (drift && drift[i] ? 2 * Math.PI * t / drift[i] : 0);
        y += deriv === 2 ? -a * kx * kx * Math.sin(kx * x + p) : deriv === 1 ? a * kx * Math.cos(kx * x + p) : a * Math.sin(kx * x + p);
      }
      return y;
    };
  }
  function tiltDeg(slope) {
    return Math.atan(slope * BEND.TILT) * 180 / Math.PI;
  }
  var leafN = 0;
  function hash01(n) {
    var x = Math.imul(n, 2654435761) + seed >>> 0;
    x ^= x >>> 15;
    x = Math.imul(x, 2246822519);
    x ^= x >>> 13;
    x = Math.imul(x, 3266489917);
    x ^= x >>> 16;
    return (x >>> 0) / 4294967296;
  }
  function u(c, i) {
    return hash01(c.leaf * 8 + i);
  }
  function flowDeg(slope) {
    return Math.atan(slope) * 180 / Math.PI;
  }
  var LEAF = {
    R: 1.1,
    K: 1.7,
    Z: .55,
    TORQUE: 300
  };
  function leafTarget(c, s, slope) {
    return flowDeg(slope) + .6 * LEAF.R * Math.sin(2 * Math.PI * s / (600 + 500 * u(c, 2)) + 2 * Math.PI * u(c, 4)) + .4 * LEAF.R * Math.sin(2 * Math.PI * s / (900 + 500 * u(c, 3)) + 2 * Math.PI * u(c, 5));
  }
  function leafStep(fig, c, s, dt, slope, curv, v) {
    var tgt = leafTarget(c, s, slope);
    if (fig.th === undefined) {
      fig.th = tgt;
      fig.w = 0;
    }
    var acc = LEAF.K * LEAF.K * (tgt - fig.th) - 2 * LEAF.Z * LEAF.K * fig.w + LEAF.TORQUE * curv * v;
    fig.w += acc * dt;
    fig.th += fig.w * dt;
    return fig.th;
  }
  function breath(L, v0) {
    var f = BREATH.SLOW, R = BREATH.REST, E = BREATH.EASE, F = BREATH.FLOW, K = f * R + E * (1 + f);
    function cand(N) {
      var D = L / N, v = v0, flow = D / v - K;
      if (flow < .7 * F || flow > 1.4 * F) {
        v = Math.max(.88 * v0, Math.min(1.12 * v0, D / (K + F)));
        flow = D / v - K;
      }
      return {
        N: N,
        D: D,
        v: v,
        flow: flow,
        rest: R
      };
    }
    function ok(c) {
      return c.flow >= .7 * F && c.flow <= 1.4 * F;
    }
    var N0 = Math.max(1, Math.round(L / (v0 * (K + F)))), best = cand(N0);
    if (!ok(best)) {
      [ N0 - 1, N0 + 1 ].forEach((function(N) {
        if (N < 1) return;
        var c = cand(N);
        if (c.flow >= .5 * F && (best.flow < .5 * F || Math.abs(c.flow - F) < Math.abs(best.flow - F))) best = c;
      }));
      if (best.flow < .5 * F) {
        best.flow = .5 * F;
        best.v = best.D / (K + best.flow);
      }
    }
    best.B = R + 2 * E + best.flow;
    best.dur = best.N * best.B;
    return best;
  }
  function posAt(d, t) {
    var b = d.breath, B = b.B, E = BREATH.EASE, f = BREATH.SLOW, v = b.v;
    var NB = b.N * B, k = Math.floor(t / NB), tp = t - k * NB;
    var c = Math.min(b.N - 1, Math.floor(tp / B)), tau = tp - c * B, x = k * d.L + c * b.D;
    var ds = f * v * b.rest, de = .5 * v * E * (1 + f), s;
    if (tau < b.rest) return x + f * v * tau;
    s = tau - b.rest;
    if (s < E) return x + ds + v * (f * s + (1 - f) * s * s / (2 * E));
    s -= E;
    if (s < b.flow) return x + ds + de + v * s;
    s -= b.flow;
    return x + ds + de + v * b.flow + v * (s - (1 - f) * s * s / (2 * E));
  }
  function layout() {
    var phone = band === "phone";
    var stageH = STAGE_H;
    var stageW = STAGE_W;
    var cx = stageW / 2;
    var lanes = {
      near: [],
      mid: [],
      far: []
    };
    var capNear = Math.ceil(MANIFEST.length / BUILT.length);
    function count(k) {
      return lanes[k].length;
    }
    function nfeat(k) {
      var n = 0, i;
      for (i = 0; i < lanes[k].length; i++) if (lanes[k][i].featured) n++;
      return n;
    }
    function emptier() {
      return phone || count("mid") <= count("far") ? "mid" : "far";
    }
    MANIFEST.forEach((function(m) {
      var k;
      if (m.family === "panorama") {
        var np = {};
        [ "mid", "far" ].forEach((function(q) {
          np[q] = lanes[q].filter((function(c) {
            return c.family === "panorama";
          })).length;
        }));
        k = phone || np.mid < np.far ? "mid" : np.far < np.mid ? "far" : emptier();
      } else if (count("near") < capNear) {
        k = "near";
      } else {
        k = emptier();
      }
      if (m.featured && nfeat(k) >= FEAT_CAP) {
        k = BUILT.slice().sort((function(a, b) {
          return nfeat(a) - nfeat(b) || count(a) - count(b) || BUILT.indexOf(a) - BUILT.indexOf(b);
        }))[0];
      }
      lanes[k].push({
        name: m.name,
        aspect: m.aspect,
        family: m.family,
        featured: !!m.featured,
        alt: m.alt,
        widths: m.widths,
        lum: m.lum,
        p98: m.p98
      });
    }));
    LANES.forEach((function(k) {
      var L = lanes[k], j, t, tmp;
      for (j = 1; j < L.length; j++) {
        if (L[j].featured && L[j - 1].featured) {
          for (t = j + 1; t < L.length; t++) {
            if (!L[t].featured) {
              tmp = L[j];
              L[j] = L[t];
              L[t] = tmp;
              break;
            }
          }
        }
      }
    }));
    LEADERS.forEach((function(name) {
      var found = null;
      LANES.forEach((function(k) {
        var i = lanes[k].map((function(c) {
          return c.name;
        })).indexOf(name);
        if (i >= 0 && !found) found = lanes[k].splice(i, 1)[0];
      }));
      if (found) lanes.near.unshift(found);
    }));
    var out = {};
    var built = BUILT;
    function geom(c, k, j, mul) {
      var s = S0[k] * MOD[j % 6] * (mul || 1);
      c.lane = k;
      c.j = j;
      c.leaf = leafN++;
      c.w = Math.round(s * Math.sqrt(c.aspect));
      c.h = Math.round(s / Math.sqrt(c.aspect));
      var cy = CY[k] + JIT[k][j % 6] * BEND.JIT_MUL;
      c.y = Math.max(INSET, Math.min(stageH - INSET - c.h, Math.round(cy - c.h / 2)));
    }
    built.forEach((function(k) {
      var head = lanes[k];
      if (!head.length) return;
      var n = head.length, i;
      var pool = head, gap = Math.min(REPEAT_GAP, n - 1);
      bag = [];
      head.forEach((function(c, j) {
        geom(c, k, j, massMul(c));
        c.speaks = true;
        c.eager = true;
        c.role = "head";
      }));
      var xh = 0, xc = 0;
      head.forEach((function(c, j) {
        c.xHead = xh;
        xh += c.w + GAP[k][j % 4];
      }));
      var headLen = xh;
      var phaseHead;
      if (k === "near") {
        var F = head.filter((function(c) {
          return c.featured;
        }));
        var L3 = head.filter((function(c) {
          return LEADERS.indexOf(c.name) >= 0;
        }));
        if (L3.length === LEADERS.length) {
          if (phone) {
            var lead1 = L3.filter((function(c) {
              return c.featured;
            })).pop() || L3[L3.length - 1];
            phaseHead = cx - (lead1.xHead + lead1.w / 2);
          } else {
            phaseHead = cx - (L3[0].xHead + L3[L3.length - 1].xHead + L3[L3.length - 1].w) / 2;
          }
        } else if (!F.length) {
          phaseHead = 0;
        } else if (phone) {
          phaseHead = cx - (F[0].xHead + F[0].w / 2);
        } else {
          var a = F[0].xHead, b = F[F.length - 1].xHead + F[F.length - 1].w;
          phaseHead = cx - (a + b) / 2;
        }
      } else {
        phaseHead = STILL_X[k];
      }
      var LEAD_U = phaseHead + LEAD_MARGIN;
      var vk = V[k];
      var opa = OPA[k];
      var anch = head.map((function(c) {
        return c.lum * c.w * c.h;
      })).sort((function(p, q) {
        return p - q;
      }));
      var A_MIN = anch[Math.floor(anch.length / 2)];
      var quiet = k === "near" ? function(c) {
        return shoutOf(c) < SHOUT_HI;
      } : null;
      function runIn(extra) {
        var lead = [], leadLen = 0, i;
        for (i = n - 1; i >= 0 && leadLen < LEAD_U && lead.length < n; i--) {
          lead.unshift(clone(head[i]));
          lead[0].eager = true;
          lead[0].role = "lead";
          leadLen += head[i].w + GAP[k][head[i].j % 4];
        }
        var run = [], c, fwd, j;
        for (i = 0; i < extra; i++) {
          fwd = run.concat(lead, head).slice(0, REPEAT_GAP).reverse();
          c = clone(pickImage(fwd, 0, quiet, (function(m) {
            var z = S0[k] * MOD[(n + TAIL_N + i) % 6] * sizeMul(m);
            return m.lum * Math.round(z * Math.sqrt(m.aspect)) * Math.round(z / Math.sqrt(m.aspect));
          }), pool, gap));
          geom(c, k, n + TAIL_N + i, sizeMul(c));
          c.eager = true;
          c.role = "lead";
          c.featured = false;
          run.unshift(c);
        }
        lead = run.concat(lead);
        var x = 0;
        lead.forEach((function(q) {
          q.x0 = x;
          x += q.w + GAP[k][q.j % 4];
        }));
        leadLen = x;
        head.forEach((function(q) {
          q.x0 = x;
          x += q.w + GAP[k][q.j % 4];
        }));
        return {
          lead: lead,
          leadLen: leadLen,
          baseLen: x
        };
      }
      function deal(base, lead, target) {
        var t = [], used = 0, x = base, i, ctx, left, cand, prevA = A_MIN;
        for (i = 0; i < TAIL_N; i++) {
          ctx = lead.concat(head, t);
          left = TAIL_N - 1 - i;
          var need = prevA < A_MIN, pos = x, all = ctx;
          cand = clone(pickImage(ctx, left, quiet, (function(c) {
            var z = S0[k] * MOD[(n + i) % 6] * sizeMul(c);
            var p = {
              lum: c.lum,
              x0: pos,
              w: Math.round(z * Math.sqrt(c.aspect)),
              h: Math.round(z / Math.sqrt(c.aspect))
            };
            var wm = windowMass(all.concat([ p ]), 1e9, stageH, opa, pos + p.w - WIN_U);
            return Math.min(wm, target) / target + (need ? .5 * Math.min(c.lum * p.w * p.h / A_MIN, 1) : 0);
          }), pool, gap));
          geom(cand, k, n + i, sizeMul(cand));
          cand.featured = goldable(ctx, left, used);
          cand.role = "tail";
          if (cand.featured) used++;
          cand.x0 = x;
          x += cand.w + GAP[k][(n + i) % 4];
          prevA = cand.lum * cand.w * cand.h;
          t.push(cand);
        }
        return {
          tail: t,
          L: x
        };
      }
      var best = null, bestScore = -Infinity, extra, tryI;
      for (extra = 0; extra <= RUNIN_MAX; extra++) {
        for (tryI = 0; tryI < TAIL_TRIES; tryI++) {
          var ri = runIn(extra);
          var ph = phaseHead - ri.leadLen;
          var tgt = windowMass(ri.lead.concat(head), ri.baseLen, stageH, opa, 200 - phaseHead);
          var dl = deal(ri.baseLen, ri.lead, tgt);
          var seqT = ri.lead.concat(head, dl.tail);
          var bb = breath(dl.L, vk);
          var floor = minMass(seqT, dl.L, stageH, opa, 60);
          var own = [], R = bb.N, q, c, m, worst = Infinity, first = 0, slice = 0;
          for (c = 0; c < bb.N; c++) {
            var rx = restX(dl.L, ph, bb.D, c);
            own.push(windowMass(seqT, dl.L, stageH, opa, rx));
            slice += sliceCost(seqT, dl.L, opa, rx, WINS_B) / bb.N;
          }
          for (q = 0; q < LANES.length; q++) if (out[LANES[q]]) R = lcm(R, out[LANES[q]].breath.N);
          R = Math.min(R, 180);
          for (c = 0; c < R; c++) {
            m = own[c % bb.N];
            for (q = 0; q < LANES.length; q++) {
              var o = out[LANES[q]];
              if (o) m += o.restMass[c % o.restMass.length];
            }
            if (m < worst) worst = m;
            if (c === 1) first = m;
          }
          var sc = .6 * worst + .5 * first + .4 * floor - W_SLICE * slice;
          if (sc > bestScore) {
            bestScore = sc;
            best = {
              seq: seqT,
              L: dl.L,
              leadLen: ri.leadLen,
              lead: ri.lead.length
            };
          }
        }
      }
      var seq = best.seq, Llen = best.L, leadLen = best.leadLen, i2, xr = 0;
      for (i2 = 0; i2 < seq.length; i2++) {
        seq[i2].x0 = xr;
        xr += seq[i2].w + GAP[k][seq[i2].j % 4];
      }
      Llen = xr;
      var phase = phaseHead - leadLen;
      var phaseN = phase - Llen * Math.ceil(phase / Llen);
      seq.forEach((function(c) {
        c.xStill = Math.round(c.x0 + phase);
      }));
      var b = breath(Llen, vk);
      var rm = [], rc;
      for (rc = 0; rc < b.N; rc++) rm.push(windowMass(seq, Llen, stageH, opa, restX(Llen, phase, b.D, rc)));
      out[k] = {
        cards: seq,
        L: Llen,
        phase: phaseN,
        phaseRaw: phase,
        restMass: rm,
        headLen: headLen,
        leadLen: leadLen,
        heads: best.lead + n,
        v: vk,
        breath: b
      };
    }));
    return out;
  }
  var GILD = {
    P: {
      hero: .16,
      near: .038,
      mid: .03,
      far: .021
    },
    EVERY: [ 7, 12 ],
    HERO_WIN: 330,
    CAP: 3,
    TIERS: [ [ .55, "full" ], [ .85, "half" ], [ 1, "faint" ] ],
    ENV: {
      full: {
        I: 1,
        bloom: 12,
        decay: 24
      },
      half: {
        I: .55,
        bloom: 12,
        decay: 24
      },
      faint: {
        I: .22,
        bloom: 10,
        decay: 24
      }
    },
    SWEEP: [ 44, 24 ]
  };
  function envKeyframes() {
    var out = [], t;
    for (t in GILD.ENV) {
      var e = GILD.ENV[t], a = e.bloom / (e.bloom + e.decay) * 100;
      out.push("@keyframes gild-" + t + "{0%{opacity:0;animation-timing-function:cubic-bezier(.3,0,.6,1)}" + a.toFixed(4) + "%{opacity:" + e.I + ";animation-timing-function:cubic-bezier(.2,.4,.4,1)}" + "100%{opacity:0}}");
    }
    return out.join("\n");
  }
  function leafRun() {
    var lit = 0, plain = 0;
    return function(p) {
      var v = lit >= 2 ? false : plain >= 3 ? true : rng() < p;
      if (v) {
        lit++;
        plain = 0;
      } else {
        plain++;
        lit = 0;
      }
      return v;
    };
  }
  function wrapX(d, x) {
    return d.lo + ((x - d.lo) % d.L + d.L) % d.L;
  }
  function scheduler(data, openSet, live) {
    var cap = GILD.CAP;
    var hero = leafRun(), dark = 0, n = 0;
    return function next() {
      var R = river.getBoundingClientRect();
      var cx = (R.left + R.right) / 2;
      var pool = [], best = null, lit = [], i, k, uPx = 0;
      for (i = 0; i < LANES.length; i++) {
        k = LANES[i];
        var d = data[k];
        if (!d) continue;
        for (var j = 0; j < d.cards.length; j++) {
          var c = d.cards[j];
          for (var cp = 0; cp < d.copies; cp++) {
            var fig = c.figs && c.figs[cp];
            if (!fig || fig.classList.contains("is-leaf")) continue;
            var r = fig.getBoundingClientRect();
            if (!uPx) uPx = r.width / c.w;
            if (r.left < R.left || r.right > R.right) continue;
            var dist = Math.abs((r.left + r.right) / 2 - cx) / uPx;
            var e = {
              lane: k,
              idx: j,
              copy: cp,
              name: c.name,
              x: (r.left - R.left) / uPx,
              dist: dist,
              p: GILD.P[k],
              hero: false
            };
            pool.push(e);
            if (k === "near" && dist <= GILD.HERO_WIN && (!best || dist < best.dist)) best = e;
          }
        }
      }
      if (best) {
        best.hero = true;
        best.p = GILD.P.hero;
      }
      pool.sort((function(a, b) {
        if (a.hero !== b.hero) return a.hero ? -1 : 1;
        return a.dist - b.dist;
      }));
      if (n === 0 && openSet) {
        openSet.forEach((function(want) {
          for (var q = 0; q < pool.length; q++) {
            if (pool[q].name === want[0] && pool[q].lane === want[1] && pool[q].copy === want[2]) {
              lit.push({
                lane: pool[q].lane,
                idx: pool[q].idx,
                copy: pool[q].copy,
                name: pool[q].name,
                tier: want[3]
              });
              break;
            }
          }
        }));
        hero(1);
      } else {
        pool.forEach((function(e) {
          if (lit.length + live() >= cap) return;
          if (e.hero ? !hero(e.p) : !(rng() < e.p)) return;
          var r = rng(), t = "faint", q;
          for (q = 0; q < GILD.TIERS.length; q++) {
            if (r < GILD.TIERS[q][0]) {
              t = GILD.TIERS[q][1];
              break;
            }
          }
          lit.push({
            lane: e.lane,
            idx: e.idx,
            copy: e.copy,
            name: e.name,
            tier: t
          });
        }));
        if (!lit.length && !live() && dark >= 1 && pool.length) {
          lit.push({
            lane: pool[0].lane,
            idx: pool[0].idx,
            copy: pool[0].copy,
            name: pool[0].name,
            tier: "half"
          });
        }
      }
      dark = lit.length ? 0 : dark + 1;
      return {
        n: n++,
        lit: lit,
        pool: pool.length
      };
    };
  }
  var gildTimer = null, alive = [];
  function gild(data, openSet) {
    var next = scheduler(data, openSet, (function() {
      return alive.length;
    }));
    var T0 = (window.performance && performance.now ? performance.now() : Date.now()) / 1e3;
    var log = [];
    window.RIVER_GILD = {
      log: log,
      GILD: GILD,
      draw: next,
      T0: T0
    };
    if (gildTimer) {
      clearTimeout(gildTimer);
      gildTimer = null;
    }
    alive = [];
    if (reduce.matches) {
      var old = river.querySelectorAll(".gild"), q;
      for (q = 0; q < old.length; q++) {
        old[q].parentNode.classList.remove("is-leaf");
        old[q].remove();
      }
    }
    function fire(step) {
      var now = (window.performance && performance.now ? performance.now() : Date.now()) / 1e3 - T0;
      step.lit.forEach((function(e) {
        var d = data[e.lane], c = d && d.cards[e.idx];
        var fig = c && c.figs && c.figs[e.copy];
        if (!fig) return;
        var env = GILD.ENV[e.tier], life = env.bloom + env.decay;
        var bloom = step.n === 0 ? -env.bloom : now;
        var g = document.createElement("span");
        g.className = "gild";
        var wedge = document.createElement("i");
        var dur, dir, ph, tries = 0;
        do {
          dur = GILD.SWEEP[0] + GILD.SWEEP[1] * rng();
          dir = rng() < .5 ? 1 : -1;
          ph = rng() * dur;
          tries++;
        } while (tries < 40 && alive.some((function(a) {
          if (a.dir !== dir || Math.abs(a.dur - dur) >= .5) return false;
          var o = ((a.ph - ph) % dur + dur) % dur;
          return Math.min(o, dur - o) < .5;
        })));
        var mine = {
          dur: dur,
          dir: dir,
          ph: ph,
          tier: e.tier,
          draw: step.n,
          name: e.name,
          lane: e.lane,
          I: env.I
        };
        alive.push(mine);
        log.push(mine);
        g.appendChild(wedge);
        fig.classList.add("is-leaf");
        fig.insertBefore(g, fig.firstChild);
        if (reduce.matches) {
          g.style.transition = "opacity 400ms ease-out";
          void g.offsetWidth;
          g.style.opacity = env.I;
          return;
        }
        wedge.style.animationName = dir > 0 ? "gild-sweep-cw" : "gild-sweep-ccw";
        wedge.style.animationDuration = dur.toFixed(2) + "s";
        wedge.style.animationIterationCount = "infinite";
        wedge.style.animationTimingFunction = "linear";
        wedge.style.animationDelay = (-ph).toFixed(2) + "s";
        g.style.animationName = "gild-" + e.tier;
        g.style.animationDuration = life + "s";
        g.style.animationFillMode = "both";
        g.style.animationDelay = (bloom - now).toFixed(3) + "s";
        g.addEventListener("animationend", (function(ev) {
          if (ev.target !== g) return;
          g.remove();
          fig.classList.remove("is-leaf");
          var at = alive.indexOf(mine);
          if (at >= 0) alive.splice(at, 1);
        }));
      }));
    }
    fire(next());
    if (reduce.matches) return;
    (function arm() {
      gildTimer = setTimeout((function() {
        fire(next());
        arm();
      }), (GILD.EVERY[0] + GILD.EVERY[1] * rng()) * 1e3);
    })();
  }
  function img(c, first) {
    var el = document.createElement("img");
    var widths = c.widths.slice().sort((function(a, b) {
      return a - b;
    }));
    el.src = "assets/img/" + c.name + "-" + widths[widths.length - 1] + ".webp";
    el.srcset = widths.map((function(w) {
      return "assets/img/" + c.name + "-" + w + ".webp " + w + "w";
    })).join(", ");
    el.sizes = "(max-width: 599px) 46vw, (max-width: 899px) 30vw, (max-width: 1199px) 24vw, 22vw";
    el.width = Math.round(c.w);
    el.height = Math.round(c.h);
    el.alt = first && c.speaks ? c.alt : "";
    el.decoding = "async";
    el.loading = first && c.eager ? "eager" : "lazy";
    return el;
  }
  var data = null, fields = {}, U = 1, vis = null, clock = 0, lastNow = 0, raf = 0, inView = false;
  var dragPx = 0, drag = null, inertia = 0, lastRaw = {}, carried = {};
  var DRIFT = [ 725, 1075, 1675 ];
  function measure() {
    var r = river.getBoundingClientRect(), k, d, need = 0;
    U = r.height / STAGE_H;
    var w = r.width / U;
    vis = {
      l: STAGE_W / 2 - w / 2,
      r: STAGE_W / 2 + w / 2
    };
    for (k in data) {
      d = data[k];
      d.breath = breath(d.L, P.px[k] / U);
      d.v = d.breath.v;
      d.ratio = P.px[k] / P.px.near;
      d.lo = Math.min(d.phase, vis.l) - d.L;
      need = Math.max(need, Math.ceil((vis.r - d.lo + 200) / d.L) - (d.copies || 1e9));
    }
    return need > 0;
  }
  function openSet() {
    var cand = [], open = [];
    BUILT.forEach((function(k) {
      var d = data[k];
      if (!d) return;
      var base = reduce.matches ? d.x : wrapX(d, d.phase - d.L);
      d.cards.forEach((function(c) {
        if (!c.featured) return;
        for (var cp = 0; cp < d.copies; cp++) {
          var x = c.x0 + cp * d.L + base;
          if (x < Math.max(0, vis.l) || x + c.w > Math.min(STAGE_W, vis.r)) continue;
          cand.push({
            name: c.name,
            lane: k,
            copy: cp,
            rank: BUILT.indexOf(k),
            dist: Math.abs(x + c.w / 2 - STAGE_W / 2)
          });
        }
      }));
    }));
    cand.sort((function(a, b) {
      return a.rank - b.rank || a.dist - b.dist;
    }));
    if (reduce.matches && cand.length) {
      var hi = 0;
      cand.forEach((function(e, i) {
        if (e.dist < cand[hi].dist || e.dist === cand[hi].dist && e.rank < cand[hi].rank) hi = i;
      }));
      cand.unshift(cand.splice(hi, 1)[0]);
    }
    [ "full", "half", "faint" ].slice(0, GILD.CAP).forEach((function(t, i) {
      if (cand[i]) open.push([ cand[i].name, cand[i].lane, cand[i].copy, t ]);
    }));
    return open;
  }
  function render(dt) {
    var still = reduce.matches, speed = {}, i, j, cp, k, d, c, fig, raw, vel, x, s, f, sx, tm = still ? 0 : P.tmax;
    for (i = 0; i < BUILT.length; i++) {
      k = BUILT[i];
      d = data[k];
      if (!d) continue;
      raw = d.phase - d.L + (still ? 0 : posAt(d, clock + d.breath.rest + BREATH.EASE + 1)) + dragPx / U * d.ratio;
      vel = lastRaw[k] === undefined ? 0 : (raw - lastRaw[k]) / dt;
      lastRaw[k] = raw;
      speed[k] = Math.abs(vel) * U;
      if (!still) carried[k] = (carried[k] || 0) + Math.abs(vel) * dt;
      s = carried[k] || 0;
      x = wrapX(d, raw);
      d.x = x;
      d.el.style.transform = "translate3d(" + (x * U).toFixed(2) + "px,0,0)";
      f = fields[k];
      for (j = 0; j < d.cards.length; j++) {
        c = d.cards[j];
        for (cp = 0; cp < d.copies; cp++) {
          fig = c.figs[cp];
          sx = c.x0 + cp * d.L + x + c.w / 2;
          if (sx + 1.5 * c.w < vis.l || sx - 1.5 * c.w > vis.r) {
            if (fig.bent) {
              fig.style.transform = "";
              fig.bent = 0;
            }
            continue;
          }
          var deg = 0;
          if (tm) {
            deg = Math.max(-tm, Math.min(tm, leafStep(fig, c, s, Math.min(.05, dt), f(sx, s, 1), f(sx, s, 2), vel)));
            fig.th = deg;
          }
          fig.style.transform = "translateY(" + (f(sx, s) * U).toFixed(2) + "px) rotate(" + deg.toFixed(3) + "deg)";
          fig.bent = 1;
        }
      }
    }
    window.RIVER_SPEED = speed;
  }
  function live() {
    return inView && !document.hidden && (!reduce.matches || !!drag && drag.on || !!inertia);
  }
  function tick(now) {
    now /= 1e3;
    var dt = lastNow ? Math.min(1, Math.max(.001, now - lastNow)) : 1 / 60;
    lastNow = now;
    if (inertia) {
      dragPx += inertia * .35 * (1 - Math.exp(-dt / .35));
      inertia *= Math.exp(-dt / .35);
      if (Math.abs(inertia) < 2) {
        inertia = 0;
        if (reduce.matches) gild(data, openSet());
      }
    } else if (!(drag && drag.on) && !reduce.matches) clock += dt;
    render(dt);
    raf = live() ? requestAnimationFrame(tick) : 0;
    if (!raf) lastNow = 0;
  }
  function kick() {
    if (raf && !live()) {
      cancelAnimationFrame(raf);
      raf = 0;
      lastNow = 0;
    } else if (data && !raf && live()) raf = requestAnimationFrame(tick);
  }
  function build() {
    setBand(bandOf());
    var r0 = river.getBoundingClientRect();
    U = r0.height / STAGE_H;
    BUILT.forEach((function(k) {
      V[k] = P.px[k] / U;
    }));
    data = layout();
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    lastNow = 0;
    clock = 0;
    dragPx = 0;
    drag = null;
    inertia = 0;
    lastRaw = {};
    carried = {};
    measure();
    var old = river.querySelectorAll(".lane");
    var i;
    for (i = 0; i < old.length; i++) old[i].remove();
    river.setAttribute("data-band", band);
    var veilL = river.querySelector(".veil--l");
    var made = [];
    var sheet = document.getElementById("river-gild");
    if (!sheet) {
      sheet = document.createElement("style");
      sheet.id = "river-gild";
      document.head.appendChild(sheet);
    }
    sheet.textContent = envKeyframes();
    BUILT.forEach((function(k) {
      var d = data[k];
      if (!d) return;
      d.copies = Math.ceil((vis.r - d.lo + 200) / d.L);
      var lane = document.createElement("div");
      lane.className = "lane lane--" + k + " is-enter";
      lane.style.setProperty("--L", d.L);
      d.el = lane;
      for (var copy = 0; copy < d.copies; copy++) {
        var strip = document.createElement("div");
        strip.className = "strip";
        strip.style.setProperty("--k", copy);
        if (copy > 0) strip.setAttribute("aria-hidden", "true");
        d.cards.forEach((function(c) {
          if (copy === 0) c.figs = [];
          var fig = document.createElement("figure");
          fig.className = "card";
          fig.style.setProperty("--x", c.x0);
          fig.style.setProperty("--y", c.y);
          fig.style.setProperty("--w", c.w);
          fig.style.setProperty("--h", c.h);
          fig.appendChild(img(c, copy === 0));
          c.figs[copy] = fig;
          strip.appendChild(fig);
        }));
        lane.appendChild(strip);
      }
      river.insertBefore(lane, veilL);
      made.push(lane);
    }));
    window.RIVER_LAYOUT = data;
    fields = {};
    for (var k in data) fields[k] = bendField(k, BEND.BASE, DRIFT);
    render(1 / 60);
    requestAnimationFrame((function() {
      made.forEach((function(lane, idx) {
        var delay = reduce.matches ? 0 : idx * 150;
        setTimeout((function() {
          lane.classList.remove("is-enter");
        }), delay);
      }));
    }));
    gild(data, openSet());
    kick();
  }
  function onDown(e) {
    if (e.pointerType === "mouse" || drag || !data) return;
    drag = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      base: dragPx,
      on: false,
      hist: []
    };
  }
  function onMove(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.on) {
      if (dx * dx + dy * dy < 64) return;
      if (Math.abs(dx) <= Math.abs(dy)) {
        drag = null;
        return;
      }
      drag.on = true;
      inertia = 0;
      if (river.setPointerCapture) {
        try {
          river.setPointerCapture(e.pointerId);
        } catch (err) {}
      }
      kick();
    }
    e.preventDefault();
    dragPx = drag.base + dx;
    drag.hist.push([ e.timeStamp, e.clientX ]);
    while (drag.hist.length > 2 && e.timeStamp - drag.hist[0][0] > 80) drag.hist.shift();
  }
  function onUp(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var h = drag.hist, was = drag.on;
    drag = null;
    if (!was) return;
    var dt = h.length > 1 ? h[h.length - 1][0] - h[0][0] : 0;
    inertia = e.type === "pointerup" && !reduce.matches && dt > 0 ? (h[h.length - 1][1] - h[0][1]) / dt * 1e3 : 0;
    if (Math.abs(inertia) < 2) inertia = 0;
    if (!inertia && reduce.matches) {
      render(1 / 60);
      gild(data, openSet());
    }
    kick();
  }
  river.addEventListener("pointerdown", onDown);
  river.addEventListener("pointermove", onMove);
  river.addEventListener("pointerup", onUp);
  river.addEventListener("pointercancel", onUp);
  if (window.IntersectionObserver) {
    var io = new IntersectionObserver((function(es) {
      for (var i = 0; i < es.length; i++) if (es[i].isIntersecting) {
        io.disconnect();
        if (!data) build();
        return;
      }
    }), {
      rootMargin: "300px 0px"
    });
    io.observe(river);
    new IntersectionObserver((function(es) {
      inView = es[es.length - 1].isIntersecting;
      kick();
    }), {
      rootMargin: "0px"
    }).observe(river);
  } else {
    inView = true;
    build();
  }
  document.addEventListener("visibilitychange", kick);
  var resizeT = 0;
  function onResize() {
    clearTimeout(resizeT);
    resizeT = setTimeout((function() {
      if (!data) return;
      if (bandOf() !== band || measure()) return build();
      render(1 / 60);
      kick();
    }), 200);
  }
  window.addEventListener("resize", onResize);
  if (reduce.addEventListener) reduce.addEventListener("change", (function() {
    if (data) build();
  }));
})();
