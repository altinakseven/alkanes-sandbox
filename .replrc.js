// .replrc.js for nice-repl
// This file preloads variables and functions into the REPL environment.

// Use 'var' for global availability in the REPL
var fs = require('fs');
var path = require('path');

console.log('Loading .replrc.js...');

// --- Preload WASM ---
var wasmPath = path.resolve(process.cwd(), 'test-wasm/target/wasm32-unknown-unknown/release/test_wasm.wasm');
var wasmHex;
try {
  var wasmBuffer = fs.readFileSync(wasmPath);
  wasmHex = '0x' + wasmBuffer.toString('hex');
  console.log('Successfully loaded WASM from:', wasmPath);
} catch (e) {
  console.error('Failed to load WASM file:', e.message);
  console.error('Please ensure the WASM has been compiled.');
  wasmHex = null;
}


// --- Preload Functions and Classes ---
// The main module is the compiled output from 'src.ts/index.ts'
var alkanesMetaRunner = require('./lib/index.js');
var getAlkaneMeta = alkanesMetaRunner.getAlkaneMeta;
var fuzzAlkane = alkanesMetaRunner.fuzzAlkane;
var fuzzAlkaneAll = alkanesMetaRunner.fuzzAlkaneAll;
var Context = alkanesMetaRunner.Context;

console.log('Preloaded: wasmHex, getAlkaneMeta, fuzzAlkane, fuzzAlkaneAll, Context');