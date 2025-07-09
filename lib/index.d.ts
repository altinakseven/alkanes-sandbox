/**
 * Creates a set of stub functions that mimic the Alkane runtime environment.
 * These are required to instantiate the WASM module but don't need full functionality
 * for metadata extraction.
 * @param {WebAssembly.Memory} memory - The WASM instance's memory.
 * @returns {object} - An object containing the host function stubs.
 */
declare function createHostStubs(memory: any): {
    env: {
        abort: () => never;
        __request_context: () => number;
        __load_context: () => number;
        __request_storage: () => number;
        __load_storage: () => number;
        __height: () => void;
        __log: (ptr: any) => void;
        __balance: () => void;
        __sequence: () => void;
        __fuel: () => void;
        __returndatacopy: () => void;
        __request_transaction: () => number;
        __load_transaction: () => void;
        __request_block: () => number;
        __load_block: () => void;
        __call: () => number;
        __delegatecall: () => number;
        __staticcall: () => number;
    };
};
/**
 * @param {string} wasmHex - The 0x-prefixed hex string of the WASM bytecode.
 * @returns {Promise<object>} - A promise that resolves to the parsed JSON metadata.
 */
declare function getAlkaneMeta(wasmHex: any): Promise<any>;
