/* ==========================================================================
   CFA Level II Quantitative Methods — Part III: Extensions & Time Series (viz-timeseries.js)
   Simulators:
   10. dummyVariablesLab
   11. logisticRegressionLab
   12. influenceAnalysisLab
   13. timeSeriesTrends
   14. autoregressiveLab
   15. dickeyFullerLab
   16. cointegrationArchLab
   ========================================================================== */

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // 10. dummyVariablesLab (Chapter 10)
  // --------------------------------------------------------------------------
  OS.register('dummyVariablesLab', function (host) {
    let dummyType = 'intercept'; // 'intercept' | 'slope'
    let deltaIntercept = 1.8;
    let deltaSlope = 0.6;

    const controls = OS.controls(host);
    OS.segmented(controls, {
      label: 'Dummy Variable Structure',
      options: [
        { label: 'Intercept Shift (D = 1)', value: 'intercept' },
        { label: 'Slope Interaction (D × X)', value: 'slope' }
      ],
      value: dummyType,
      onChange: (v) => { dummyType = v; render(); }
    });
    OS.slider(controls, {
      label: 'Intercept Shift (b₂ · D)',
      min: 0.0, max: 3.5, step: 0.25, value: deltaIntercept,
      onChange: (v) => { deltaIntercept = v; render(); }
    });
    OS.slider(controls, {
      label: 'Slope Shift (b₃ · (X × D))',
      min: -0.8, max: 1.2, step: 0.1, value: deltaSlope,
      onChange: (v) => { deltaSlope = v; render(); }
    });

    const cv = OS.canvas(host, {
      height: 240,
      label: 'Qualitative Dummy Regressors Shift Stage',
      draw: (ctx, w, h) => {
        ctx.fillStyle = OS.C.surface;
        ctx.fillRect(0, 0, w, h);

        const pad = { top: 25, right: 30, bottom: 40, left: 45 };
        const pw = Math.max(80, w - pad.left - pad.right);
        const ph = Math.max(80, h - pad.top - pad.bottom);

        const scaleX = (x) => pad.left + (x / 10.0) * pw;
        const scaleY = (y) => pad.top + ph - (y / 10.0) * ph;

        ctx.strokeStyle = OS.C.line;
        ctx.lineWidth = 1;
        ctx.strokeRect(pad.left, pad.top, pw, ph);

        // Baseline line (D = 0, e.g. Normal Regime)
        const b0 = 1.5, b1 = 0.5;
        ctx.beginPath();
        ctx.moveTo(scaleX(0), scaleY(b0));
        ctx.lineTo(scaleX(10), scaleY(b0 + b1 * 10));
        ctx.strokeStyle = OS.C.accent;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Dummy Line (D = 1, e.g. Crisis Regime)
        const b0_d = dummyType === 'intercept' ? b0 + deltaIntercept : b0;
        const b1_d = dummyType === 'slope' ? b1 + deltaSlope : b1;

        ctx.beginPath();
        ctx.moveTo(scaleX(0), scaleY(b0_d));
        ctx.lineTo(scaleX(10), scaleY(b0_d + b1_d * 10));
        ctx.strokeStyle = OS.C.amber;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Labels
        ctx.font = OS.font(10, 'mono', 600);
        ctx.fillStyle = OS.C.accent;
        ctx.fillText(`Baseline (D=0): Ŷ = ${b0.toFixed(1)} + ${b1.toFixed(1)}·X`, pad.left + 10, scaleY(b0 + b1 * 8) - 10);

        ctx.fillStyle = OS.C.amber;
        const dLabel = dummyType === 'intercept'
          ? `Regime (D=1): Ŷ = ${(b0 + deltaIntercept).toFixed(1)} + ${b1.toFixed(1)}·X (Parallel Shift)`
          : `Regime (D=1): Ŷ = ${b0.toFixed(1)} + ${(b1 + deltaSlope).toFixed(1)}·X (Slope Rotation)`;
        ctx.fillText(dLabel, pad.left + 10, scaleY(b0_d + b1_d * 8) + 20);

        ctx.font = OS.font(10, 'mono', 500);
        ctx.fillStyle = OS.C.muted;
        ctx.fillText('Regressor X (e.g. Market Index Return %)', pad.left + pw / 2 - 100, h - 10);
      }
    });

    const readout = OS.readout(host);
    function render() {
      cv.redraw();
      readout.innerHTML = `<b>Dummy Variable Trap Rule:</b> To model $M$ mutual regimes or qualitative categories, you must include exactly <b>$M - 1$ dummy variables</b>. Including $M$ dummies plus an intercept causes <b>perfect multicollinearity</b>. Intercept dummies cause parallel shifts; interaction terms ($X \\times D$) rotate the slope!`;
    }
    render();
  });

  // --------------------------------------------------------------------------
  // 11. logisticRegressionLab (Chapter 11)
  // --------------------------------------------------------------------------
  OS.register('logisticRegressionLab', function (host) {
    let b0 = -1.5;
    let b1 = 1.2;
    let cutoff = 0.5;

    const controls = OS.controls(host);
    OS.slider(controls, {
      label: 'Logit Intercept (b₀)',
      min: -3.0, max: 3.0, step: 0.25, value: b0,
      onChange: (v) => { b0 = v; render(); }
    });
    OS.slider(controls, {
      label: 'Logit Slope (b₁: Log-Odds per unit X)',
      min: 0.2, max: 2.5, step: 0.1, value: b1,
      onChange: (v) => { b1 = v; render(); }
    });
    OS.slider(controls, {
      label: 'Classification Cutoff Threshold',
      min: 0.2, max: 0.8, step: 0.05, value: cutoff,
      onChange: (v) => { cutoff = v; render(); }
    });

    const cv = OS.canvas(host, {
      height: 240,
      label: 'Logistic Sigmoid S-Curve & Probability Canvas',
      draw: (ctx, w, h) => {
        ctx.fillStyle = OS.C.surface;
        ctx.fillRect(0, 0, w, h);

        const pad = { top: 25, right: 30, bottom: 40, left: 45 };
        const pw = Math.max(80, w - pad.left - pad.right);
        const ph = Math.max(80, h - pad.top - pad.bottom);

        const scaleX = (x) => pad.left + ((x + 4.0) / 8.0) * pw;
        const scaleY = (p) => pad.top + ph - p * ph;

        // Axes: P in [0, 1], X in [-4, 4]
        ctx.strokeStyle = OS.C.line;
        ctx.lineWidth = 1;
        ctx.strokeRect(pad.left, pad.top, pw, ph);

        // Threshold line
        ctx.strokeStyle = OS.C.red;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(pad.left, scaleY(cutoff));
        ctx.lineTo(pad.left + pw, scaleY(cutoff));
        ctx.stroke();
        ctx.setLineDash([]);

        // Logistic function: P = 1 / (1 + exp(-(b0 + b1*x)))
        ctx.beginPath();
        for (let x = -4.0; x <= 4.0; x += 0.05) {
          const z = b0 + b1 * x;
          const p = 1 / (1 + Math.exp(-z));
          const px = scaleX(x);
          const py = scaleY(p);
          if (x === -4.0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = OS.C.accent;
        ctx.lineWidth = 2.8;
        ctx.stroke();

        // Labels
        ctx.font = OS.font(10, 'mono', 600);
        ctx.fillStyle = OS.C.red;
        ctx.fillText(`Decision Threshold = ${(cutoff * 100).toFixed(0)}%`, pad.left + 10, scaleY(cutoff) - 8);

        ctx.fillStyle = OS.C.ink;
        const oddsRatio = Math.exp(b1).toFixed(2);
        ctx.fillText(`Odds Ratio (e^b₁) = ${oddsRatio}x (per +1 unit of X)`, pad.left + 10, pad.top + 20);

        ctx.font = OS.font(10, 'mono', 500);
        ctx.fillStyle = OS.C.muted;
        ctx.fillText('Financial Predictor X (e.g. Debt / Equity Ratio)', pad.left + pw / 2 - 110, h - 10);
      }
    });

    const readout = OS.readout(host);
    function render() {
      cv.redraw();
      const oddsRatio = Math.exp(b1).toFixed(2);
      readout.innerHTML = `<b>Logit Mechanics:</b> Dependent variable is binary $Y \\in \\{0, 1\\}$ (e.g. Default vs Solvency). The slope coefficient $\\hat{b}_1 = ${b1.toFixed(2)}$ means a 1-unit increase in $X$ multiplies the odds of event occurrence by <b>$e^{b_1} = ${oddsRatio}\\times$</b> (the <i>Odds Ratio</i>). Logistic regression uses Maximum Likelihood (MLE), not OLS.`;
    }
    render();
  });

  // --------------------------------------------------------------------------
  // 12. influenceAnalysisLab (Chapter 12)
  // --------------------------------------------------------------------------
  OS.register('influenceAnalysisLab', function (host) {
    let outX = 4.0;
    let outY = -3.5;

    const controls = OS.controls(host);
    OS.slider(controls, {
      label: 'Outlier Position Regressor X (Leverage Axis)',
      min: -3.0, max: 5.0, step: 0.5, value: outX,
      onChange: (v) => { outX = v; render(); }
    });
    OS.slider(controls, {
      label: 'Outlier Position Target Y (Residual Axis)',
      min: -5.0, max: 5.0, step: 0.5, value: outY,
      onChange: (v) => { outY = v; render(); }
    });

    const cv = OS.canvas(host, {
      height: 240,
      label: 'Leverage, Studentized Residual & Cook Distance Stage',
      draw: (ctx, w, h) => {
        ctx.fillStyle = OS.C.surface;
        ctx.fillRect(0, 0, w, h);

        const pad = { top: 25, right: 230, bottom: 40, left: 45 };
        const pw = Math.max(80, w - pad.left - pad.right);
        const ph = Math.max(80, h - pad.top - pad.bottom);

        const scaleX = (x) => pad.left + ((x + 4.0) / 10.0) * pw;
        const scaleY = (y) => pad.top + ph / 2 - (y / 7.0) * (ph / 2);

        ctx.strokeStyle = OS.C.line;
        ctx.lineWidth = 1;
        ctx.strokeRect(pad.left, pad.top, pw, ph);

        // Core points (clustered around X in [-2, 2], Y = 0.8 * X)
        const pts = [
          { x: -1.8, y: -1.3 }, { x: -1.2, y: -0.9 }, { x: -0.5, y: -0.4 },
          { x: 0.2, y: 0.1 }, { x: 0.8, y: 0.7 }, { x: 1.5, y: 1.1 }
        ];

        pts.forEach(p => {
          ctx.beginPath();
          ctx.arc(scaleX(p.x), scaleY(p.y), 4, 0, Math.PI * 2);
          ctx.fillStyle = OS.C.accent;
          ctx.fill();
        });

        // The Outlier point
        const opx = scaleX(outX);
        const opy = scaleY(outY);
        ctx.beginPath();
        ctx.arc(opx, opy, 7, 0, Math.PI * 2);
        ctx.fillStyle = OS.C.red;
        ctx.fill();

        // Cook's distance approximation: Di = (e_i^2 / (k * s^2)) * (h_ii / (1 - h_ii)^2)
        const leverage = Math.min(0.85, 0.15 + (outX * outX) / 25.0);
        const resid = outY - 0.8 * outX;
        const cookD = ((resid * resid) / 4.0) * (leverage / ((1 - leverage) * (1 - leverage)));

        // Regression line with outlier
        const slopeShift = (outX * resid) / 30.0;
        const b1Est = 0.8 + slopeShift;

        ctx.beginPath();
        ctx.moveTo(scaleX(-3.5), scaleY(b1Est * -3.5));
        ctx.lineTo(scaleX(5.5), scaleY(b1Est * 5.5));
        ctx.strokeStyle = cookD > 1.0 ? OS.C.red : OS.C.ink;
        ctx.lineWidth = 2.2;
        ctx.stroke();

        // Right side HUD
        const hudX = pad.left + pw + 15;
        const hudW = pad.right - 25;
        ctx.fillStyle = OS.C.sunk;
        ctx.fillRect(hudX, pad.top, hudW, ph);
        ctx.strokeRect(hudX, pad.top, hudW, ph);

        ctx.font = OS.font(11, 'mono', 700);
        ctx.fillStyle = OS.C.accent;
        ctx.fillText('INFLUENCE METRICS', hudX + 10, pad.top + 20);

        ctx.font = OS.font(10, 'mono', 500);
        ctx.fillStyle = OS.C.ink;
        ctx.fillText(`Leverage (hii): ${leverage.toFixed(2)}`, hudX + 10, pad.top + 45);
        ctx.fillText(`Residual (ei): ${resid.toFixed(2)}`, hudX + 10, pad.top + 65);
        ctx.fillText(`Cook's D: ${cookD.toFixed(2)}`, hudX + 10, pad.top + 90);

        ctx.font = OS.font(10, 'mono', 700);
        ctx.fillStyle = cookD > 1.0 ? OS.C.red : OS.C.teal;
        ctx.fillText(cookD > 1.0 ? '🚨 HIGH INFLUENCE (D > 1)' : '✅ Acceptable Influence', hudX + 10, pad.top + 120);

        ctx.font = OS.font(9, 'mono', 500);
        ctx.fillStyle = OS.C.muted;
        ctx.fillText(cookD > 1.0 ? 'Point severely distorts beta!' : 'Slope remains stable', hudX + 10, pad.top + 140);
      }
    });

    const readout = OS.readout(host);
    function render() {
      cv.redraw();
      const leverage = Math.min(0.85, 0.15 + (outX * outX) / 25.0);
      const resid = outY - 0.8 * outX;
      const cookD = ((resid * resid) / 4.0) * (leverage / ((1 - leverage) * (1 - leverage)));
      readout.innerHTML = `<b>Outliers vs Leverage:</b> High leverage points (extreme $X$, high $h_{ii}$) combine with large studentized residuals to produce <b>Cook's Distance $D_i = ${cookD.toFixed(2)}$</b>. Rule of thumb: $D_i > 1.0$ indicates an influential observation that unilaterally distorts OLS estimates.`;
    }
    render();
  });

  // --------------------------------------------------------------------------
  // 13. timeSeriesTrends (Chapter 13)
  // --------------------------------------------------------------------------
  OS.register('timeSeriesTrends', function (host) {
    let trendType = 'linear'; // 'linear' | 'loglinear'
    let growthRate = 0.08;

    const controls = OS.controls(host);
    OS.segmented(controls, {
      label: 'Trend Specification',
      options: [
        { label: 'Linear Trend (Constant $ growth)', value: 'linear' },
        { label: 'Log-Linear Trend (Constant % growth)', value: 'loglinear' }
      ],
      value: trendType,
      onChange: (v) => { trendType = v; render(); }
    });
    OS.slider(controls, {
      label: 'Growth Rate / Slope Parameter (b₁)',
      min: 0.02, max: 0.20, step: 0.02, value: growthRate,
      onChange: (v) => { growthRate = v; render(); }
    });

    const cv = OS.canvas(host, {
      height: 240,
      label: 'Linear vs Log-Linear Trend Progression Stage',
      draw: (ctx, w, h) => {
        ctx.fillStyle = OS.C.surface;
        ctx.fillRect(0, 0, w, h);

        const pad = { top: 25, right: 30, bottom: 40, left: 45 };
        const pw = Math.max(80, w - pad.left - pad.right);
        const ph = Math.max(80, h - pad.top - pad.bottom);

        const periods = 40;
        const scaleT = (t) => pad.left + (t / periods) * pw;
        const scaleY = (y) => pad.top + ph - (y / 80.0) * ph;

        ctx.strokeStyle = OS.C.line;
        ctx.lineWidth = 1;
        ctx.strokeRect(pad.left, pad.top, pw, ph);

        ctx.beginPath();
        for (let t = 0; t <= periods; t++) {
          let val = 10;
          if (trendType === 'linear') {
            val = 10 + growthRate * 350 * (t / periods);
          } else {
            val = 10 * Math.exp(growthRate * t);
          }
          const px = scaleT(t);
          const py = scaleY(Math.min(78, val));
          if (t === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = trendType === 'loglinear' ? OS.C.amber : OS.C.accent;
        ctx.lineWidth = 2.8;
        ctx.stroke();

        ctx.font = OS.font(11, 'mono', 600);
        ctx.fillStyle = ctx.strokeStyle;
        const label = trendType === 'linear'
          ? `Linear Trend: y_t = b₀ + b₁·t (Constant absolute increments)`
          : `Log-Linear Trend: ln(y_t) = b₀ + b₁·t (Constant ${(growthRate * 100).toFixed(0)}% growth)`;
        ctx.fillText(label, pad.left + 10, pad.top + 20);

        ctx.font = OS.font(10, 'mono', 500);
        ctx.fillStyle = OS.C.muted;
        ctx.fillText('Time t (1 to 40 periods)', pad.left + pw / 2 - 60, h - 10);
      }
    });

    const readout = OS.readout(host);
    function render() {
      cv.redraw();
      readout.innerHTML = `<b>Trend Model Selection:</b> Use a <i>linear trend</i> when data grows by a constant absolute amount per period. Use a <i>log-linear trend</i> when data grows at a constant <b>percentage rate</b> (exponential growth). Trend models often suffer from <b>serial correlation</b> and must be tested via Durbin-Watson.`;
    }
    render();
  });

  // --------------------------------------------------------------------------
  // 14. autoregressiveLab (Chapter 14)
  // --------------------------------------------------------------------------
  OS.register('autoregressiveLab', function (host) {
    let b1 = 0.65;
    let b0 = 2.0;

    const controls = OS.controls(host);
    OS.slider(controls, {
      label: 'AR(1) Persistence Coefficient (b₁)',
      min: -0.9, max: 0.95, step: 0.05, value: b1,
      onChange: (v) => { b1 = v; render(); }
    });
    OS.slider(controls, {
      label: 'AR(1) Intercept (b₀)',
      min: 0.5, max: 5.0, step: 0.5, value: b0,
      onChange: (v) => { b0 = v; render(); }
    });

    const cv = OS.canvas(host, {
      height: 240,
      label: 'AR(1) Mean Reverting Level & Multi-Step Forecast Stage',
      draw: (ctx, w, h) => {
        ctx.fillStyle = OS.C.surface;
        ctx.fillRect(0, 0, w, h);

        const pad = { top: 25, right: 30, bottom: 40, left: 45 };
        const pw = Math.max(80, w - pad.left - pad.right);
        const ph = Math.max(80, h - pad.top - pad.bottom);

        // Mean reverting level: xL = b0 / (1 - b1)
        const xL = Math.abs(1 - b1) > 0.02 ? b0 / (1 - b1) : 50;

        const periods = 30;
        const scaleT = (t) => pad.left + (t / periods) * pw;
        const scaleY = (y) => pad.top + ph - ((y + 5) / 25.0) * ph;

        ctx.strokeStyle = OS.C.line;
        ctx.lineWidth = 1;
        ctx.strokeRect(pad.left, pad.top, pw, ph);

        // Mean reverting dashed line
        const pL = scaleY(xL);
        if (pL >= pad.top && pL <= pad.top + ph) {
          ctx.strokeStyle = OS.C.red;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(pad.left, pL);
          ctx.lineTo(pad.left + pw, pL);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.font = OS.font(10, 'mono', 600);
          ctx.fillStyle = OS.C.red;
          ctx.fillText(`Mean Reverting Level xL = ${xL.toFixed(1)}`, pad.left + pw - 220, pL - 6);
        }

        // Multi-step chain rule forecast starting from x_0 = 15
        let current = 15.0;
        ctx.beginPath();
        for (let t = 0; t <= 15; t++) {
          const px = scaleT(t);
          const py = scaleY(current);
          if (t === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
          current = b0 + b1 * current;
        }
        ctx.strokeStyle = OS.C.accent;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Forecast points
        current = 15.0;
        for (let t = 0; t <= 15; t++) {
          const px = scaleT(t);
          const py = scaleY(current);
          ctx.beginPath();
          ctx.arc(px, py, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = OS.C.ink;
          ctx.fill();
          current = b0 + b1 * current;
        }

        ctx.font = OS.font(10, 'mono', 500);
        ctx.fillStyle = OS.C.muted;
        ctx.fillText('Forecast Horizons (t = 1, 2, ..., 15)', pad.left + pw / 2 - 90, h - 10);
      }
    });

    const readout = OS.readout(host);
    function render() {
      cv.redraw();
      const xL = (b0 / (1 - b1)).toFixed(2);
      readout.innerHTML = `<b>AR(1) Multi-Step Forecasting:</b> Model: $x_t = ${b0.toFixed(1)} + ${b1.toFixed(2)} x_{t-1}$. Mean reverting level $x_L = \\frac{b_0}{1 - b_1} = <b>${xL}</b>$. Condition for covariance stationarity: <b>$|b_1| < 1$</b>. Successive multi-step forecasts asymptotically converge toward $x_L$.`;
    }
    render();
  });

  // --------------------------------------------------------------------------
  // 15. dickeyFullerLab (Chapter 15)
  // --------------------------------------------------------------------------
  OS.register('dickeyFullerLab', function (host) {
    let mode = 'unitroot'; // 'stationary' | 'unitroot'

    const controls = OS.controls(host);
    OS.segmented(controls, {
      label: 'Time Series Nature',
      options: [
        { label: 'Covariance Stationary (|b₁| = 0.55)', value: 'stationary' },
        { label: 'Unit Root Random Walk (b₁ = 1.0)', value: 'unitroot' }
      ],
      value: mode,
      onChange: (v) => { mode = v; render(); }
    });

    const cv = OS.canvas(host, {
      height: 240,
      label: 'Random Walk Unit Root & Dickey-Fuller Test Stage',
      draw: (ctx, w, h) => {
        ctx.fillStyle = OS.C.surface;
        ctx.fillRect(0, 0, w, h);

        const pad = { top: 25, right: 230, bottom: 40, left: 45 };
        const pw = Math.max(80, w - pad.left - pad.right);
        const ph = Math.max(80, h - pad.top - pad.bottom);

        const n = 60;
        const scaleT = (t) => pad.left + (t / n) * pw;
        const scaleY = (y) => pad.top + ph / 2 - (y / 20.0) * (ph / 2);

        ctx.strokeStyle = OS.C.line;
        ctx.lineWidth = 1;
        ctx.strokeRect(pad.left, pad.top, pw, ph);

        // Simulate path
        let seed = 44;
        function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
        const series = [0];
        const b1 = mode === 'unitroot' ? 1.0 : 0.55;

        for (let t = 1; t < n; t++) {
          const err = (rnd() - 0.5) * 3;
          const next = b1 * series[t - 1] + err;
          series.push(next);
        }

        ctx.beginPath();
        series.forEach((y, t) => {
          const px = scaleT(t);
          const py = scaleY(Math.max(-18, Math.min(18, y)));
          if (t === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.strokeStyle = mode === 'unitroot' ? OS.C.red : OS.C.accent;
        ctx.lineWidth = 2.2;
        ctx.stroke();

        // Right side HUD
        const hudX = pad.left + pw + 15;
        const hudW = pad.right - 25;
        ctx.fillStyle = OS.C.sunk;
        ctx.fillRect(hudX, pad.top, hudW, ph);
        ctx.strokeRect(hudX, pad.top, hudW, ph);

        const dfStat = mode === 'unitroot' ? '-0.85' : '-4.32';
        const dfCrit = '-2.89'; // Dickey-Fuller critical value at 5%
        const hasUnitRoot = mode === 'unitroot';

        ctx.font = OS.font(11, 'mono', 700);
        ctx.fillStyle = OS.C.accent;
        ctx.fillText('DICKEY-FULLER TEST', hudX + 10, pad.top + 20);

        ctx.font = OS.font(10, 'mono', 500);
        ctx.fillStyle = OS.C.ink;
        ctx.fillText(`Test: x_t - x_{t-1} = g·x_{t-1}`, hudX + 10, pad.top + 45);
        ctx.fillText(`H0: g = 0 (Unit Root)`, hudX + 10, pad.top + 65);
        ctx.fillText(`DF t-stat: ${dfStat}`, hudX + 10, pad.top + 90);
        ctx.fillText(`DF Critical: ${dfCrit}`, hudX + 10, pad.top + 110);

        ctx.font = OS.font(10, 'mono', 700);
        ctx.fillStyle = hasUnitRoot ? OS.C.red : OS.C.teal;
        ctx.fillText(hasUnitRoot ? '🚨 Unit Root! (Non-stationary)' : '✅ Stationary (Reject H0)', hudX + 10, pad.top + 140);

        ctx.font = OS.font(9, 'mono', 500);
        ctx.fillStyle = OS.C.muted;
        ctx.fillText(hasUnitRoot ? 'Remedy: First-Difference series!' : 'Safe to run standard OLS', hudX + 10, pad.top + 160);
      }
    });

    const readout = OS.readout(host);
    function render() {
      cv.redraw();
      readout.innerHTML = `<b>Dickey-Fuller (DF) & Unit Roots:</b> If $b_1 = 1$, the time series possesses a <b>unit root</b> and variance grows linearly with $t$. Standard $t$-tests fail and cause <i>spurious regression</i>. <b>Remedy:</b> First-differencing $y_t = x_t - x_{t-1}$ converts an $I(1)$ series into an $I(0)$ stationary series.`;
    }
    render();
  });

  // --------------------------------------------------------------------------
  // 16. cointegrationArchLab (Chapter 16)
  // --------------------------------------------------------------------------
  OS.register('cointegrationArchLab', function (host) {
    let mode = 'cointeg'; // 'cointeg' | 'arch'

    const controls = OS.controls(host);
    OS.segmented(controls, {
      label: 'Financial Phenomenon',
      options: [
        { label: 'Cointegration (Spread Mean Reversion)', value: 'cointeg' },
        { label: 'ARCH(1) Volatility Clustering', value: 'arch' }
      ],
      value: mode,
      onChange: (v) => { mode = v; render(); }
    });

    const cv = OS.canvas(host, {
      height: 240,
      label: 'Cointegration Equilibrium vs ARCH Volatility Clustering Stage',
      draw: (ctx, w, h) => {
        ctx.fillStyle = OS.C.surface;
        ctx.fillRect(0, 0, w, h);

        const pad = { top: 25, right: 30, bottom: 40, left: 45 };
        const pw = Math.max(80, w - pad.left - pad.right);
        const ph = Math.max(80, h - pad.top - pad.bottom);

        const n = 60;
        const scaleT = (t) => pad.left + (t / n) * pw;
        const scaleY = (y) => pad.top + ph / 2 - (y / 25.0) * (ph / 2);

        ctx.strokeStyle = OS.C.line;
        ctx.lineWidth = 1;
        ctx.strokeRect(pad.left, pad.top, pw, ph);

        let seed = 51;
        function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }

        if (mode === 'cointeg') {
          // Two non-stationary random walks that share a common stochastic trend
          let rw = 0;
          const s1 = [], s2 = [];
          for (let t = 0; t < n; t++) {
            rw += (rnd() - 0.5) * 2;
            const spread = (rnd() - 0.5) * 2;
            s1.push(rw + spread);
            s2.push(rw - spread);
          }

          // Draw series 1
          ctx.beginPath();
          s1.forEach((y, t) => {
            const px = scaleT(t);
            const py = scaleY(y);
            if (t === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          });
          ctx.strokeStyle = OS.C.accent;
          ctx.lineWidth = 2;
          ctx.stroke();

          // Draw series 2
          ctx.beginPath();
          s2.forEach((y, t) => {
            const px = scaleT(t);
            const py = scaleY(y);
            if (t === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          });
          ctx.strokeStyle = OS.C.amber;
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.font = OS.font(10, 'mono', 600);
          ctx.fillStyle = OS.C.ink;
          ctx.fillText('Two I(1) assets bound by cointegrating equilibrium: e_t = Y - β·X ~ I(0)', pad.left + 10, pad.top + 20);
        } else {
          // ARCH(1) Volatility clustering: e_t = sigma_t * z_t, sigma_t^2 = a0 + a1 * e_{t-1}^2
          let prevE = 0.5;
          const resids = [];
          for (let t = 0; t < n; t++) {
            const sigma = Math.sqrt(0.3 + 0.85 * prevE * prevE);
            const z = (rnd() - 0.5) * 2.2;
            const e = sigma * z;
            resids.push(e);
            prevE = e;
          }

          ctx.beginPath();
          resids.forEach((y, t) => {
            const px = scaleT(t);
            const py = scaleY(y);
            if (t === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          });
          ctx.strokeStyle = OS.C.red;
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.font = OS.font(10, 'mono', 600);
          ctx.fillStyle = OS.C.red;
          ctx.fillText('ARCH(1): High volatility clusters together in calm vs stormy periods', pad.left + 10, pad.top + 20);
        }

        ctx.font = OS.font(10, 'mono', 500);
        ctx.fillStyle = OS.C.muted;
        ctx.fillText('Time Sequence t (1 to 60 periods)', pad.left + pw / 2 - 80, h - 10);
      }
    });

    const readout = OS.readout(host);
    function render() {
      cv.redraw();
      if (mode === 'cointeg') {
        readout.innerHTML = `<b>Cointegration:</b> Two non-stationary $I(1)$ series are <b>cointegrated</b> if a linear combination is stationary $I(0)$. Tested via the <i>Engle-Granger two-step method</i>. Cointegrated series reflect a true long-run economic relationship (e.g., spot vs futures) and avoid spurious regression.`;
      } else {
        readout.innerHTML = `<b>ARCH Volatility Clustering:</b> Under $ARCH(1)$, residual variance $\\sigma_t^2 = a_0 + a_1 e_{t-1}^2$ depends on lagged squared residuals. Large shocks follow large shocks. If $a_1$ is significant, standard OLS hypothesis testing is invalid. <b>Remedy:</b> Generalized Least Squares or GARCH modeling.`;
      }
    }
    render();
  });

})();
