import { copyFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const publicRoot = resolve("public/tesseract");
const coreRoot = resolve(publicRoot, "core");
const languageRoot = resolve(publicRoot, "lang/4.0.0_best_int");
const coreSource = resolve("node_modules/tesseract.js-core");
const languageSource = resolve(
  "node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz"
);
const coreAssets = [
  "tesseract-core-lstm.wasm",
  "tesseract-core-lstm.wasm.js",
  "tesseract-core-simd-lstm.wasm",
  "tesseract-core-simd-lstm.wasm.js",
  "tesseract-core-relaxedsimd-lstm.wasm",
  "tesseract-core-relaxedsimd-lstm.wasm.js",
];

mkdirSync(coreRoot, { recursive: true });
mkdirSync(languageRoot, { recursive: true });

copyFileSync(
  resolve("node_modules/tesseract.js/dist/worker.min.js"),
  resolve(publicRoot, "worker.min.js")
);

for (const asset of coreAssets) {
  copyFileSync(resolve(coreSource, asset), resolve(coreRoot, asset));
}

copyFileSync(languageSource, resolve(languageRoot, "eng.traineddata.gz"));