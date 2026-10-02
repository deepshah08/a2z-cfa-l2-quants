# CFA Level II: Quantitative Methods, Model by Model

> **An Explorable Econometric & Machine Learning Field Guide**  
> Sourced directly from the official **CFA Institute Level II Quantitative Methods** curriculum.

---

## 🧭 Overview & Core Architecture

Designed to make advanced financial econometrics and machine learning accessible and tangible. Instead of passively memorizing formulas, financial analysts can dynamically inject econometric violations, test hypothesis rejection zones, explore time-series unit roots, and train penalized machine learning algorithms in real time.

1. **Zero-Build, Pure Web Standards**: Vanilla ES6+ Canvas, CSS3 with dark/light theme tokens, and HTML5. Zero bundler dependency or framework bloat.
2. **KaTeX Mathematical Typography**: 187 mathematically rigorous LaTeX formulations rendered with zero layout shift.
3. **23 High-DPI Interactive Simulators**: Every simulator includes interactive controls, responsive bounds checking, and live analytical readouts.
4. **Two-Stage Automated Quality Gate**: `npm test` enforces document formatting, KaTeX syntax integrity, TOC anchor validity, and headless multi-viewport simulator stability.

---

## 🗺️ Curriculum Blueprint

### Part I · Multiple Regression & Model Diagnostics
* **01. Multiple Linear Regression & Classic Assumptions**: Gauss-Markov BLUE conditions, partial slopes, disturbance errors.
* **02. Hypothesis Testing & t-Distribution**: Two-tailed vs one-tailed tests, degrees of freedom, confidence intervals.
* **03. ANOVA Decomposition & Adjusted R²**: SST, SSR, SSE partition, degrees-of-freedom penalties.
* **04. Joint Hypothesis Testing & The F-Statistic**: Joint significance testing, MSR/MSE ratio, one-tailed F-distribution.
* **05. Prediction Intervals & Forecasting**: Conditional mean confidence intervals vs individual prediction intervals.

### Part II · Model Misspecification & Econometric Violations
* **06. Heteroskedasticity & Breusch-Pagan**: Conditional vs unconditional variance, understated standard errors, White robust SE.
* **07. Serial Correlation & Durbin-Watson**: First-order autocorrelation, DW statistic, Newey-West standard error correction.
* **08. Multicollinearity & Variance Inflation Factor**: High R² with low t-stats, VIF thresholding, remedies.
* **09. Omitted Variable Bias & Functional Form**: Direction of OVB, structural instability, nonlinear transformations.

### Part III · Extensions & Time-Series Analysis
* **10. Qualitative Regressors & Dummy Variables**: Intercept shifts, slope interaction dummies, dummy variable trap.
* **11. Binary Dependent Variables & Logistic Regression**: Logit link function, Odds Ratios, Maximum Likelihood (MLE).
* **12. Influence Analysis & Cook's Distance**: Outliers vs high leverage points ($h_{ii}$), Cook's $D_i$ impact on parameters.
* **13. Time-Series Trends & Covariance Stationarity**: Linear vs log-linear trends, 3 conditions of covariance stationarity.
* **14. Autoregressive AR(1) Models & Mean Reversion**: Persistence $|b_1| < 1$, mean reverting level $x_L = b_0 / (1 - b_1)$, chain rule forecasting.
* **15. Random Walks, Unit Roots & Dickey-Fuller**: Non-stationarity, spurious regressions, Dickey-Fuller test, first-differencing.
* **16. Seasonality, Cointegration & ARCH Volatility**: Long-run economic equilibrium, Engle-Granger test, ARCH(1) clustering.

### Part IV · Machine Learning & Big Data Projects
* **17. Penalized Regression: Ridge (L2) vs Lasso (L1)**: Regularization parameter $\lambda$, bias-variance trade-off, Lasso feature sparsity.
* **18. Decision Trees (CART) & Random Forests**: Binary splits, Gini impurity, tree pruning, bootstrap aggregation (bagging).
* **19. Support Vector Machines (SVM) & k-Nearest Neighbors**: Maximum margin hyperplane, support vectors, soft-margin $C$, lazy KNN.
* **20. Unsupervised Learning: PCA & k-Means Clustering**: Eigenvector decomposition, variance explained, centroid minimization.
* **21. Model Evaluation, Cross-Validation & ROC-AUC**: Precision-Recall trade-offs, F1-score, ROC curves, Area Under Curve.
* **22. Big Data Financial Projects: Text Wrangling & NLP**: Tokenization, stop words, lemmatization vs stemming, TF-IDF sentiment scoring.

---

## 🧪 Automated Testing

Run the automated two-stage test suite:

```bash
npm test
```

This verifies:
- KaTeX stylesheets and auto-render extensions are correctly configured.
- Chapter metadata tags (`.ch-meta`) are spaced without concatenation.
- All TOC links match section IDs in `index.html`.
- All visualizers initialize, respond to controls, and maintain finite coordinates across 320px, 480px, 768px, and 1200px viewports.

---

## 🌐 Deployment to GitHub Pages

Hosted permanently with zero expiration:

```bash
git init
git add .
git commit -m "feat: initial release of CFA Level II Quantitative Methods"
gh repo create a2z-cfa-l2-quants --public --source=. --remote=origin --push
gh api -X POST repos/:owner/a2z-cfa-l2-quants/pages -f source='{"branch":"main","path":"/"}'
```
