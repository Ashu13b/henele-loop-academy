# SESSION.md — Auto-generated 2026-04-11 18:21
# Do not edit manually. Regenerated every session.

mode: planning
stack: javascript

## Commands For This Stack
linter: npx eslint . --ext .js,.jsx,.ts,.tsx --max-warnings 0
tests: npm test -- --watchAll=false
signatures: grep -rn "^export \|^function \|^const.*=>" src/ 2>/dev/null
build: npm run build

## Existing Source Files
./countercurrent_simulator.jsx
./index.html
./src/App.jsx
./src/components/Chart.jsx
./src/components/Controls.jsx
./src/components/LinearViz.jsx
./src/components/UViz.jsx
./src/constants.js
./src/engine.js
./src/explainer.js
./src/helpers.js
./src/main.jsx
./tests/App.test.jsx
./tests/Chart.test.jsx
./tests/Controls.test.jsx
./tests/LinearViz.test.jsx
./tests/UViz.test.jsx
./tests/constants.test.js
./tests/engine.test.js
./tests/explainer.test.js
./tests/helpers.test.js
./tests/scaffold.test.js
./tests/setup.js
./vite.config.js

## Existing Signatures
signatures/App.jsx.sig signatures/Chart.jsx.sig signatures/Controls.jsx.sig signatures/LinearViz.jsx.sig signatures/UViz.jsx.sig signatures/constants.js.sig signatures/engine.js.sig signatures/explainer.js.sig signatures/helpers.js.sig 

## Task Progress
done: 12 / 12
next: No pending tasks

## Uncommitted Changes
 M PLAN.md
 M SESSION.md
 D dist/assets/index-eu9m_maF.js
 M dist/index.html
 D node_modules/.vite/deps_temp_f76d5fa2/chunk-2YIMICFJ.js
 D node_modules/.vite/deps_temp_f76d5fa2/chunk-2YIMICFJ.js.map
 D node_modules/.vite/deps_temp_f76d5fa2/chunk-BCXODTBQ.js
 D node_modules/.vite/deps_temp_f76d5fa2/chunk-BCXODTBQ.js.map
 D node_modules/.vite/deps_temp_f76d5fa2/package.json
 D node_modules/.vite/deps_temp_f76d5fa2/react-dom.js
 D node_modules/.vite/deps_temp_f76d5fa2/react-dom.js.map
 D node_modules/.vite/deps_temp_f76d5fa2/react-dom_client.js
 D node_modules/.vite/deps_temp_f76d5fa2/react-dom_client.js.map
 D node_modules/.vite/deps_temp_f76d5fa2/react.js
 D node_modules/.vite/deps_temp_f76d5fa2/react.js.map
 D node_modules/.vite/deps_temp_f76d5fa2/react_jsx-dev-runtime.js
 D node_modules/.vite/deps_temp_f76d5fa2/react_jsx-dev-runtime.js.map
 D node_modules/.vite/deps_temp_f76d5fa2/react_jsx-runtime.js
 D node_modules/.vite/deps_temp_f76d5fa2/react_jsx-runtime.js.map
 D node_modules/.vite/deps_temp_f76d5fa2/recharts.js
 D node_modules/.vite/deps_temp_f76d5fa2/recharts.js.map
 M node_modules/.vite/vitest/results.json
?? dist/assets/index-Bqe_xVyj.js

## Recent Commits
3501db8 fix: Bugs 7+8+10 — isotonic start, bidirectional osmosis, full equilibration
72d4053 fix: faster iw vasa-recta drain stops I dilution by osmotic water inflow
db45d9b fix: interstitium IS restores toward 300 instead of decaying to 0
67ed1ec fix: Bug 6 — descending limb dw no longer increases going down
4ad70e6 fix: n from s.ds.length — prevents crash on numBoxes change
