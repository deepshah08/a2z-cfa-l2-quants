/* ==========================================================================
   CFA Level II Quantitative Methods — Part IV: Machine Learning & Big Data (viz-ml.js)
   Simulators:
   17. penalizedRegressionLab
   18. decisionTreeLab
   19. svmKnnLab
   20. pcaClusteringLab
   21. modelEvaluationLab
   22. nlpWranglingLab
   ========================================================================== */

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // 17. penalizedRegressionLab (Chapter 17)
  // --------------------------------------------------------------------------
  OS.register('penalizedRegressionLab', function (host) {
    let penalty = 0.5;
    let mode = 'lasso'; // 'ridge' | 'lasso'

    const controls = OS.controls(host);
    OS.segmented(controls, {
      label: 'Regularization Penalty Method',
      options: [
        { label: 'Ridge Regression (L2: λ·∑b²)', value: 'ridge' },
        { label: 'Lasso Regression (L1: λ·∑|b|)', value: 'lasso' }
      ],
      value: mode,
      onChange: (v) => { mode = v; render(); }
    });
    OS.slider(controls, {
      label: 'Hyperparameter Lambda (λ Penalty)',
      min: 0.0, max: 2.0, step: 0.1, value: penalty,
      onChange: (v) => { penalty = v; render(); }
    });

    const cv = OS.canvas(host, {
      height: 240,
      label: 'Ridge Shrinkage vs Lasso Feature Sparsity Stage',
      draw: (ctx, w, h) => {
        ctx.fillStyle = OS.C.surface;
        ctx.fillRect(0, 0, w, h);

        const pad = { top: 30, right: 30, bottom: 40, left: 45 };
        const pw = Math.max(80, w - pad.left - pad.right);
        const ph = Math.max(80, h - pad.top - pad.bottom);

        // 4 factors: Market, Size, Value, Momentum
        const factors = [
          { name: 'Beta MKT', trueB: 1.2 },
          { name: 'Beta SMB', trueB: 0.6 },
          { name: 'Beta HML', trueB: 0.35 },
          { name: 'Beta MOM (Noise)', trueB: 0.15 }
        ];

        const barW = Math.min(60, pw / 5);
        const scaleY = (b) => pad.top + ph - (b / 1.5) * ph;

        // Ground baseline
        ctx.strokeStyle = OS.C.line;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pad.left, pad.top + ph);
        ctx.lineTo(pad.left + pw, pad.top + ph);
        ctx.stroke();

        factors.forEach((f, idx) => {
          let bShrunk = f.trueB;
          if (mode === 'ridge') {
            bShrunk = f.trueB / (1 + penalty * 1.5);
          } else {
            // Lasso soft-thresholding
            bShrunk = Math.max(0, f.trueB - penalty * 0.4);
          }

          const bx = pad.left + 25 + idx * (barW + 35);
          const by = scaleY(bShrunk);
          const bh = (pad.top + ph) - by;

          // Ghost outline of unpenalized OLS
          const oBy = scaleY(f.trueB);
          ctx.strokeStyle = OS.rgba(OS.C.muted, 0.4);
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 3]);
          ctx.strokeRect(bx, oBy, barW, (pad.top + ph) - oBy);
          ctx.setLineDash([]);

          // Shrunk Bar
          ctx.fillStyle = bShrunk === 0 ? OS.C.red : (mode === 'ridge' ? OS.C.teal : OS.C.accent);
          ctx.fillRect(bx, by, barW, bh);

          // Bar labels
          ctx.font = OS.font(10, 'mono', 600);
          ctx.fillStyle = OS.C.ink;
          ctx.fillText(`b̂ = ${bShrunk.toFixed(2)}`, bx - 2, by - 8);

          ctx.font = OS.font(9, 'mono', 500);
          ctx.fillStyle = OS.C.muted;
          ctx.fillText(f.name, bx - 10, pad.top + ph + 18);
        });

        ctx.font = OS.font(10, 'mono', 600);
        ctx.fillStyle = OS.C.accent;
        ctx.fillText(mode === 'lasso' ? 'Lasso sets weak parameters strictly to ZERO (Feature Selection)' : 'Ridge shrinks all parameters asymptotically toward zero (Retains all variables)', pad.left + 10, pad.top);
      }
    });

    const readout = OS.readout(host);
    function render() {
      cv.redraw();
      if (mode === 'lasso') {
        readout.innerHTML = `<b>Lasso (L1) Regularization:</b> Penalty $\\lambda \\sum |b_j|$. Possesses diamond geometry in parameter space. Drives uninformative parameters (e.g. noise factor Momentum) to <b>exactly zero</b>, functioning as an automated feature selection engine.`;
      } else {
        readout.innerHTML = `<b>Ridge (L2) Regularization:</b> Penalty $\\lambda \\sum b_j^2$. Possesses spherical geometry in parameter space. Shrinks all coefficients toward zero to reduce estimation variance, but <b>never sets coefficients strictly to zero</b> (all predictors remain in the model).`;
      }
    }
    render();
  });

  // --------------------------------------------------------------------------
  // 18. decisionTreeLab (Chapter 18)
  // --------------------------------------------------------------------------
  OS.register('decisionTreeLab', function (host) {
    let maxDepth = 2;

    const controls = OS.controls(host);
    OS.segmented(controls, {
      label: 'Tree Architecture Depth',
      options: [
        { label: 'Depth 1 (Single Decision Stump)', value: '1' },
        { label: 'Depth 2 (Generalizable Balance)', value: '2' },
        { label: 'Depth 3 (High Variance / Overfitting)', value: '3' }
      ],
      value: String(maxDepth),
      onChange: (v) => { maxDepth = parseInt(v, 10); render(); }
    });

    const cv = OS.canvas(host, {
      height: 240,
      label: 'CART Binary Recursive Partitioning Canvas',
      draw: (ctx, w, h) => {
        ctx.fillStyle = OS.C.surface;
        ctx.fillRect(0, 0, w, h);

        const pad = { top: 25, right: 30, bottom: 40, left: 45 };
        const pw = Math.max(80, w - pad.left - pad.right);
        const ph = Math.max(80, h - pad.top - pad.bottom);

        // Feature space: X1 (P/E Ratio), X2 (ROE %)
        ctx.strokeStyle = OS.C.line;
        ctx.lineWidth = 1;
        ctx.strokeRect(pad.left, pad.top, pw, ph);

        // Data points (Green Buy, Red Sell)
        const pts = [
          { x: 12, y: 22, cls: 'buy' }, { x: 15, y: 18, cls: 'buy' }, { x: 10, y: 25, cls: 'buy' },
          { x: 18, y: 12, cls: 'buy' }, { x: 28, y: 8, cls: 'sell' }, { x: 32, y: 6, cls: 'sell' },
          { x: 26, y: 14, cls: 'sell' }, { x: 35, y: 18, cls: 'sell' }
        ];

        const scaleX = (x) => pad.left + ((x - 5) / 35.0) * pw;
        const scaleY = (y) => pad.top + ph - ((y - 2) / 28.0) * ph;

        // Split 1 (Depth >= 1): P/E <= 22
        const s1X = scaleX(22);
        ctx.strokeStyle = OS.C.accent;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(s1X, pad.top);
        ctx.lineTo(s1X, pad.top + ph);
        ctx.stroke();

        ctx.font = OS.font(9, 'mono', 600);
        ctx.fillStyle = OS.C.accent;
        ctx.fillText('Split 1: P/E <= 22', s1X - 85, pad.top + 16);

        // Split 2 (Depth >= 2): ROE >= 10 on right side
        if (maxDepth >= 2) {
          const s2Y = scaleY(10);
          ctx.strokeStyle = OS.C.amber;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(s1X, s2Y);
          ctx.lineTo(pad.left + pw, s2Y);
          ctx.stroke();

          ctx.fillStyle = OS.C.amber;
          ctx.fillText('Split 2: ROE >= 10%', s1X + 15, s2Y - 8);
        }

        // Draw points
        pts.forEach(p => {
          ctx.beginPath();
          ctx.arc(scaleX(p.x), scaleY(p.y), 5, 0, Math.PI * 2);
          ctx.fillStyle = p.cls === 'buy' ? OS.C.teal : OS.C.red;
          ctx.fill();
        });

        // Overfitting indicator if Depth 3
        if (maxDepth === 3) {
          ctx.strokeStyle = OS.rgba(OS.C.red, 0.7);
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 3]);
          ctx.strokeRect(scaleX(33), scaleY(20), 40, 50);
          ctx.setLineDash([]);
          ctx.fillStyle = OS.C.red;
          ctx.fillText('Overfitting Leaf (High Variance)', scaleX(26), scaleY(22));
        }

        ctx.font = OS.font(10, 'mono', 500);
        ctx.fillStyle = OS.C.muted;
        ctx.fillText('Feature 1: P/E Ratio', pad.left + pw / 2 - 50, h - 10);
      }
    });

    const readout = OS.readout(host);
    function render() {
      cv.redraw();
      readout.innerHTML = `<b>CART Binary Splitting:</b> Trees split feature space recursively using Gini impurity $G = 1 - \\sum p_i^2$ or entropy. Deep unpruned trees suffer from <b>overfitting (high variance)</b>. <b>Random Forests</b> resolve this via bootstrap aggregation (bagging) and random feature subspace sampling to decorrelate individual trees.`;
    }
    render();
  });

  // --------------------------------------------------------------------------
  // 19. svmKnnLab (Chapter 19)
  // --------------------------------------------------------------------------
  OS.register('svmKnnLab', function (host) {
    let algo = 'svm'; // 'svm' | 'knn'
    let paramVal = 1.0; // C for SVM, k for KNN

    const controls = OS.controls(host);
    OS.segmented(controls, {
      label: 'Supervised Algorithm',
      options: [
        { label: 'Support Vector Machine (SVM)', value: 'svm' },
        { label: 'k-Nearest Neighbors (KNN)', value: 'knn' }
      ],
      value: algo,
      onChange: (v) => { algo = v; render(); }
    });
    OS.slider(controls, {
      label: 'Hyperparameter (SVM Penalty C / KNN Neighbors k)',
      min: 1.0, max: 7.0, step: 1.0, value: paramVal,
      onChange: (v) => { paramVal = v; render(); }
    });

    const cv = OS.canvas(host, {
      height: 240,
      label: 'SVM Maximum Margin vs KNN Nearest Voting Stage',
      draw: (ctx, w, h) => {
        ctx.fillStyle = OS.C.surface;
        ctx.fillRect(0, 0, w, h);

        const pad = { top: 25, right: 30, bottom: 40, left: 45 };
        const pw = Math.max(80, w - pad.left - pad.right);
        const ph = Math.max(80, h - pad.top - pad.bottom);

        ctx.strokeStyle = OS.C.line;
        ctx.lineWidth = 1;
        ctx.strokeRect(pad.left, pad.top, pw, ph);

        const scaleX = (x) => pad.left + (x / 10.0) * pw;
        const scaleY = (y) => pad.top + ph - (y / 10.0) * ph;

        // Class 1 (Blue) and Class 2 (Red)
        const c1 = [{ x: 2, y: 7 }, { x: 3, y: 8 }, { x: 3.5, y: 6 }, { x: 2.5, y: 5 }];
        const c2 = [{ x: 7, y: 3 }, { x: 8, y: 2 }, { x: 6.5, y: 4 }, { x: 7.5, y: 5 }];

        c1.forEach(p => {
          ctx.beginPath();
          ctx.arc(scaleX(p.x), scaleY(p.y), 4.5, 0, Math.PI * 2);
          ctx.fillStyle = OS.C.accent;
          ctx.fill();
        });

        c2.forEach(p => {
          ctx.beginPath();
          ctx.arc(scaleX(p.x), scaleY(p.y), 4.5, 0, Math.PI * 2);
          ctx.fillStyle = OS.C.red;
          ctx.fill();
        });

        if (algo === 'svm') {
          // Hyperplane line
          ctx.beginPath();
          ctx.moveTo(scaleX(1), scaleY(1));
          ctx.lineTo(scaleX(9), scaleY(9));
          ctx.strokeStyle = OS.C.ink;
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Margins
          const mDist = 1.0 / (paramVal * 0.4);
          ctx.strokeStyle = OS.rgba(OS.C.ink, 0.4);
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);

          ctx.beginPath();
          ctx.moveTo(scaleX(1 - mDist), scaleY(1 + mDist));
          ctx.lineTo(scaleX(9 - mDist), scaleY(9 + mDist));
          ctx.moveTo(scaleX(1 + mDist), scaleY(1 - mDist));
          ctx.lineTo(scaleX(9 + mDist), scaleY(9 - mDist));
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.font = OS.font(10, 'mono', 600);
          ctx.fillStyle = OS.C.ink;
          ctx.fillText(`Maximum Margin Hyperplane (C = ${paramVal})`, pad.left + 15, pad.top + 20);
        } else {
          // KNN circle around test point at (5, 5)
          const tx = scaleX(5), ty = scaleY(5);
          ctx.beginPath();
          ctx.arc(tx, ty, 6, 0, Math.PI * 2);
          ctx.fillStyle = OS.C.amber;
          ctx.fill();

          const kRad = 20 + paramVal * 12;
          ctx.beginPath();
          ctx.arc(tx, ty, kRad, 0, Math.PI * 2);
          ctx.strokeStyle = OS.rgba(OS.C.amber, 0.6);
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.font = OS.font(10, 'mono', 600);
          ctx.fillStyle = OS.C.amber;
          ctx.fillText(`KNN Neighborhood (k = ${paramVal} nearest neighbors)`, pad.left + 15, pad.top + 20);
        }

        ctx.font = OS.font(10, 'mono', 500);
        ctx.fillStyle = OS.C.muted;
        ctx.fillText('Financial Factor Space (e.g. Momentum vs Volatility)', pad.left + pw / 2 - 120, h - 10);
      }
    });

    const readout = OS.readout(host);
    function render() {
      cv.redraw();
      if (algo === 'svm') {
        readout.innerHTML = `<b>Support Vector Machine:</b> Optimizes the <b>maximum margin hyperplane</b> separating classes. Support vectors are points resting on the margin boundary. The hyperparameter $C$ controls the soft-margin penalty (higher $C$ penalizes misclassifications, creating narrower margins).`;
      } else {
        readout.innerHTML = `<b>k-Nearest Neighbors (KNN):</b> A lazy, non-parametric instance learner based on distance metrics. Small $k$ leads to high variance and <b>overfitting</b>; large $k$ leads to high bias and <b>underfitting</b>. Sensitive to feature scaling.`;
      }
    }
    render();
  });

  // --------------------------------------------------------------------------
  // 20. pcaClusteringLab (Chapter 20)
  // --------------------------------------------------------------------------
  OS.register('pcaClusteringLab', function (host) {
    let mode = 'pca'; // 'pca' | 'kmeans'

    const controls = OS.controls(host);
    OS.segmented(controls, {
      label: 'Unsupervised Machine Learning Model',
      options: [
        { label: 'Principal Component Analysis (PCA)', value: 'pca' },
        { label: 'k-Means Clustering (Centroid Partition)', value: 'kmeans' }
      ],
      value: mode,
      onChange: (v) => { mode = v; render(); }
    });

    const cv = OS.canvas(host, {
      height: 240,
      label: 'PCA Eigenvector Rotation & k-Means Clustering Canvas',
      draw: (ctx, w, h) => {
        ctx.fillStyle = OS.C.surface;
        ctx.fillRect(0, 0, w, h);

        const pad = { top: 25, right: 30, bottom: 40, left: 45 };
        const pw = Math.max(80, w - pad.left - pad.right);
        const ph = Math.max(80, h - pad.top - pad.bottom);

        ctx.strokeStyle = OS.C.line;
        ctx.lineWidth = 1;
        ctx.strokeRect(pad.left, pad.top, pw, ph);

        const cx = pad.left + pw / 2;
        const cy = pad.top + ph / 2;

        if (mode === 'pca') {
          // Correlated cloud along 35-degree line
          let seed = 33;
          function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }

          for (let i = 0; i < 40; i++) {
            const u = (rnd() - 0.5) * 120;
            const v = (rnd() - 0.5) * 35;
            const x = cx + u * 0.8 + v * -0.5;
            const y = cy + u * 0.5 + v * 0.8;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fillStyle = OS.rgba(OS.C.accent, 0.7);
            ctx.fill();
          }

          // PC1 Eigenvector Arrow (Dominant direction)
          ctx.strokeStyle = OS.C.ink;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(cx - 110 * 0.8, cy - 110 * 0.5);
          ctx.lineTo(cx + 110 * 0.8, cy + 110 * 0.5);
          ctx.stroke();

          // PC2 Orthogonal Arrow
          ctx.strokeStyle = OS.C.amber;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cx + 45 * -0.5, cy + 45 * 0.8);
          ctx.lineTo(cx - 45 * -0.5, cy - 45 * 0.8);
          ctx.stroke();

          ctx.font = OS.font(10, 'mono', 600);
          ctx.fillStyle = OS.C.ink;
          ctx.fillText('PC1 (Explains 78% Variance)', cx + 40, cy + 65);
          ctx.fillStyle = OS.C.amber;
          ctx.fillText('PC2 (Orthogonal, 22% Variance)', cx - 90, cy - 50);
        } else {
          // 3 Clusters
          const clusters = [
            { cx: pad.left + pw * 0.25, cy: pad.top + ph * 0.35, col: OS.C.accent, name: 'Cluster 1: Tech Growth' },
            { cx: pad.left + pw * 0.75, cy: pad.top + ph * 0.30, col: OS.C.teal, name: 'Cluster 2: Value Defensives' },
            { cx: pad.left + pw * 0.50, cy: pad.top + ph * 0.75, col: OS.C.amber, name: 'Cluster 3: Distressed Credit' }
          ];

          clusters.forEach(c => {
            // Centroid
            ctx.beginPath();
            ctx.arc(c.cx, c.cy, 8, 0, Math.PI * 2);
            ctx.fillStyle = c.col;
            ctx.fill();
            ctx.strokeStyle = OS.C.ink;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Satellite points
            for (let i = 0; i < 8; i++) {
              const ang = (i / 8) * Math.PI * 2;
              const dist = 18 + (i % 3) * 6;
              const px = c.cx + Math.cos(ang) * dist;
              const py = c.cy + Math.sin(ang) * dist;
              ctx.beginPath();
              ctx.arc(px, py, 3.5, 0, Math.PI * 2);
              ctx.fillStyle = c.col;
              ctx.fill();
            }

            ctx.font = OS.font(9, 'mono', 600);
            ctx.fillStyle = OS.C.ink;
            ctx.fillText(c.name, c.cx - 50, c.cy - 14);
          });
        }
      }
    });

    const readout = OS.readout(host);
    function render() {
      cv.redraw();
      if (mode === 'pca') {
        readout.innerHTML = `<b>Principal Component Analysis (PCA):</b> Transforms $k$ correlated assets into orthogonal principal components ordered by eigenvalues (variance explained). Eliminates multicollinearity without discarding underlying financial information. Scree plots locate the elbow cutoff.`;
      } else {
        readout.innerHTML = `<b>k-Means Clustering:</b> Unsupervised algorithm partitioning observations into $k$ clusters by minimizing within-cluster sum of squares (inertia). Sensitive to initial random centroid placement and scale of variables.`;
      }
    }
    render();
  });

  // --------------------------------------------------------------------------
  // 21. modelEvaluationLab (Chapter 21)
  // --------------------------------------------------------------------------
  OS.register('modelEvaluationLab', function (host) {
    let threshold = 0.5;

    const controls = OS.controls(host);
    OS.slider(controls, {
      label: 'Classification Cutoff Threshold',
      min: 0.1, max: 0.9, step: 0.05, value: threshold,
      onChange: (v) => { threshold = v; render(); }
    });

    const cv = OS.canvas(host, {
      height: 240,
      label: 'Confusion Matrix & ROC-AUC Curve Interactive Stage',
      draw: (ctx, w, h) => {
        ctx.fillStyle = OS.C.surface;
        ctx.fillRect(0, 0, w, h);

        const pad = { top: 25, right: 30, bottom: 40, left: 45 };
        const pw = Math.max(80, w - pad.left - pad.right);
        const ph = Math.max(80, h - pad.top - pad.bottom);

        // Compute simulated confusion matrix metrics as threshold changes
        const tp = Math.round(45 * (1 - threshold * 0.7));
        const fp = Math.round(25 * (1 - threshold * 1.1));
        const fn = 45 - tp;
        const tn = 55 - fp;

        const precision = tp / Math.max(1, tp + fp);
        const recall = tp / Math.max(1, tp + fn);
        const accuracy = (tp + tn) / 100;
        const f1 = (2 * precision * recall) / Math.max(0.001, precision + recall);

        // Left Side: Confusion Matrix Grid
        const cmX = pad.left;
        const cmW = 200;
        ctx.fillStyle = OS.C.sunk;
        ctx.fillRect(cmX, pad.top, cmW, ph);
        ctx.strokeRect(cmX, pad.top, cmW, ph);

        ctx.font = OS.font(10, 'mono', 700);
        ctx.fillStyle = OS.C.accent;
        ctx.fillText('CONFUSION MATRIX', cmX + 12, pad.top + 20);

        ctx.font = OS.font(9, 'mono', 500);
        ctx.fillStyle = OS.C.ink;
        ctx.fillText(`True Pos (TP): ${tp}`, cmX + 15, pad.top + 45);
        ctx.fillText(`False Pos (FP): ${fp}`, cmX + 110, pad.top + 45);
        ctx.fillText(`False Neg (FN): ${fn}`, cmX + 15, pad.top + 70);
        ctx.fillText(`True Neg (TN): ${tn}`, cmX + 110, pad.top + 70);

        ctx.strokeStyle = OS.C.line;
        ctx.beginPath();
        ctx.moveTo(cmX + 10, pad.top + 90);
        ctx.lineTo(cmX + cmW - 10, pad.top + 90);
        ctx.stroke();

        ctx.fillText(`Accuracy:  ${(accuracy * 100).toFixed(1)}%`, cmX + 15, pad.top + 110);
        ctx.fillText(`Precision: ${(precision * 100).toFixed(1)}%`, cmX + 15, pad.top + 128);
        ctx.fillText(`Recall:    ${(recall * 100).toFixed(1)}%`, cmX + 15, pad.top + 146);
        ctx.fillText(`F1-Score:  ${f1.toFixed(3)}`, cmX + 15, pad.top + 164);

        // Right Side: ROC Curve
        const rocX = cmX + cmW + 30;
        const rocW = Math.max(80, w - rocX - pad.right);

        ctx.strokeStyle = OS.C.line;
        ctx.lineWidth = 1;
        ctx.strokeRect(rocX, pad.top, rocW, ph);

        // 45-degree random diagonal
        ctx.strokeStyle = OS.rgba(OS.C.muted, 0.4);
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(rocX, pad.top + ph);
        ctx.lineTo(rocX + rocW, pad.top);
        ctx.stroke();
        ctx.setLineDash([]);

        // ROC Curve (AUC = 0.85)
        ctx.beginPath();
        ctx.moveTo(rocX, pad.top + ph);
        ctx.quadraticCurveTo(rocX + rocW * 0.1, pad.top + ph * 0.2, rocX + rocW, pad.top);
        ctx.strokeStyle = OS.C.accent;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Current Threshold Operating Point on ROC
        const fpr = fp / 55;
        const tpr = recall;
        const curX = rocX + fpr * rocW;
        const curY = pad.top + ph - tpr * ph;

        ctx.beginPath();
        ctx.arc(curX, curY, 6, 0, Math.PI * 2);
        ctx.fillStyle = OS.C.red;
        ctx.fill();

        ctx.font = OS.font(10, 'mono', 600);
        ctx.fillStyle = OS.C.red;
        ctx.fillText(`Threshold ${(threshold * 100).toFixed(0)}%`, curX + 10, curY);

        ctx.fillStyle = OS.C.ink;
        ctx.fillText('ROC Curve (AUC = 0.85)', rocX + 10, pad.top + 20);
        ctx.font = OS.font(9, 'mono', 500);
        ctx.fillStyle = OS.C.muted;
        ctx.fillText('False Positive Rate (1 - Specificity)', rocX + rocW / 2 - 80, h - 10);
      }
    });

    const readout = OS.readout(host);
    function render() {
      cv.redraw();
      readout.innerHTML = `<b>Model Evaluation Trade-offs:</b> Precision $= \\frac{TP}{TP + FP}$ vs Recall $= \\frac{TP}{TP + FN}$. As the threshold increases, false positives drop (precision rises) but false negatives surge (recall drops). <b>F1-score</b> balances both. <b>AUC-ROC</b> measures ranking discrimination ability independent of threshold.`;
    }
    render();
  });

  // --------------------------------------------------------------------------
  // 22. nlpWranglingLab (Chapter 22)
  // --------------------------------------------------------------------------
  OS.register('nlpWranglingLab', function (host) {
    let stage = 'raw'; // 'raw' | 'tokens' | 'stopwords' | 'lemmatized'

    const controls = OS.controls(host);
    OS.segmented(controls, {
      label: 'NLP Text Wrangling Pipeline Stage',
      options: [
        { label: '1. Raw Transcript', value: 'raw' },
        { label: '2. Tokenization', value: 'tokens' },
        { label: '3. Stop Words Filter', value: 'stopwords' },
        { label: '4. Lemmatization & TF-IDF', value: 'lemmatized' }
      ],
      value: stage,
      onChange: (v) => { stage = v; render(); }
    });

    const cv = OS.canvas(host, {
      height: 240,
      label: 'NLP Financial Transcript Wrangling Stage',
      draw: (ctx, w, h) => {
        ctx.fillStyle = OS.C.surface;
        ctx.fillRect(0, 0, w, h);

        const pad = { top: 25, right: 30, bottom: 40, left: 45 };
        const pw = Math.max(80, w - pad.left - pad.right);
        const ph = Math.max(80, h - pad.top - pad.bottom);

        ctx.fillStyle = OS.C.sunk;
        ctx.fillRect(pad.left, pad.top, pw, ph);
        ctx.strokeStyle = OS.C.line;
        ctx.lineWidth = 1;
        ctx.strokeRect(pad.left, pad.top, pw, ph);

        ctx.font = OS.font(11, 'mono', 700);
        ctx.fillStyle = OS.C.accent;
        ctx.fillText('FINANCIAL NLP PIPELINE OUTPUT:', pad.left + 16, pad.top + 24);

        ctx.font = OS.font(10, 'mono', 400);
        ctx.fillStyle = OS.C.ink;

        if (stage === 'raw') {
          ctx.fillText('"The management team is aggressively expanding operating margins across Asia."', pad.left + 16, pad.top + 60);
          ctx.fillText('Source: Q3 Earnings Call Conference Audio Transcript (Unstructured Text)', pad.left + 16, pad.top + 90);
        } else if (stage === 'tokens') {
          ctx.fillText('Tokens: ["the", "management", "team", "is", "aggressively", "expanding", "operating", "margins", "across", "asia"]', pad.left + 16, pad.top + 60);
          ctx.fillText('Transformation: Lowercased, stripped punctuation, string regex tokenization', pad.left + 16, pad.top + 90);
        } else if (stage === 'stopwords') {
          ctx.fillText('Filtered: ["management", "team", "aggressively", "expanding", "operating", "margins", "asia"]', pad.left + 16, pad.top + 60);
          ctx.fillText('Removed Stop Words: ["the", "is", "across"] (High frequency, zero analytical signal)', pad.left + 16, pad.top + 90);
        } else {
          ctx.fillText('Lemmatized Roots: ["management", "team", "aggressive", "expand", "operate", "margin", "asia"]', pad.left + 16, pad.top + 60);
          ctx.fillText('TF-IDF Sentiment Vectors: { "expand": 0.42, "margin": 0.38, "aggressive": 0.31 }', pad.left + 16, pad.top + 90);
          ctx.fillStyle = OS.C.teal;
          ctx.font = OS.font(10, 'mono', 700);
          ctx.fillText('✅ Derived Sentiment Score: +0.74 (Bullish Guidance Signal)', pad.left + 16, pad.top + 130);
        }
      }
    });

    const readout = OS.readout(host);
    function render() {
      cv.redraw();
      readout.innerHTML = `<b>Big Data Text Wrangling Pipeline:</b> Unstructured text processing requires: (1) <b>Tokenization</b>; (2) <b>Stop word removal</b>; (3) <b>Lemmatization</b> (morphological dictionary root extraction, preferred over crude rule-based stemming); and (4) <b>TF-IDF</b> vectorization to generate numerical sentiment factors.`;
    }
    render();
  });

})();
