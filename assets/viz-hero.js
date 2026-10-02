/* ==========================================================================
   CFA Level II Quantitative Methods — Hero Visualizer (viz-hero.js)
   quantsArenaHero: Multi-Factor Econometric & Machine Learning Quant Studio
   ========================================================================== */

(function () {
  'use strict';

  OS.register('quantsArenaHero', function (host) {
    let violation = 'none'; // 'none' | 'hetero' | 'serial' | 'multi'
    let estimator = 'ols';  // 'ols' | 'white' | 'newey' | 'ridge' | 'lasso'
    let sampleSize = 60;    // months
    let noiseLevel = 1.2;
    let seed = 42;

    function pseudoRandom() {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    }
    function gaussian() {
      let u = 0, v = 0;
      while (u === 0) u = pseudoRandom();
      while (v === 0) v = pseudoRandom();
      return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }

    // Generate multi-factor market data
    function generateData() {
      seed = 42;
      const data = [];
      let prevErr = 0;
      for (let t = 0; t < sampleSize; t++) {
        let mkt = gaussian() * 1.5 + 0.8; // MKT excess return
        let smb = gaussian() * 1.0;       // Size factor
        let hml = gaussian() * 1.0;       // Value factor

        if (violation === 'multi') {
          // Induce severe collinearity between SMB and HML (r > 0.92)
          hml = 0.92 * smb + gaussian() * 0.25;
        }

        // True parameters: Alpha = 0.2%, Beta_MKT = 1.1, Beta_SMB = 0.5, Beta_HML = -0.3
        let rawErr = gaussian() * noiseLevel;

        if (violation === 'hetero') {
          // Conditional heteroskedasticity: error variance scales with market return magnitude
          rawErr = rawErr * (0.3 + 0.8 * Math.abs(mkt));
        } else if (violation === 'serial') {
          // First-order positive serial correlation: rho = 0.75
          rawErr = 0.75 * prevErr + rawErr * 0.65;
          prevErr = rawErr;
        }

        const y = 0.2 + 1.1 * mkt + 0.5 * smb - 0.3 * hml + rawErr;
        data.push({ t, mkt, smb, hml, y, err: rawErr });
      }
      return data;
    }

    // Compute regression estimates and diagnostics
    function computeStats(data) {
      const n = data.length;
      let sumY = 0, sumMkt = 0;
      data.forEach(d => { sumY += d.y; sumMkt += d.mkt; });
      const meanY = sumY / n;
      const meanMkt = sumMkt / n;

      let sxx = 0, sxy = 0, sst = 0;
      data.forEach(d => {
        sxx += (d.mkt - meanMkt) * (d.mkt - meanMkt);
        sxy += (d.mkt - meanMkt) * (d.y - meanY);
        sst += (d.y - meanY) * (d.y - meanY);
      });

      let b1 = sxx !== 0 ? sxy / sxx : 1.1;
      let b0 = meanY - b1 * meanMkt;

      if (estimator === 'ridge') {
        b1 = b1 * 0.82; // L2 shrinkage
        b0 = meanY - b1 * meanMkt;
      } else if (estimator === 'lasso') {
        b1 = Math.max(0, Math.abs(b1) - 0.25) * Math.sign(b1); // L1 thresholding
        b0 = meanY - b1 * meanMkt;
      }

      let sse = 0, ssr = 0;
      let prevResid = 0;
      let diffSqSum = 0;
      const resids = [];

      data.forEach((d, i) => {
        const yHat = b0 + b1 * d.mkt;
        const e = d.y - yHat;
        resids.push(e);
        sse += e * e;
        ssr += (yHat - meanY) * (yHat - meanY);
        if (i > 0) {
          const diff = e - prevResid;
          diffSqSum += diff * diff;
        }
        prevResid = e;
      });

      const k = 1; // 1 regressor shown in visual line
      const r2 = sst > 0 ? Math.max(0, Math.min(0.999, 1 - sse / sst)) : 0;
      const adjR2 = Math.max(0, 1 - ((1 - r2) * (n - 1)) / (n - k - 1));
      const mse = n > 2 ? sse / (n - 2) : 0.01;
      const see = Math.sqrt(mse);
      const seB1Standard = Math.sqrt(mse / Math.max(sxx, 0.001));

      // White robust standard error adjustment
      let whiteSum = 0;
      data.forEach((d, i) => {
        const dev = d.mkt - meanMkt;
        whiteSum += dev * dev * resids[i] * resids[i];
      });
      const seB1White = Math.sqrt(whiteSum) / Math.max(sxx, 0.001);

      // Newey-West adjustment (lag 1)
      let nwSum = whiteSum;
      for (let i = 1; i < n; i++) {
        const dev1 = data[i].mkt - meanMkt;
        const dev0 = data[i - 1].mkt - meanMkt;
        nwSum += (2 * (1 - 1 / 3)) * dev1 * dev0 * resids[i] * resids[i - 1];
      }
      const seB1Newey = Math.sqrt(Math.max(0.0001, nwSum)) / Math.max(sxx, 0.001);

      let effectiveSeB1 = seB1Standard;
      if (estimator === 'white') effectiveSeB1 = seB1White;
      else if (estimator === 'newey') effectiveSeB1 = seB1Newey;

      const tStatB1 = effectiveSeB1 > 0 ? b1 / effectiveSeB1 : 0;
      const dw = sse > 0 ? diffSqSum / sse : 2.0;

      // Breusch-Pagan chi-square stat proxy
      let bpR2 = 0;
      let eSqSum = 0, meanESq = 0;
      resids.forEach(e => { eSqSum += e * e; });
      meanESq = eSqSum / n;
      let bpSxx = 0, bpSxy = 0;
      data.forEach((d, i) => {
        const esq = resids[i] * resids[i];
        bpSxy += (d.mkt - meanMkt) * (esq - meanESq);
        bpSxx += (d.mkt - meanMkt) * (d.mkt - meanMkt);
      });
      const bpSlope = bpSxx > 0 ? bpSxy / bpSxx : 0;
      let bpSsr = 0, bpSst = 0;
      data.forEach((d, i) => {
        const yhat = meanESq + bpSlope * (d.mkt - meanMkt);
        bpSsr += (yhat - meanESq) * (yhat - meanESq);
        bpSst += (resids[i] * resids[i] - meanESq) * (resids[i] * resids[i] - meanESq);
      });
      bpR2 = bpSst > 0 ? bpSsr / bpSst : 0;
      const bpChi2 = n * bpR2;

      // F-stat
      const msr = ssr / 1;
      const fStat = mse > 0 ? msr / mse : 0;

      return {
        b0, b1, r2, adjR2, see, seB1Standard, seB1White, seB1Newey,
        effectiveSeB1, tStatB1, dw, bpChi2, fStat, resids
      };
    }

    const controls = OS.controls(host);

    OS.segmented(controls, {
      label: 'Econometric Violation',
      options: [
        { label: 'None (BLUE)', value: 'none' },
        { label: 'Heteroskedastic ⚡', value: 'hetero' },
        { label: 'Serial Corr 📈', value: 'serial' },
        { label: 'Multicollinear 👥', value: 'multi' }
      ],
      value: violation,
      onChange: (v) => { violation = v; render(); }
    });

    OS.segmented(controls, {
      label: 'Model Estimator',
      options: [
        { label: 'Standard OLS', value: 'ols' },
        { label: 'White Robust SE', value: 'white' },
        { label: 'Newey-West SE', value: 'newey' },
        { label: 'Ridge (L2)', value: 'ridge' },
        { label: 'Lasso (L1)', value: 'lasso' }
      ],
      value: estimator,
      onChange: (v) => { estimator = v; render(); }
    });

    OS.slider(controls, {
      label: 'Sample Size (Months T)',
      min: 30, max: 120, step: 10, value: sampleSize,
      onChange: (v) => { sampleSize = v; render(); }
    });

    OS.slider(controls, {
      label: 'Error Noise Volatility (σ)',
      min: 0.5, max: 3.0, step: 0.25, value: noiseLevel,
      onChange: (v) => { noiseLevel = v; render(); }
    });

    OS.button(controls, 'Reshuffle Epoch 🎲', () => {
      seed = Math.floor(Math.random() * 10000);
      render();
    }, { primary: true });

    const cv = OS.canvas(host, {
      height: 280,
      label: 'Flagship Multi-Factor Econometric Studio Canvas',
      draw: (ctx, w, h) => {
        const data = generateData();
        const stats = computeStats(data);

        // Dark/Light theme colors
        ctx.fillStyle = OS.C.surface;
        ctx.fillRect(0, 0, w, h);

        const margin = { top: 30, right: 280, bottom: 40, left: 45 };
        const plotW = Math.max(100, w - margin.left - margin.right);
        const plotH = Math.max(100, h - margin.top - margin.bottom);

        // Find data bounds for scatter / regression plot
        let minX = -3, maxX = 4.5;
        let minY = -4, maxY = 6;
        data.forEach(d => {
          if (d.mkt < minX) minX = d.mkt;
          if (d.mkt > maxX) maxX = d.mkt;
          if (d.y < minY) minY = d.y;
          if (d.y > maxY) maxY = d.y;
        });

        const scaleX = (x) => margin.left + ((x - minX) / (maxX - minX)) * plotW;
        const scaleY = (y) => margin.top + plotH - ((y - minY) / (maxY - minY)) * plotH;

        // Draw Plot Grid & Axes
        ctx.strokeStyle = OS.C.line;
        ctx.lineWidth = 1;
        ctx.strokeRect(margin.left, margin.top, plotW, plotH);

        // Zero lines
        if (minX <= 0 && maxX >= 0) {
          ctx.beginPath();
          ctx.moveTo(scaleX(0), margin.top);
          ctx.lineTo(scaleX(0), margin.top + plotH);
          ctx.strokeStyle = OS.rgba(OS.C.muted, 0.35);
          ctx.stroke();
        }
        if (minY <= 0 && maxY >= 0) {
          ctx.beginPath();
          ctx.moveTo(margin.left, scaleY(0));
          ctx.lineTo(margin.left + plotW, scaleY(0));
          ctx.strokeStyle = OS.rgba(OS.C.muted, 0.35);
          ctx.stroke();
        }

        // Draw Residual Stems & Data Points
        data.forEach(d => {
          const px = scaleX(d.mkt);
          const py = scaleY(d.y);
          const pYHat = scaleY(stats.b0 + stats.b1 * d.mkt);

          // Residual line
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px, pYHat);
          ctx.strokeStyle = violation === 'hetero' ? OS.rgba(OS.C.amber, 0.45) :
                            violation === 'serial' ? OS.rgba(OS.C.red, 0.45) :
                            OS.rgba(OS.C.muted, 0.3);
          ctx.lineWidth = 1.2;
          ctx.stroke();

          // Data point circle
          ctx.beginPath();
          ctx.arc(px, py, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = violation === 'multi' ? OS.C.purple : OS.C.accent;
          ctx.fill();
        });

        // Fitted Regression Line
        ctx.beginPath();
        const lineX1 = minX;
        const lineY1 = stats.b0 + stats.b1 * lineX1;
        const lineX2 = maxX;
        const lineY2 = stats.b0 + stats.b1 * lineX2;
        ctx.moveTo(scaleX(lineX1), scaleY(lineY1));
        ctx.lineTo(scaleX(lineX2), scaleY(lineY2));
        ctx.strokeStyle = estimator === 'ridge' ? OS.C.teal :
                          estimator === 'lasso' ? OS.C.amber :
                          OS.C.ink;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Regression line label
        ctx.font = OS.font(10, 'mono', 600);
        ctx.fillStyle = OS.C.ink;
        ctx.fillText(`Ŷ = ${stats.b0.toFixed(2)} + ${stats.b1.toFixed(2)}·X`, margin.left + 8, margin.top + 16);

        // Axis Titles
        ctx.font = OS.font(10, 'mono', 500);
        ctx.fillStyle = OS.C.muted;
        ctx.fillText('Market Factor Excess Return (Rm - Rf %)', margin.left + plotW / 2 - 90, h - 10);
        ctx.save();
        ctx.translate(14, margin.top + plotH / 2 + 30);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Asset Return (Ri - Rf %)', 0, 0);
        ctx.restore();

        // -------------------------------------------------------------
        // Right Side: Live Econometric Diagnostic HUD
        // -------------------------------------------------------------
        const hudX = margin.left + plotW + 16;
        const hudW = margin.right - 26;

        ctx.fillStyle = OS.C.sunk;
        ctx.strokeStyle = OS.C.line;
        ctx.lineWidth = 1;
        ctx.roundRect(hudX, margin.top, hudW, plotH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = OS.C.accent;
        ctx.font = OS.font(11, 'mono', 700);
        ctx.fillText('ECONOMETRIC DIAGNOSTICS', hudX + 12, margin.top + 20);

        ctx.font = OS.font(10, 'mono', 500);
        ctx.fillStyle = OS.C.ink;

        const metrics = [
          { label: 'R² (Fit)', val: `${(stats.r2 * 100).toFixed(1)}%` },
          { label: 'Adjusted R²', val: `${(stats.adjR2 * 100).toFixed(1)}%` },
          { label: 'Std Error (SEE)', val: stats.see.toFixed(3) },
          { label: 'Slope b₁', val: stats.b1.toFixed(3) },
          { label: 'Std Error (s_b1)', val: stats.effectiveSeB1.toFixed(3),
            warn: estimator === 'ols' && (violation === 'hetero' || violation === 'serial') ? '⚠️ Biased' : '✅ Valid' },
          { label: 't-Statistic', val: stats.tStatB1.toFixed(2) },
          { label: 'Durbin-Watson', val: stats.dw.toFixed(2),
            warn: stats.dw < 1.3 ? '🚨 Serial Corr' : (stats.dw > 1.7 && stats.dw < 2.3 ? '✅ Clean' : '⚠️ Skewed') },
          { label: 'Breusch-Pagan χ²', val: stats.bpChi2.toFixed(1),
            warn: stats.bpChi2 > 3.84 ? '🚨 Hetero!' : '✅ Homosked' }
        ];

        metrics.forEach((m, idx) => {
          const my = margin.top + 42 + idx * 20;
          ctx.fillStyle = OS.C.muted;
          ctx.fillText(m.label + ':', hudX + 12, my);
          ctx.fillStyle = OS.C.ink;
          ctx.fillText(m.val, hudX + 130, my);
          if (m.warn) {
            ctx.font = OS.font(9, 'mono', 600);
            ctx.fillStyle = m.warn.includes('🚨') ? OS.C.red : (m.warn.includes('⚠️') ? OS.C.amber : OS.C.teal);
            ctx.fillText(m.warn, hudX + 185, my);
            ctx.font = OS.font(10, 'mono', 500);
          }
        });
      }
    });

    const readout = OS.readout(host);

    function render() {
      cv.redraw();
      let msg = '';
      if (violation === 'none') {
        msg = `<b>Gauss-Markov BLUE Benchmark:</b> Zero violations present. OLS standard errors are minimum variance among all linear unbiased estimators. $DW \\approx 2.0$, residuals homoskedastic.`;
      } else if (violation === 'hetero') {
        msg = `<b>Heteroskedasticity Active:</b> Error variance expands with factor magnitude. <i>OLS coefficients remain unbiased</i>, but standard errors $s_{b}$ are <b>understated</b>, inflating $t$-statistics and $F$-tests. ${estimator === 'white' ? '<span style="color:var(--teal)">✅ White Robust standard errors active: inference restored.</span>' : '<span style="color:var(--amber)">⚠️ Switch estimator to "White Robust SE" to correct!</span>'}`;
      } else if (violation === 'serial') {
        msg = `<b>Serial Correlation Active:</b> Positive autocorrelation ($\\rho = 0.75$). $DW < 1.4$. Standard errors are severely understated, leading to spurious Type I errors. ${estimator === 'newey' ? '<span style="color:var(--teal)">✅ Newey-West standard errors active: robust to both serial correlation and heteroskedasticity.</span>' : '<span style="color:var(--red)">🚨 Switch estimator to "Newey-West SE" to correct!</span>'}`;
      } else if (violation === 'multi') {
        msg = `<b>Multicollinearity Active:</b> Regressors SMB and HML are highly collinear ($r > 0.92$). Overall $R^2$ is high and $F$ is significant, but individual factor standard errors inflate and $t$-statistics collapse. ${estimator === 'ridge' ? '<span style="color:var(--teal)">✅ Ridge L2 regularization shrinks coefficients and stabilizes covariance matrix.</span>' : (estimator === 'lasso' ? '<span style="color:var(--teal)">✅ Lasso L1 regularization forces redundant factor to zero.</span>' : '<span style="color:var(--purple)">💡 Try Ridge or Lasso estimators to stabilize parameters!</span>')}`;
      }
      readout.innerHTML = `<b>Studio Monitor:</b> ${msg}`;
    }

    render();
  });

})();
