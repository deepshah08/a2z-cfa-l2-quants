/* ==========================================================================
   CFA Level II Quantitative Methods — Part II: Diagnostics & Violations (viz-diagnostics.js)
   Simulators:
   6. heteroskedasticityLab
   7. serialCorrelationLab
   8. multicollinearityLab
   9. omittedVariableBias
   ========================================================================== */

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // 6. heteroskedasticityLab (Chapter 06)
  // --------------------------------------------------------------------------
  OS.register('heteroskedasticityLab', function (host) {
    let mode = 'homo'; // 'homo' | 'conditional'
    let severity = 1.8;
    let useWhiteSE = false;

    const controls = OS.controls(host);
    OS.segmented(controls, {
      label: 'Residual Variance Nature',
      options: [
        { label: 'Homoskedastic (Constant σ²)', value: 'homo' },
        { label: 'Conditional Heteroskedastic (Fan-out)', value: 'conditional' }
      ],
      value: mode,
      onChange: (v) => { mode = v; render(); }
    });
    OS.slider(controls, {
      label: 'Heteroskedastic Severity Factor',
      min: 0.5, max: 3.5, step: 0.25, value: severity,
      onChange: (v) => { severity = v; render(); }
    });
    OS.button(controls, 'Toggle White Corrected SEs', () => {
      useWhiteSE = !useWhiteSE;
      render();
    });

    const cv = OS.canvas(host, {
      height: 240,
      label: 'Heteroskedasticity Residual Scatter & BP-Test Canvas',
      draw: (ctx, w, h) => {
        ctx.fillStyle = OS.C.surface;
        ctx.fillRect(0, 0, w, h);

        const pad = { top: 25, right: 220, bottom: 40, left: 45 };
        const pw = Math.max(80, w - pad.left - pad.right);
        const ph = Math.max(80, h - pad.top - pad.bottom);

        const scaleX = (x) => pad.left + (x / 10.0) * pw;
        const scaleY = (y) => pad.top + ph / 2 - (y / 6.0) * (ph / 2);

        // Axes: Residual e_i vs Regressor X
        ctx.strokeStyle = OS.C.line;
        ctx.lineWidth = 1;
        ctx.strokeRect(pad.left, pad.top, pw, ph);

        // Zero residual center line
        ctx.strokeStyle = OS.rgba(OS.C.muted, 0.4);
        ctx.beginPath();
        ctx.moveTo(pad.left, pad.top + ph / 2);
        ctx.lineTo(pad.left + pw, pad.top + ph / 2);
        ctx.stroke();

        // Synthetic residuals
        const pts = [];
        let seed = 123;
        function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
        for (let i = 1; i <= 60; i++) {
          const x = (i / 60) * 9.5;
          const u = (rnd() - 0.5) * 2;
          let e = u * 1.0;
          if (mode === 'conditional') {
            e = u * (0.2 + severity * (x / 4.0));
          }
          pts.push({ x, e });
        }

        pts.forEach(p => {
          const px = scaleX(p.x);
          const py = scaleY(p.e);
          ctx.beginPath();
          ctx.arc(px, py, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = mode === 'conditional' ? OS.C.amber : OS.C.accent;
          ctx.fill();
        });

        // Residual envelope lines if conditional
        if (mode === 'conditional') {
          ctx.strokeStyle = OS.rgba(OS.C.amber, 0.6);
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(scaleX(0), scaleY(0.2));
          ctx.lineTo(scaleX(9.5), scaleY(0.2 + severity * (9.5 / 4.0)));
          ctx.moveTo(scaleX(0), scaleY(-0.2));
          ctx.lineTo(scaleX(9.5), scaleY(-0.2 - severity * (9.5 / 4.0)));
          ctx.stroke();
          ctx.setLineDash([]);
        }

        ctx.font = OS.font(10, 'mono', 500);
        ctx.fillStyle = OS.C.muted;
        ctx.fillText('Regressor X', pad.left + pw / 2 - 30, h - 10);

        // Diagnostic HUD
        const hudX = pad.left + pw + 15;
        const hudW = pad.right - 25;
        ctx.fillStyle = OS.C.sunk;
        ctx.fillRect(hudX, pad.top, hudW, ph);
        ctx.strokeRect(hudX, pad.top, hudW, ph);

        const bpStat = mode === 'conditional' ? (12.4 * (severity / 1.5)).toFixed(1) : '1.2';
        const bpCrit = 3.84;
        const isReject = parseFloat(bpStat) > bpCrit;

        ctx.font = OS.font(11, 'mono', 700);
        ctx.fillStyle = OS.C.accent;
        ctx.fillText('DIAGNOSTIC TEST', hudX + 10, pad.top + 20);

        ctx.font = OS.font(10, 'mono', 500);
        ctx.fillStyle = OS.C.ink;
        ctx.fillText(`Breusch-Pagan χ²: ${bpStat}`, hudX + 10, pad.top + 45);
        ctx.fillText(`Critical χ²(0.05): ${bpCrit}`, hudX + 10, pad.top + 65);

        ctx.fillStyle = isReject ? OS.C.red : OS.C.teal;
        ctx.font = OS.font(10, 'mono', 700);
        ctx.fillText(isReject ? '🚨 Heteroskedasticity!' : '✅ Homoskedastic', hudX + 10, pad.top + 90);

        ctx.font = OS.font(10, 'mono', 500);
        ctx.fillStyle = OS.C.ink;
        const seVal = useWhiteSE ? '0.34 (White Robust)' : (mode === 'conditional' ? '0.12 (Understated!)' : '0.28 (Valid)');
        ctx.fillText(`Std Error s_b:`, hudX + 10, pad.top + 120);
        ctx.fillStyle = useWhiteSE ? OS.C.teal : (mode === 'conditional' ? OS.C.red : OS.C.ink);
        ctx.fillText(seVal, hudX + 10, pad.top + 138);
      }
    });

    const readout = OS.readout(host);
    function render() {
      cv.redraw();
      readout.innerHTML = `<b>Heteroskedasticity Impact:</b> Under conditional heteroskedasticity, OLS coefficients remain <i>unbiased and consistent</i>, but standard errors are <b>understated</b>, inflating $t$-statistics and $F$-tests. <b>Remedy:</b> Use White-corrected (heteroskedasticity-consistent) standard errors. Do NOT use OLS standard errors!`;
    }
    render();
  });

  // --------------------------------------------------------------------------
  // 7. serialCorrelationLab (Chapter 07)
  // --------------------------------------------------------------------------
  OS.register('serialCorrelationLab', function (host) {
    let rho = 0.70;
    let useNeweyWest = false;

    const controls = OS.controls(host);
    OS.slider(controls, {
      label: 'Autocorrelation Coefficient (ρ: e_t = ρ·e_{t-1} + u_t)',
      min: -0.9, max: 0.9, step: 0.1, value: rho,
      onChange: (v) => { rho = v; render(); }
    });
    OS.button(controls, 'Toggle Newey-West Standard Errors', () => {
      useNeweyWest = !useNeweyWest;
      render();
    });

    const cv = OS.canvas(host, {
      height: 240,
      label: 'Serial Correlation Time Sequence & Durbin-Watson Stage',
      draw: (ctx, w, h) => {
        ctx.fillStyle = OS.C.surface;
        ctx.fillRect(0, 0, w, h);

        const pad = { top: 25, right: 230, bottom: 40, left: 45 };
        const pw = Math.max(80, w - pad.left - pad.right);
        const ph = Math.max(80, h - pad.top - pad.bottom);

        const n = 50;
        const scaleT = (t) => pad.left + (t / n) * pw;
        const scaleE = (e) => pad.top + ph / 2 - (e / 5.0) * (ph / 2);

        // Axes
        ctx.strokeStyle = OS.C.line;
        ctx.lineWidth = 1;
        ctx.strokeRect(pad.left, pad.top, pw, ph);

        // Center zero line
        ctx.strokeStyle = OS.rgba(OS.C.muted, 0.4);
        ctx.beginPath();
        ctx.moveTo(pad.left, pad.top + ph / 2);
        ctx.lineTo(pad.left + pw, pad.top + ph / 2);
        ctx.stroke();

        // Generate autoregressive residuals: e_t = rho * e_{t-1} + u_t
        let prev = 0;
        let seed = 77;
        function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
        const resids = [];
        let diffSqSum = 0, eSqSum = 0;

        for (let t = 0; t < n; t++) {
          const u = (rnd() - 0.5) * 2;
          const e = rho * prev + u * 1.0;
          resids.push(e);
          eSqSum += e * e;
          if (t > 0) {
            const d = e - prev;
            diffSqSum += d * d;
          }
          prev = e;
        }

        const dw = eSqSum > 0 ? (diffSqSum / eSqSum).toFixed(2) : '2.00';

        // Connect residual line
        ctx.beginPath();
        resids.forEach((e, t) => {
          const px = scaleT(t);
          const py = scaleE(e);
          if (t === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.strokeStyle = Math.abs(rho) > 0.4 ? OS.C.red : OS.C.accent;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Points
        resids.forEach((e, t) => {
          const px = scaleT(t);
          const py = scaleE(e);
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fillStyle = OS.C.ink;
          ctx.fill();
        });

        // Time axis label
        ctx.font = OS.font(10, 'mono', 500);
        ctx.fillStyle = OS.C.muted;
        ctx.fillText('Observation Order Time (t = 1 to 50)', pad.left + pw / 2 - 90, h - 10);

        // Diagnostic HUD
        const hudX = pad.left + pw + 15;
        const hudW = pad.right - 25;
        ctx.fillStyle = OS.C.sunk;
        ctx.fillRect(hudX, pad.top, hudW, ph);
        ctx.strokeRect(hudX, pad.top, hudW, ph);

        ctx.font = OS.font(11, 'mono', 700);
        ctx.fillStyle = OS.C.accent;
        ctx.fillText('DURBIN-WATSON TEST', hudX + 10, pad.top + 20);

        ctx.font = OS.font(10, 'mono', 500);
        ctx.fillStyle = OS.C.ink;
        ctx.fillText(`DW ≈ 2(1 - r): ${dw}`, hudX + 10, pad.top + 45);
        ctx.fillText(`dL ≈ 1.38 | dU ≈ 1.62`, hudX + 10, pad.top + 65);

        const dwVal = parseFloat(dw);
        let dwVerdict = '✅ No Autocorrelation';
        let dwColor = OS.C.teal;
        if (dwVal < 1.38) {
          dwVerdict = '🚨 Positive Serial Corr!';
          dwColor = OS.C.red;
        } else if (dwVal > 2.62) {
          dwVerdict = '⚠️ Negative Serial Corr!';
          dwColor = OS.C.amber;
        }

        ctx.fillStyle = dwColor;
        ctx.font = OS.font(10, 'mono', 700);
        ctx.fillText(dwVerdict, hudX + 10, pad.top + 90);

        ctx.font = OS.font(10, 'mono', 500);
        ctx.fillStyle = OS.C.ink;
        ctx.fillText(`Standard Errors:`, hudX + 10, pad.top + 120);
        ctx.fillStyle = useNeweyWest ? OS.C.teal : (dwVal < 1.38 ? OS.C.red : OS.C.ink);
        ctx.fillText(useNeweyWest ? '✅ Newey-West (Valid)' : (dwVal < 1.38 ? '🚨 OLS (Severely Understated!)' : 'Standard OLS'), hudX + 10, pad.top + 138);
      }
    });

    const readout = OS.readout(host);
    function render() {
      cv.redraw();
      readout.innerHTML = `<b>Serial Correlation Diagnostic:</b> $DW \\approx 2(1 - r)$. When $\\rho > 0$, $DW < d_L$, causing positive serial correlation. OLS standard errors are <b>understated</b> (inflating $t$-stats). <b>Remedy:</b> Newey-West standard errors or Hansen method (White SE only fixes heteroskedasticity, NOT serial correlation!).`;
    }
    render();
  });

  // --------------------------------------------------------------------------
  // 8. multicollinearityLab (Chapter 08)
  // --------------------------------------------------------------------------
  OS.register('multicollinearityLab', function (host) {
    let corr = 0.88;

    const controls = OS.controls(host);
    OS.slider(controls, {
      label: 'Correlation r(X₁, X₂)',
      min: 0.0, max: 0.99, step: 0.02, value: corr,
      onChange: (v) => { corr = v; render(); }
    });

    const cv = OS.canvas(host, {
      height: 240,
      label: 'Multicollinearity & VIF Variance Inflation Meter Canvas',
      draw: (ctx, w, h) => {
        ctx.fillStyle = OS.C.surface;
        ctx.fillRect(0, 0, w, h);

        const rSq = corr * corr;
        const vif = 1 / Math.max(0.01, 1 - rSq);

        // VIF Meter Gauge
        const cx = 130, cy = 130, rad = 80;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, Math.PI, 2 * Math.PI);
        ctx.strokeStyle = OS.C.line;
        ctx.lineWidth = 14;
        ctx.stroke();

        // Color sections on gauge: Green (<5), Amber (5-10), Red (>10)
        // Angle mapped from VIF = 1 (angle PI) to VIF = 20 (angle 2*PI)
        const vifAngle = Math.PI + Math.min(1.0, (vif - 1) / 19) * Math.PI;

        ctx.beginPath();
        ctx.arc(cx, cy, rad, Math.PI, vifAngle);
        ctx.strokeStyle = vif > 10 ? OS.C.red : (vif > 5 ? OS.C.amber : OS.C.teal);
        ctx.lineWidth = 14;
        ctx.stroke();

        // Needle
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(vifAngle) * (rad - 15), cy + Math.sin(vifAngle) * (rad - 15));
        ctx.strokeStyle = OS.C.ink;
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fillStyle = OS.C.ink;
        ctx.fill();

        ctx.font = OS.font(16, 'mono', 700);
        ctx.fillStyle = OS.C.ink;
        ctx.fillText(`VIF = ${vif.toFixed(1)}`, cx - 40, cy + 30);

        // Right side comparison table
        const rx = 270;
        ctx.fillStyle = OS.C.sunk;
        ctx.fillRect(rx, 25, Math.max(80, w - rx - 30), 180);
        ctx.strokeRect(rx, 25, Math.max(80, w - rx - 30), 180);

        ctx.font = OS.font(11, 'mono', 700);
        ctx.fillStyle = OS.C.accent;
        ctx.fillText('MULTICOLLINEARITY SYMPTOMS', rx + 15, 50);

        ctx.font = OS.font(10, 'mono', 500);
        ctx.fillStyle = OS.C.ink;
        ctx.fillText(`Pairwise Correlation r(X₁, X₂): ${(corr * 100).toFixed(0)}%`, rx + 15, 78);
        ctx.fillText(`Model R²: 0.82 (High overall fit)`, rx + 15, 102);
        ctx.fillText(`Overall F-statistic: 48.6 (Highly Significant!)`, rx + 15, 126);

        ctx.fillStyle = vif > 5 ? OS.C.red : OS.C.teal;
        ctx.font = OS.font(10, 'mono', 700);
        const tStatMsg = vif > 5 ? 'Individual t-statistics: INSIGNIFICANT! (s_b inflated)' : 'Individual t-statistics: Statistically Significant';
        ctx.fillText(tStatMsg, rx + 15, 154);

        ctx.font = OS.font(9, 'mono', 500);
        ctx.fillStyle = OS.C.muted;
        ctx.fillText(vif > 10 ? '🚨 Severe Multicollinearity (VIF > 10): Drop one variable!' : (vif > 5 ? '⚠️ Moderate Multicollinearity (VIF > 5)' : '✅ Healthy Regressor Independence (VIF < 5)'), rx + 15, 182);
      }
    });

    const readout = OS.readout(host);
    function render() {
      cv.redraw();
      const rSq = corr * corr;
      const vif = 1 / Math.max(0.01, 1 - rSq);
      readout.innerHTML = `<b>Multicollinearity Dilemma:</b> $VIF_j = \\frac{1}{1 - R_j^2} = ${vif.toFixed(1)}$. The classic exam hallmark is <b>High $R^2$ and significant $F$-statistic, but low/insignificant individual $t$-statistics</b>. Coefficients remain unbiased, but standard errors inflate massively.`;
    }
    render();
  });

  // --------------------------------------------------------------------------
  // 9. omittedVariableBias (Chapter 09)
  // --------------------------------------------------------------------------
  OS.register('omittedVariableBias', function (host) {
    let omitBeta = 1.5;
    let correlation = 0.7;

    const controls = OS.controls(host);
    OS.slider(controls, {
      label: 'True Beta of Omitted Variable (β₂)',
      min: -2.0, max: 2.0, step: 0.25, value: omitBeta,
      onChange: (v) => { omitBeta = v; render(); }
    });
    OS.slider(controls, {
      label: 'Correlation between Included & Omitted Regressor (Corr(X₁, X₂))',
      min: -0.9, max: 0.9, step: 0.1, value: correlation,
      onChange: (v) => { correlation = v; render(); }
    });

    const cv = OS.canvas(host, {
      height: 240,
      label: 'Omitted Variable Bias Decomposition Vector Canvas',
      draw: (ctx, w, h) => {
        ctx.fillStyle = OS.C.surface;
        ctx.fillRect(0, 0, w, h);

        const trueB1 = 1.0;
        const bias = omitBeta * correlation;
        const estimatedB1 = trueB1 + bias;

        const pad = { top: 30, right: 40, bottom: 40, left: 50 };
        const pw = Math.max(80, w - pad.left - pad.right);

        // Vector bar chart comparing True Beta vs Bias vs Estimated Beta
        const baseY = 110;
        const scaleB = (b) => pad.left + pw / 2 + (b / 3.0) * (pw / 2);

        ctx.strokeStyle = OS.C.line;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pad.left, baseY);
        ctx.lineTo(pad.left + pw, baseY);
        ctx.stroke();

        // Center line (b = 0)
        ctx.strokeStyle = OS.rgba(OS.C.muted, 0.4);
        ctx.beginPath();
        ctx.moveTo(scaleB(0), 30);
        ctx.lineTo(scaleB(0), 190);
        ctx.stroke();

        // 1. True Beta marker
        ctx.fillStyle = OS.C.accent;
        ctx.beginPath();
        ctx.arc(scaleB(trueB1), baseY, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = OS.font(11, 'mono', 600);
        ctx.fillText(`True β₁ = ${trueB1.toFixed(2)}`, scaleB(trueB1) - 35, baseY - 18);

        // 2. Bias arrow
        ctx.strokeStyle = bias >= 0 ? OS.C.red : OS.C.amber;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(scaleB(trueB1), baseY + 30);
        ctx.lineTo(scaleB(estimatedB1), baseY + 30);
        ctx.stroke();

        ctx.fillStyle = bias >= 0 ? OS.C.red : OS.C.amber;
        ctx.fillText(`Bias = β₂·Cov(X₁,X₂) = ${bias >= 0 ? '+' : ''}${bias.toFixed(2)}`, pad.left + pw / 2 - 80, baseY + 55);

        // 3. Estimated Spurious Beta marker
        ctx.fillStyle = OS.C.ink;
        ctx.beginPath();
        ctx.arc(scaleB(estimatedB1), baseY, 9, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillText(`Estimated b̂₁ = ${estimatedB1.toFixed(2)}`, scaleB(estimatedB1) - 40, baseY + 85);
      }
    });

    const readout = OS.readout(host);
    function render() {
      cv.redraw();
      const bias = omitBeta * correlation;
      const dir = bias > 0 ? 'UPWARD BIAS (Overestimated)' : (bias < 0 ? 'DOWNWARD BIAS (Underestimated)' : 'UNBIASED (Zero correlation)');
      readout.innerHTML = `<b>Omitted Variable Bias (OVB):</b> $\\text{Bias} = \\beta_2 \\times \\frac{\\text{Cov}(X_1, X_2)}{\\text{Var}(X_1)} = ${bias >= 0 ? '+' : ''}${bias.toFixed(2)}$. Verdict: <b><span style="color:${bias !== 0 ? 'var(--red)' : 'var(--teal)'}">${dir}</span></b>. Omitted variable bias makes OLS estimators <b>both biased and inconsistent</b>!`;
    }
    render();
  });

})();
