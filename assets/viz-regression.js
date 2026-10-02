/* ==========================================================================
   CFA Level II Quantitative Methods — Part I: Multiple Regression (viz-regression.js)
   Simulators:
   1. olsRegression
   2. hypothesisTesting
   3. anovaDecomposition
   4. fDistributionTest
   5. forecastIntervals
   ========================================================================== */

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. olsRegression (Chapter 01)
  // --------------------------------------------------------------------------
  OS.register('olsRegression', function (host) {
    let beta1 = 1.2;
    let beta2 = 0.8;
    let noise = 1.0;
    let showResiduals = true;

    const controls = OS.controls(host);
    OS.slider(controls, {
      label: 'Slope Beta 1 (Market Beta)',
      min: -0.5, max: 2.5, step: 0.1, value: beta1,
      onChange: (v) => { beta1 = v; render(); }
    });
    OS.slider(controls, {
      label: 'Slope Beta 2 (Size Beta)',
      min: -1.0, max: 1.5, step: 0.1, value: beta2,
      onChange: (v) => { beta2 = v; render(); }
    });
    OS.slider(controls, {
      label: 'Disturbance Noise (σ)',
      min: 0.2, max: 2.5, step: 0.1, value: noise,
      onChange: (v) => { noise = v; render(); }
    });
    OS.button(controls, 'Toggle Residual Stems', () => {
      showResiduals = !showResiduals;
      render();
    });

    const cv = OS.canvas(host, {
      height: 240,
      label: 'Multiple Linear Regression Projection Stage',
      draw: (ctx, w, h) => {
        ctx.fillStyle = OS.C.surface;
        ctx.fillRect(0, 0, w, h);

        const pad = { top: 25, right: 30, bottom: 35, left: 50 };
        const pw = Math.max(80, w - pad.left - pad.right);
        const ph = Math.max(80, h - pad.top - pad.bottom);

        // Fixed synthetic points
        const points = [
          { x1: -1.5, x2: 0.2, u: 0.4 },
          { x1: -1.0, x2: -0.8, u: -0.6 },
          { x1: -0.5, x2: 0.5, u: 0.2 },
          { x1: 0.0, x2: -0.2, u: -0.1 },
          { x1: 0.4, x2: 1.1, u: 0.8 },
          { x1: 0.8, x2: -0.4, u: -0.5 },
          { x1: 1.2, x2: 0.6, u: 0.3 },
          { x1: 1.6, x2: -0.1, u: -0.4 },
          { x1: 2.0, x2: 0.9, u: 0.7 }
        ];

        const scaleX = (x) => pad.left + ((x + 2) / 4.5) * pw;
        const scaleY = (y) => pad.top + ph - ((y + 3) / 7.5) * ph;

        // Axes
        ctx.strokeStyle = OS.C.line;
        ctx.lineWidth = 1;
        ctx.strokeRect(pad.left, pad.top, pw, ph);

        // Ground zero line
        ctx.strokeStyle = OS.rgba(OS.C.muted, 0.3);
        ctx.beginPath();
        ctx.moveTo(pad.left, scaleY(0));
        ctx.lineTo(pad.left + pw, scaleY(0));
        ctx.stroke();

        // Regression plane projected onto X1 axis
        ctx.beginPath();
        const yHatL = beta1 * (-2.0) + beta2 * 0.2;
        const yHatR = beta1 * (2.5) + beta2 * 0.2;
        ctx.moveTo(scaleX(-2.0), scaleY(yHatL));
        ctx.lineTo(scaleX(2.5), scaleY(yHatR));
        ctx.strokeStyle = OS.C.accent;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        let sse = 0;
        points.forEach(pt => {
          const actualY = beta1 * pt.x1 + beta2 * pt.x2 + pt.u * noise;
          const predY = beta1 * pt.x1 + beta2 * pt.x2;
          const e = actualY - predY;
          sse += e * e;

          const px = scaleX(pt.x1);
          const py = scaleY(actualY);
          const pPred = scaleY(predY);

          if (showResiduals) {
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px, pPred);
            ctx.strokeStyle = OS.rgba(OS.C.red, 0.6);
            ctx.lineWidth = 1.5;
            ctx.setLineDash([3, 3]);
            ctx.stroke();
            ctx.setLineDash([]);
          }

          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fillStyle = OS.C.ink;
          ctx.fill();
        });

        // Labels
        ctx.font = OS.font(11, 'mono', 600);
        ctx.fillStyle = OS.C.accent;
        ctx.fillText(`Ŷ = ${beta1.toFixed(1)}·X₁ + ${beta2.toFixed(1)}·X₂`, pad.left + 10, pad.top + 20);

        ctx.fillStyle = OS.C.muted;
        ctx.font = OS.font(10, 'mono', 400);
        ctx.fillText(`Sum of Squared Errors (SSE): ${sse.toFixed(2)}`, pad.left + 10, pad.top + 36);
        ctx.fillText('Regressor X₁ (Holding X₂ constant at 0.2)', pad.left + pw / 2 - 90, h - 10);
      }
    });

    const readout = OS.readout(host);
    function render() {
      cv.redraw();
      readout.innerHTML = `<b>OLS Fundamentals:</b> Slope coefficients $\\hat{b}_1 = ${beta1.toFixed(1)}$ and $\\hat{b}_2 = ${beta2.toFixed(1)}$ represent <i>partial regression coefficients</i> (the expected change in $Y$ for a 1-unit change in that regressor, holding all other variables constant). OLS minimizes $\\sum e_i^2$.`;
    }
    render();
  });

  // --------------------------------------------------------------------------
  // 2. hypothesisTesting (Chapter 02)
  // --------------------------------------------------------------------------
  OS.register('hypothesisTesting', function (host) {
    let tStat = 2.45;
    let alpha = 0.05;
    let df = 28;

    const controls = OS.controls(host);
    OS.slider(controls, {
      label: 'Calculated t-Statistic (t = (b - B0) / s_b)',
      min: -4.0, max: 4.0, step: 0.1, value: tStat,
      onChange: (v) => { tStat = v; render(); }
    });
    OS.segmented(controls, {
      label: 'Significance Level (α)',
      options: [
        { label: 'α = 10% (tc ≈ 1.70)', value: '0.10' },
        { label: 'α = 5% (tc ≈ 2.05)', value: '0.05' },
        { label: 'α = 1% (tc ≈ 2.76)', value: '0.01' }
      ],
      value: String(alpha),
      onChange: (v) => { alpha = parseFloat(v); render(); }
    });
    OS.slider(controls, {
      label: 'Degrees of Freedom (df = n - k - 1)',
      min: 10, max: 120, step: 5, value: df,
      onChange: (v) => { df = v; render(); }
    });

    const cv = OS.canvas(host, {
      height: 240,
      label: 't-Distribution Critical Region & Hypothesis Testing Canvas',
      draw: (ctx, w, h) => {
        ctx.fillStyle = OS.C.surface;
        ctx.fillRect(0, 0, w, h);

        const pad = { top: 25, right: 30, bottom: 40, left: 40 };
        const pw = Math.max(80, w - pad.left - pad.right);
        const ph = Math.max(80, h - pad.top - pad.bottom);

        // Approximate critical t value for two-tailed test
        const tc = alpha === 0.01 ? 2.76 : (alpha === 0.10 ? 1.70 : 2.05);

        const scaleX = (x) => pad.left + ((x + 4.5) / 9.0) * pw;
        // Student t density approximation
        const tPdf = (x) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
        const maxY = 0.42;
        const scaleY = (y) => pad.top + ph - (y / maxY) * ph;

        // Base axis
        ctx.strokeStyle = OS.C.line;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pad.left, pad.top + ph);
        ctx.lineTo(pad.left + pw, pad.top + ph);
        ctx.stroke();

        // Shading rejection regions: x < -tc and x > tc
        ctx.fillStyle = OS.rgba(OS.C.red, 0.25);
        // Left tail
        ctx.beginPath();
        ctx.moveTo(scaleX(-4.5), pad.top + ph);
        for (let x = -4.5; x <= -tc; x += 0.05) {
          ctx.lineTo(scaleX(x), scaleY(tPdf(x)));
        }
        ctx.lineTo(scaleX(-tc), pad.top + ph);
        ctx.closePath();
        ctx.fill();

        // Right tail
        ctx.beginPath();
        ctx.moveTo(scaleX(tc), pad.top + ph);
        for (let x = tc; x <= 4.5; x += 0.05) {
          ctx.lineTo(scaleX(x), scaleY(tPdf(x)));
        }
        ctx.lineTo(scaleX(4.5), pad.top + ph);
        ctx.closePath();
        ctx.fill();

        // Draw t-distribution curve
        ctx.beginPath();
        for (let x = -4.5; x <= 4.5; x += 0.05) {
          const px = scaleX(x);
          const py = scaleY(tPdf(x));
          if (x === -4.5) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = OS.C.accent;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw Critical Values Lines
        ctx.strokeStyle = OS.C.red;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(scaleX(-tc), pad.top);
        ctx.lineTo(scaleX(-tc), pad.top + ph);
        ctx.moveTo(scaleX(tc), pad.top);
        ctx.lineTo(scaleX(tc), pad.top + ph);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw Current Sample t-statistic
        const stX = scaleX(Math.max(-4.4, Math.min(4.4, tStat)));
        ctx.strokeStyle = OS.C.ink;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(stX, pad.top + 10);
        ctx.lineTo(stX, pad.top + ph);
        ctx.stroke();

        // Mark marker head
        ctx.beginPath();
        ctx.arc(stX, pad.top + 10, 5, 0, Math.PI * 2);
        ctx.fillStyle = OS.C.ink;
        ctx.fill();

        // Text indicators
        ctx.font = OS.font(10, 'mono', 600);
        ctx.fillStyle = OS.C.red;
        ctx.fillText(`-tc = -${tc.toFixed(2)}`, scaleX(-tc) - 30, pad.top + ph + 16);
        ctx.fillText(`+tc = +${tc.toFixed(2)}`, scaleX(tc) - 5, pad.top + ph + 16);

        ctx.fillStyle = OS.C.ink;
        ctx.fillText(`Sample t = ${tStat.toFixed(2)}`, stX - 25, pad.top + 6);
      }
    });

    const readout = OS.readout(host);
    function render() {
      cv.redraw();
      const tc = alpha === 0.01 ? 2.76 : (alpha === 0.10 ? 1.70 : 2.05);
      const isReject = Math.abs(tStat) > tc;
      readout.innerHTML = `<b>Hypothesis Decision:</b> Testing $H_0: b_j = 0$ vs $H_a: b_j \\neq 0$. Calculated $|t| = ${Math.abs(tStat).toFixed(2)}$ vs Critical $t_c = ${tc.toFixed(2)}$. Decision: <b>${isReject ? '<span style="color:var(--teal)">REJECT H₀ (Statistically Significant at α=' + (alpha * 100) + '%)</span>' : '<span style="color:var(--amber)">FAIL TO REJECT H₀ (Not Statistically Significant)</span>'}</b>.`;
    }
    render();
  });

  // --------------------------------------------------------------------------
  // 3. anovaDecomposition (Chapter 03)
  // --------------------------------------------------------------------------
  OS.register('anovaDecomposition', function (host) {
    let r2 = 0.65;
    let n = 50;
    let k = 3;

    const controls = OS.controls(host);
    OS.slider(controls, {
      label: 'Model Fit (R² = SSR / SST)',
      min: 0.05, max: 0.95, step: 0.05, value: r2,
      onChange: (v) => { r2 = v; render(); }
    });
    OS.slider(controls, {
      label: 'Sample Observations (n)',
      min: 20, max: 200, step: 10, value: n,
      onChange: (v) => { n = v; render(); }
    });
    OS.slider(controls, {
      label: 'Independent Variables (k regressors)',
      min: 1, max: 12, step: 1, value: k,
      onChange: (v) => { k = v; render(); }
    });

    const cv = OS.canvas(host, {
      height: 240,
      label: 'ANOVA Sum of Squares Decomposition Stage',
      draw: (ctx, w, h) => {
        ctx.fillStyle = OS.C.surface;
        ctx.fillRect(0, 0, w, h);

        const sst = 1000;
        const ssr = sst * r2;
        const sse = sst * (1 - r2);
        const dfReg = k;
        const dfErr = n - k - 1;
        const msr = ssr / dfReg;
        const mse = sse / dfErr;
        const f = mse > 0 ? msr / mse : 0;
        const adjR2 = 1 - ((1 - r2) * (n - 1)) / (n - k - 1);

        // Partition bar
        const barX = 40;
        const barY = 30;
        const barW = Math.max(100, w - 80);
        const barH = 36;

        ctx.fillStyle = OS.C.accent;
        ctx.fillRect(barX, barY, barW * r2, barH);

        ctx.fillStyle = OS.rgba(OS.C.red, 0.7);
        ctx.fillRect(barX + barW * r2, barY, barW * (1 - r2), barH);

        ctx.strokeStyle = OS.C.line;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(barX, barY, barW, barH);

        // Bar labels
        ctx.font = OS.font(11, 'mono', 600);
        ctx.fillStyle = OS.C.surface;
        if (r2 > 0.15) {
          ctx.fillText(`SSR: ${ssr.toFixed(0)} (${(r2 * 100).toFixed(0)}%)`, barX + 12, barY + 22);
        }
        if (1 - r2 > 0.15) {
          ctx.fillText(`SSE: ${sse.toFixed(0)} (${((1 - r2) * 100).toFixed(0)}%)`, barX + barW * r2 + 12, barY + 22);
        }

        // ANOVA Table Mock
        const tableY = 90;
        ctx.fillStyle = OS.C.sunk;
        ctx.fillRect(barX, tableY, barW, 115);
        ctx.strokeRect(barX, tableY, barW, 115);

        ctx.font = OS.font(10, 'mono', 600);
        ctx.fillStyle = OS.C.accent;
        ctx.fillText('ANOVA SOURCE', barX + 10, tableY + 20);
        ctx.fillText('DF', barX + 140, tableY + 20);
        ctx.fillText('SUM OF SQUARES', barX + 200, tableY + 20);
        ctx.fillText('MEAN SQUARE', barX + 340, tableY + 20);
        ctx.fillText('F-STAT', barX + 460, tableY + 20);

        ctx.fillStyle = OS.C.ink;
        ctx.font = OS.font(10, 'mono', 400);

        // Row 1: Regression
        ctx.fillText('Regression (SSR)', barX + 10, tableY + 45);
        ctx.fillText(`k = ${dfReg}`, barX + 140, tableY + 45);
        ctx.fillText(ssr.toFixed(1), barX + 200, tableY + 45);
        ctx.fillText(msr.toFixed(1), barX + 340, tableY + 45);
        ctx.fillText(f.toFixed(2), barX + 460, tableY + 45);

        // Row 2: Error
        ctx.fillText('Residual (SSE)', barX + 10, tableY + 70);
        ctx.fillText(`n-k-1 = ${dfErr}`, barX + 140, tableY + 70);
        ctx.fillText(sse.toFixed(1), barX + 200, tableY + 70);
        ctx.fillText(mse.toFixed(2), barX + 340, tableY + 70);
        ctx.fillText('—', barX + 460, tableY + 70);

        // Row 3: Total
        ctx.fillText('Total (SST)', barX + 10, tableY + 95);
        ctx.fillText(`n-1 = ${n - 1}`, barX + 140, tableY + 95);
        ctx.fillText(sst.toFixed(1), barX + 200, tableY + 95);
        ctx.fillText('—', barX + 340, tableY + 95);
        ctx.fillText('—', barX + 460, tableY + 95);
      }
    });

    const readout = OS.readout(host);
    function render() {
      cv.redraw();
      const adjR2 = 1 - ((1 - r2) * (n - 1)) / (n - k - 1);
      readout.innerHTML = `<b>ANOVA Synthesis:</b> Total Sum of Squares $SST = SSR + SSE$. Unadjusted $R^2 = ${(r2 * 100).toFixed(1)}\\%$. <b>Adjusted $\\bar{R}^2 = ${(adjR2 * 100).toFixed(1)}\\%$</b>. Notice: Adding useless regressors increases $k$, penalizing $\\bar{R}^2$ while $R^2$ artificially never decreases.`;
    }
    render();
  });

  // --------------------------------------------------------------------------
  // 4. fDistributionTest (Chapter 04)
  // --------------------------------------------------------------------------
  OS.register('fDistributionTest', function (host) {
    let k = 3;
    let dfErr = 36;
    let fCalc = 5.2;

    const controls = OS.controls(host);
    OS.slider(controls, {
      label: 'Numerator df (k regressors)',
      min: 1, max: 10, step: 1, value: k,
      onChange: (v) => { k = v; render(); }
    });
    OS.slider(controls, {
      label: 'Denominator df (n - k - 1)',
      min: 10, max: 100, step: 5, value: dfErr,
      onChange: (v) => { dfErr = v; render(); }
    });
    OS.slider(controls, {
      label: 'Sample F-Statistic (MSR / MSE)',
      min: 0.5, max: 12.0, step: 0.25, value: fCalc,
      onChange: (v) => { fCalc = v; render(); }
    });

    const cv = OS.canvas(host, {
      height: 240,
      label: 'F-Distribution Asymmetric Curve & Rejection Area Canvas',
      draw: (ctx, w, h) => {
        ctx.fillStyle = OS.C.surface;
        ctx.fillRect(0, 0, w, h);

        const pad = { top: 25, right: 30, bottom: 40, left: 45 };
        const pw = Math.max(80, w - pad.left - pad.right);
        const ph = Math.max(80, h - pad.top - pad.bottom);

        // Approximate F critical value at alpha = 0.05
        const fc = 2.87;

        const scaleX = (x) => pad.left + (x / 12.0) * pw;
        const fPdf = (x) => {
          if (x <= 0) return 0;
          return 0.9 * Math.pow(x, 0.4) * Math.exp(-0.6 * x);
        };
        const maxY = 0.45;
        const scaleY = (y) => pad.top + ph - (y / maxY) * ph;

        // Base axis
        ctx.strokeStyle = OS.C.line;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pad.left, pad.top + ph);
        ctx.lineTo(pad.left + pw, pad.top + ph);
        ctx.stroke();

        // Shading right-tail rejection area (x > fc)
        ctx.fillStyle = OS.rgba(OS.C.red, 0.25);
        ctx.beginPath();
        ctx.moveTo(scaleX(fc), pad.top + ph);
        for (let x = fc; x <= 12.0; x += 0.1) {
          ctx.lineTo(scaleX(x), scaleY(fPdf(x)));
        }
        ctx.lineTo(scaleX(12.0), pad.top + ph);
        ctx.closePath();
        ctx.fill();

        // Draw F curve
        ctx.beginPath();
        for (let x = 0.05; x <= 12.0; x += 0.1) {
          const px = scaleX(x);
          const py = scaleY(fPdf(x));
          if (x === 0.05) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = OS.C.accent;
        ctx.lineWidth = 2.2;
        ctx.stroke();

        // Draw Critical F line
        ctx.strokeStyle = OS.C.red;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(scaleX(fc), pad.top);
        ctx.lineTo(scaleX(fc), pad.top + ph);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw Calculated F stat line
        const sX = scaleX(Math.min(11.8, fCalc));
        ctx.strokeStyle = OS.C.ink;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(sX, pad.top + 8);
        ctx.lineTo(sX, pad.top + ph);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(sX, pad.top + 8, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = OS.C.ink;
        ctx.fill();

        // Labels
        ctx.font = OS.font(10, 'mono', 600);
        ctx.fillStyle = OS.C.red;
        ctx.fillText(`Critical Fc(0.05) ≈ ${fc.toFixed(2)}`, scaleX(fc) + 6, pad.top + 24);

        ctx.fillStyle = OS.C.ink;
        ctx.fillText(`Sample F = ${fCalc.toFixed(2)}`, sX - 25, pad.top + 5);

        ctx.fillStyle = OS.C.muted;
        ctx.fillText('F-statistic (One-tailed test always in right tail)', pad.left + pw / 2 - 110, h - 10);
      }
    });

    const readout = OS.readout(host);
    function render() {
      cv.redraw();
      const fc = 2.87;
      const isSig = fCalc > fc;
      readout.innerHTML = `<b>Joint Hypothesis Testing:</b> Null $H_0: b_1 = b_2 = \\dots = b_k = 0$ vs $H_a$: At least one $b_j \\neq 0$. F-stat $= MSR / MSE = ${fCalc.toFixed(2)}$ vs $F_c = ${fc.toFixed(2)}$. Verdict: <b>${isSig ? '<span style="color:var(--teal)">REJECT H₀ (Regression is jointly significant)</span>' : '<span style="color:var(--amber)">FAIL TO REJECT H₀ (Model has zero joint explanatory power)</span>'}</b>.`;
    }
    render();
  });

  // --------------------------------------------------------------------------
  // 5. forecastIntervals (Chapter 05)
  // --------------------------------------------------------------------------
  OS.register('forecastIntervals', function (host) {
    let forecastX = 1.5;
    let sampleMeanX = 0.0;
    let see = 1.2;

    const controls = OS.controls(host);
    OS.slider(controls, {
      label: 'Forecast Value X_f',
      min: -3.0, max: 3.0, step: 0.25, value: forecastX,
      onChange: (v) => { forecastX = v; render(); }
    });
    OS.slider(controls, {
      label: 'Sample Mean X_bar',
      min: -1.0, max: 1.0, step: 0.2, value: sampleMeanX,
      onChange: (v) => { sampleMeanX = v; render(); }
    });
    OS.slider(controls, {
      label: 'Standard Error of Estimate (SEE)',
      min: 0.5, max: 2.5, step: 0.25, value: see,
      onChange: (v) => { see = v; render(); }
    });

    const cv = OS.canvas(host, {
      height: 240,
      label: 'Prediction vs Confidence Interval Envelope Stage',
      draw: (ctx, w, h) => {
        ctx.fillStyle = OS.C.surface;
        ctx.fillRect(0, 0, w, h);

        const pad = { top: 25, right: 30, bottom: 40, left: 45 };
        const pw = Math.max(80, w - pad.left - pad.right);
        const ph = Math.max(80, h - pad.top - pad.bottom);

        const scaleX = (x) => pad.left + ((x + 3.5) / 7.0) * pw;
        const scaleY = (y) => pad.top + ph - ((y + 4) / 8.0) * ph;

        // OLS fitted line: Y = 0.5 + 0.9 * X
        const b0 = 0.5, b1 = 0.9;
        const yPred = (x) => b0 + b1 * x;

        // Axes
        ctx.strokeStyle = OS.C.line;
        ctx.lineWidth = 1;
        ctx.strokeRect(pad.left, pad.top, pw, ph);

        // Hyperbolic prediction bounds: sf = SEE * sqrt(1 + 1/n + (X - Xbar)^2 / sxx)
        ctx.fillStyle = OS.rgba(OS.C.accent, 0.12);
        ctx.beginPath();
        for (let x = -3.5; x <= 3.5; x += 0.1) {
          const dev = x - sampleMeanX;
          const sf = see * Math.sqrt(1 + 1 / 30 + (dev * dev) / 15);
          const px = scaleX(x);
          const pyUpper = scaleY(yPred(x) + 1.96 * sf);
          if (x === -3.5) ctx.moveTo(px, pyUpper);
          else ctx.lineTo(px, pyUpper);
        }
        for (let x = 3.5; x >= -3.5; x -= 0.1) {
          const dev = x - sampleMeanX;
          const sf = see * Math.sqrt(1 + 1 / 30 + (dev * dev) / 15);
          const px = scaleX(x);
          const pyLower = scaleY(yPred(x) - 1.96 * sf);
          ctx.lineTo(px, pyLower);
        }
        ctx.closePath();
        ctx.fill();

        // Fitted line
        ctx.beginPath();
        ctx.moveTo(scaleX(-3.5), scaleY(yPred(-3.5)));
        ctx.lineTo(scaleX(3.5), scaleY(yPred(3.5)));
        ctx.strokeStyle = OS.C.accent;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Forecast Point Line
        const fX = scaleX(forecastX);
        const yHatF = yPred(forecastX);
        const devF = forecastX - sampleMeanX;
        const sfF = see * Math.sqrt(1 + 1 / 30 + (devF * devF) / 15);

        ctx.strokeStyle = OS.C.ink;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(fX, scaleY(yHatF - 1.96 * sfF));
        ctx.lineTo(fX, scaleY(yHatF + 1.96 * sfF));
        ctx.stroke();
        ctx.setLineDash([]);

        // Upper & Lower Prediction Caps
        ctx.fillStyle = OS.C.red;
        ctx.beginPath();
        ctx.arc(fX, scaleY(yHatF + 1.96 * sfF), 4, 0, Math.PI * 2);
        ctx.arc(fX, scaleY(yHatF - 1.96 * sfF), 4, 0, Math.PI * 2);
        ctx.fill();

        // Center Point forecast
        ctx.fillStyle = OS.C.ink;
        ctx.beginPath();
        ctx.arc(fX, scaleY(yHatF), 5, 0, Math.PI * 2);
        ctx.fill();

        // Labels
        ctx.font = OS.font(10, 'mono', 600);
        ctx.fillStyle = OS.C.ink;
        ctx.fillText(`Point Forecast Ŷ = ${yHatF.toFixed(2)}`, fX + 8, scaleY(yHatF));

        ctx.fillStyle = OS.C.red;
        ctx.fillText(`Upper: +${(yHatF + 1.96 * sfF).toFixed(2)}`, fX + 8, scaleY(yHatF + 1.96 * sfF));
        ctx.fillText(`Lower: ${(yHatF - 1.96 * sfF).toFixed(2)}`, fX + 8, scaleY(yHatF - 1.96 * sfF));
      }
    });

    const readout = OS.readout(host);
    function render() {
      cv.redraw();
      const dev = forecastX - sampleMeanX;
      const sf = see * Math.sqrt(1 + 1 / 30 + (dev * dev) / 15);
      readout.innerHTML = `<b>Forecast Uncertainty:</b> As $X_f$ deviates further from $\\bar{X} = ${sampleMeanX.toFixed(1)}$, the variance of forecast error $(s_f^2)$ expands hyperbolically. Individual observation prediction intervals are <b>strictly wider</b> than confidence intervals for the conditional mean $E(Y|X)$.`;
    }
    render();
  });

})();
