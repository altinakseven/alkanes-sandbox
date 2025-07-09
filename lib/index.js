"use strict";
// Chadson v69.0.0
//
// This script provides a function to extract metadata from Alkane WASM modules.
// It loads a WASM binary, provides the necessary host function imports,
// and calls the `__meta` export to retrieve JSON metadata.
//
// To-Do:
// 1. [x] Implement host function stubs.
// 2. [x] Implement the main `getAlkaneMeta` function.
// 3. [x] Read the returned pointer and length to get the JSON data.
// 4. [ ] Add comprehensive tests.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Context = void 0;
exports.getAlkaneMeta = getAlkaneMeta;
exports.fuzzAlkaneAll = fuzzAlkaneAll;
exports.fuzzAlkane = fuzzAlkane;
/**
 * Creates a set of stub functions that mimic the Alkane runtime environment.
 * These are required to instantiate the WASM module but don't need full functionality
 * for metadata extraction.
 * @returns {object} - An object containing the host function stubs.
 */
function createHostStubs(contextBuffer) {
    const log = (ptr) => {
        // In a real implementation, you would read the string from memory.
        // For meta-extraction, this is likely not called.
        console.log(`WASM log called with ptr: ${ptr}`);
    };
    const env = {
        abort: () => { throw new Error("abort called"); },
        __request_context: () => contextBuffer.length,
        __load_context: (ptr) => {
            if (!env.memory) {
                throw new Error("__load_context called before memory was set");
            }
            const memoryView = new Uint8Array(env.memory.buffer);
            memoryView.set(contextBuffer, ptr);
        },
        __request_storage: () => 0,
        __load_storage: () => { },
        __height: () => { },
        __log: log,
        __balance: () => { },
        __sequence: () => { },
        __fuel: () => { },
        __returndatacopy: () => { },
        __request_transaction: () => 0,
        __load_transaction: () => { },
        __request_block: () => 0,
        __load_block: () => { },
        __call: () => -1,
        __delegatecall: () => -1,
        __staticcall: () => -1,
    };
    return { env };
}
/**
 * @param {string} wasmHex - The 0x-prefixed hex string of the WASM bytecode.
 * @returns {Promise<object>} - A promise that resolves to the parsed JSON metadata.
 */
async function getAlkaneMeta(wasmHex) {
    if (!wasmHex.startsWith('0x')) {
        throw new Error("WASM hex string must be 0x-prefixed.");
    }
    const wasmBytes = Buffer.from(wasmHex.substring(2), 'hex');
    const importObject = createHostStubs(new Uint8Array()); // Empty default
    const { instance } = await WebAssembly.instantiate(wasmBytes, importObject);
    const memory = instance.exports.memory;
    if (!memory) {
        throw new Error("WASM module does not export 'memory'.");
    }
    const metaFunc = instance.exports.__meta;
    if (typeof metaFunc !== 'function') {
        throw new Error("WASM module does not export a function `__meta`.");
    }
    const metaPtr = metaFunc();
    const dataView = new DataView(memory.buffer);
    const length = dataView.getUint32(metaPtr - 4, true); // true for little-endian
    if (length === 0) {
        return {};
    }
    const metaBytes = new Uint8Array(memory.buffer, metaPtr, length);
    const metaString = new TextDecoder('utf-8').decode(metaBytes);
    return JSON.parse(metaString);
}
function serializeU128(value) {
    const buffer = new ArrayBuffer(16);
    const view = new DataView(buffer);
    view.setBigUint64(0, value, true);
    view.setBigUint64(8, 0n, true);
    return new Uint8Array(buffer);
}
class AlkaneId {
    constructor(block = 0n, tx = 0n) {
        this.block = block;
        this.tx = tx;
    }
    serialize() {
        const blockBytes = serializeU128(this.block);
        const txBytes = serializeU128(this.tx);
        const result = new Uint8Array(32);
        result.set(blockBytes, 0);
        result.set(txBytes, 16);
        return result;
    }
}
class AlkaneTransfer {
    constructor(id = new AlkaneId(), value = 0n) {
        this.id = id;
        this.value = value;
    }
    serialize() {
        const idBytes = this.id.serialize();
        const valueBytes = serializeU128(this.value);
        const result = new Uint8Array(48);
        result.set(idBytes, 0);
        result.set(valueBytes, 32);
        return result;
    }
}
class AlkaneTransferParcel {
    constructor(transfers = []) {
        this.transfers = transfers;
    }
    serialize() {
        const lenBytes = serializeU128(BigInt(this.transfers.length));
        const transferBytes = this.transfers.map(t => t.serialize());
        const totalLength = lenBytes.length + transferBytes.reduce((sum, b) => sum + b.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        result.set(lenBytes, offset);
        offset += lenBytes.length;
        for (const bytes of transferBytes) {
            result.set(bytes, offset);
            offset += bytes.length;
        }
        return result;
    }
}
class Context {
    constructor() {
        this.myself = new AlkaneId();
        this.caller = new AlkaneId();
        this.vout = 0n;
        this.incoming_alkanes = new AlkaneTransferParcel();
        this.inputs = [];
    }
    serialize() {
        const myselfBytes = this.myself.serialize();
        const callerBytes = this.caller.serialize();
        const voutBytes = serializeU128(this.vout);
        const incomingAlkanesBytes = this.incoming_alkanes.serialize();
        const inputsBytes = this.inputs.map(serializeU128);
        const totalLength = myselfBytes.length + callerBytes.length + voutBytes.length + incomingAlkanesBytes.length + inputsBytes.reduce((sum, b) => sum + b.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        result.set(myselfBytes, offset);
        offset += myselfBytes.length;
        result.set(callerBytes, offset);
        offset += callerBytes.length;
        result.set(voutBytes, offset);
        offset += voutBytes.length;
        result.set(incomingAlkanesBytes, offset);
        offset += incomingAlkanesBytes.length;
        for (const bytes of inputsBytes) {
            result.set(bytes, offset);
            offset += bytes.length;
        }
        return result;
    }
}
exports.Context = Context;
async function fuzzAlkaneAll(wasmHex, options = {}) {
    const { startOpcode = 0, endOpcode = 255 } = options;
    const results = [];
    for (let opcode = startOpcode; opcode <= endOpcode; opcode++) {
        const context = new Context();
        // Provide a default u128 parameter for functions that might need one.
        context.inputs = [BigInt(opcode), 1n];
        const result = await fuzzAlkane(wasmHex, context);
        results.push({ opcode, result });
    }
    // Analyze results to find the most common error
    const errorCounts = new Map();
    for (const { result } of results) {
        if (!result.success && result.error) {
            const count = errorCounts.get(result.error) || 0;
            errorCounts.set(result.error, count + 1);
        }
    }
    let mostCommonError;
    let maxCount = 0;
    for (const [error, count] of errorCounts.entries()) {
        if (count > maxCount) {
            maxCount = count;
            mostCommonError = error;
        }
    }
    // Filter out the common error to find implemented opcodes
    const implementedOpcodes = results.filter(({ result }) => {
        return result.success || (result.error !== mostCommonError);
    });
    return {
        totalOpcodesTested: (endOpcode - startOpcode) + 1,
        mostCommonError,
        implementedOpcodes,
    };
}
async function fuzzAlkane(wasmHex, context) {
    const wasmBytes = Buffer.from(wasmHex.substring(2), 'hex');
    const hostCalls = [];
    const importObject = createHostStubs(context.serialize());
    // Wrap host functions to intercept calls
    const env = importObject.env;
    for (const key in env) {
        if (typeof env[key] === 'function') {
            const originalFunc = env[key];
            env[key] = (...args) => {
                hostCalls.push({ functionName: key, parameters: args });
                return originalFunc(...args);
            };
        }
    }
    const { instance } = await WebAssembly.instantiate(wasmBytes, importObject);
    const memory = instance.exports.memory;
    if (!memory) {
        throw new Error("WASM module does not export 'memory'.");
    }
    importObject.env.memory = memory;
    const executeFunc = instance.exports.__execute;
    if (typeof executeFunc !== 'function') {
        throw new Error("WASM module does not export a function `__execute`.");
    }
    try {
        const returnValue = executeFunc();
        const returnData = new Uint8Array(); // Simplified for now
        return { success: true, returnValue, returnData, hostCalls };
    }
    catch (e) {
        return { success: false, error: e.message, returnData: new Uint8Array(), hostCalls };
    }
}
