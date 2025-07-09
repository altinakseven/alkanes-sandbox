"use strict";
// Chadson v69.0.0
//
// E2E tests for the Alkanes meta runner.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const assert = __importStar(require("assert"));
const index_1 = require("./index");
process.env.NODE_ENV = "debug";
describe('getAlkaneMeta', () => {
    before(function () {
        if (process.env.NODE_ENV === 'debug') {
            console.log('--- getAlkaneMeta tests ---');
        }
    });
    afterEach(function () {
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
        const metadata = await (0, index_1.getAlkaneMeta)(wasmHex);
        if (process.env.NODE_ENV === 'debug') {
            console.log('  Output Metadata:', JSON.stringify(metadata, null, 2));
        }
        // Assertions
        assert.strictEqual(metadata.contract, 'MetaAlkane', 'Test failed: Incorrect name');
        assert.ok(Array.isArray(metadata.methods), 'Test failed: methods is not an array');
        assert.strictEqual(metadata.methods.length, 2, 'Test failed: Incorrect number of methods');
        const initializeMethod = metadata.methods.find((m) => m.name === 'initialize');
        assert.ok(initializeMethod, 'Method "initialize" not found');
        assert.strictEqual(initializeMethod.opcode, 0, 'Test failed: Incorrect opcode for initialize');
        const mintMethod = metadata.methods.find((m) => m.name === 'mint');
        assert.ok(mintMethod, 'Method "mint" not found');
        assert.strictEqual(mintMethod.opcode, 77, 'Test failed: Incorrect opcode for mint');
    }).timeout(10000);
});
describe('fuzzAlkane', () => {
    let wasmHex;
    before(async function () {
        if (process.env.NODE_ENV === 'debug') {
            console.log('\n--- fuzzAlkane tests ---');
        }
        this.timeout(10000);
        const wasmPath = path.resolve(process.cwd(), 'test-wasm/target/wasm32-unknown-unknown/release/test_wasm.wasm');
        const wasmBuffer = await fs.readFile(wasmPath);
        wasmHex = '0x' + wasmBuffer.toString('hex');
    });
    afterEach(function () {
        if (process.env.NODE_ENV === 'debug' && this.currentTest?.state === 'passed') {
            console.log(`  ✓ ${this.currentTest.title} passed`);
        }
    });
    it('should execute a valid opcode (Initialize)', async () => {
        const context = new index_1.Context();
        context.inputs = [0n];
        if (process.env.NODE_ENV === 'debug') {
            console.log('  Input Context:', JSON.stringify(context, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));
        }
        const result = await (0, index_1.fuzzAlkane)(wasmHex, context);
        if (process.env.NODE_ENV === 'debug') {
            console.log('  Output Result:', JSON.stringify(result, null, 2));
        }
        assert.strictEqual(result.success, true, 'Execution should succeed for Initialize');
    });
    it('should execute another valid opcode (Mint)', async () => {
        const context = new index_1.Context();
        context.inputs = [77n, 1n];
        if (process.env.NODE_ENV === 'debug') {
            console.log('  Input Context:', JSON.stringify(context, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));
        }
        const result = await (0, index_1.fuzzAlkane)(wasmHex, context);
        if (process.env.NODE_ENV === 'debug') {
            console.log('  Output Result:', JSON.stringify(result, null, 2));
        }
        assert.strictEqual(result.success, true, 'Execution should succeed for Mint');
    });
    it('should return an error for an invalid opcode', async () => {
        const context = new index_1.Context();
        context.inputs = [999n];
        if (process.env.NODE_ENV === 'debug') {
            console.log('  Input Context:', JSON.stringify(context, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));
        }
        const result = await (0, index_1.fuzzAlkane)(wasmHex, context);
        if (process.env.NODE_ENV === 'debug') {
            console.log('  Output Result:', JSON.stringify(result, null, 2));
        }
        assert.strictEqual(result.success, false, 'Execution should fail for invalid opcode');
        assert.strictEqual(result.error, 'abort called', 'Error message should be "abort called"');
    });
});
describe('fuzzAlkaneAll', () => {
    let wasmHex;
    before(async function () {
        this.timeout(10000);
        const wasmPath = path.resolve(process.cwd(), 'test-wasm/target/wasm32-unknown-unknown/release/test_wasm.wasm');
        const wasmBuffer = await fs.readFile(wasmPath);
        wasmHex = '0x' + wasmBuffer.toString('hex');
    });
    it('should identify implemented opcodes and filter out common errors', async function () {
        this.timeout(20000); // Fuzzing can be slow
        const results = await (0, index_1.fuzzAlkaneAll)(wasmHex, { startOpcode: 0, endOpcode: 100 });
        assert.strictEqual(results.totalOpcodesTested, 101, 'Incorrect number of opcodes tested');
        assert.strictEqual(results.mostCommonError, 'abort called', 'Incorrect common error identified');
        const implementedOpcodes = results.implementedOpcodes.map(r => r.opcode);
        assert.deepStrictEqual(implementedOpcodes.sort((a, b) => a - b), [0, 77], 'Incorrect set of implemented opcodes');
    });
});
