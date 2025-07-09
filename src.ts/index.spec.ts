// Chadson v69.0.0
//
// E2E tests for the Alkanes meta runner.

import * as fs from 'fs/promises';
import * as path from 'path';
import * as assert from 'assert';
import { getAlkaneMeta, fuzzAlkane, fuzzAlkaneAll, Context } from './index';
process.env.NODE_ENV = "debug";

interface Method {
  name: string;
  opcode: number;
}

describe('getAlkaneMeta', () => {
  before(function() {
    if (process.env.NODE_ENV === 'debug') {
      console.log('--- getAlkaneMeta tests ---');
    }
  });

  afterEach(function() {
    if (process.env.NODE_ENV === 'debug' && this.currentTest?.state === 'passed') {
      console.log(`  ✓ ${this.currentTest.title} passed`);
    }
  });

  it('should extract metadata from a valid WASM hex', async () => {
    // Load the compiled test WASM
    const wasmPath = path.resolve(process.cwd(), 'test-wasm/target/wasm32-unknown-unknown/release/test_wasm.wasm');
    const wasmBuffer = await fs.readFile(wasmPath);
    const wasmHex = '0x' + wasmBuffer.toString('hex');

    if (process.env.NODE_ENV === 'debug') {
      console.log('  Input WASM Hex (first 100 chars):', wasmHex.substring(0, 100) + '...');
    }

    // Run the function
    const metadata = await getAlkaneMeta(wasmHex);

    if (process.env.NODE_ENV === 'debug') {
      console.log('  Output Metadata:', JSON.stringify(metadata, null, 2));
    }

    // Assertions
    assert.strictEqual(metadata.contract, 'MetaAlkane', 'Test failed: Incorrect name');
    assert.ok(Array.isArray(metadata.methods), 'Test failed: methods is not an array');
    assert.strictEqual(metadata.methods.length, 2, 'Test failed: Incorrect number of methods');
    
    const initializeMethod = metadata.methods.find((m: Method) => m.name === 'initialize');
    assert.ok(initializeMethod, 'Method "initialize" not found');
    assert.strictEqual(initializeMethod.opcode, 0, 'Test failed: Incorrect opcode for initialize');

    const mintMethod = metadata.methods.find((m: Method) => m.name === 'mint');
    assert.ok(mintMethod, 'Method "mint" not found');
    assert.strictEqual(mintMethod.opcode, 77, 'Test failed: Incorrect opcode for mint');
  }).timeout(10000);
});

describe('fuzzAlkane', () => {
  let wasmHex: string;

  before(async function() {
    if (process.env.NODE_ENV === 'debug') {
      console.log('\n--- fuzzAlkane tests ---');
    }
    this.timeout(10000);
    const wasmPath = path.resolve(process.cwd(), 'test-wasm/target/wasm32-unknown-unknown/release/test_wasm.wasm');
    const wasmBuffer = await fs.readFile(wasmPath);
    wasmHex = '0x' + wasmBuffer.toString('hex');
  });

  afterEach(function() {
    if (process.env.NODE_ENV === 'debug' && this.currentTest?.state === 'passed') {
      console.log(`  ✓ ${this.currentTest.title} passed`);
    }
  });

  it('should execute a valid opcode (Initialize)', async () => {
    const context = new Context();
    context.inputs = [0n];
    if (process.env.NODE_ENV === 'debug') {
      console.log('  Input Context:', JSON.stringify(context, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));
    }
    const result = await fuzzAlkane(wasmHex, context);
    if (process.env.NODE_ENV === 'debug') {
      console.log('  Output Result:', JSON.stringify(result, null, 2));
    }
    assert.strictEqual(result.success, true, 'Execution should succeed for Initialize');
  });

  it('should execute another valid opcode (Mint)', async () => {
    const context = new Context();
    context.inputs = [77n, 1n];
    if (process.env.NODE_ENV === 'debug') {
      console.log('  Input Context:', JSON.stringify(context, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));
    }
    const result = await fuzzAlkane(wasmHex, context);
    if (process.env.NODE_ENV === 'debug') {
      console.log('  Output Result:', JSON.stringify(result, null, 2));
    }
    assert.strictEqual(result.success, true, 'Execution should succeed for Mint');
  });

  it('should return an error for an invalid opcode', async () => {
    const context = new Context();
    context.inputs = [999n];
    if (process.env.NODE_ENV === 'debug') {
      console.log('  Input Context:', JSON.stringify(context, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));
    }
    const result = await fuzzAlkane(wasmHex, context);
    if (process.env.NODE_ENV === 'debug') {
      console.log('  Output Result:', JSON.stringify(result, null, 2));
    }
    assert.strictEqual(result.success, false, 'Execution should fail for invalid opcode');
    assert.strictEqual(result.error, 'abort called', 'Error message should be "abort called"');
  });
});

describe('fuzzAlkaneAll', () => {
  let wasmHex: string;

  before(async function() {
    this.timeout(10000);
    const wasmPath = path.resolve(process.cwd(), 'test-wasm/target/wasm32-unknown-unknown/release/test_wasm.wasm');
    const wasmBuffer = await fs.readFile(wasmPath);
    wasmHex = '0x' + wasmBuffer.toString('hex');
  });

  it('should identify implemented opcodes and filter out common errors', async function() {
    this.timeout(20000); // Fuzzing can be slow
    const results = await fuzzAlkaneAll(wasmHex, { startOpcode: 0, endOpcode: 100 });

    assert.strictEqual(results.totalOpcodesTested, 101, 'Incorrect number of opcodes tested');
    assert.strictEqual(results.mostCommonError, 'abort called', 'Incorrect common error identified');
    
    const implementedOpcodes = results.implementedOpcodes.map(r => r.opcode);
    assert.deepStrictEqual(implementedOpcodes.sort((a, b) => a - b), [0, 77], 'Incorrect set of implemented opcodes');
  });
});
