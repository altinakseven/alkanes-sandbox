# Alkanes Sandbox

This is a TypeScript library for interacting with and analyzing Alkanes-compatible WebAssembly (WASM) modules. It provides utilities to extract metadata, fuzz opcodes, and discover implemented functionality directly from WASM bytecode.

## Features

- **Metadata Extraction**: Parses WASM modules to extract contract metadata, including name, version, and method signatures.
- **Opcode Fuzzing**: Systematically tests individual opcodes to determine their behavior.
- **Automated Opcode Discovery**: A high-level fuzzing function that analyzes a range of opcodes to identify which ones are implemented.
- **REPL Environment**: An interactive REPL for hands-on testing and exploration.
- **Automated Setup**: A `pretest` script handles the Rust and WASM compilation, ensuring a smooth setup process before tests are run.

## Installation

1.  Clone the repository.
2.  Run `pnpm install`.

```bash
git clone <repository-url>
cd alkanes-sandbox
pnpm install
```

The WASM module required for testing is not built automatically on install. It is built by the `pretest` script before the tests are run.

## Usage

### Core Functions

The library exports three main functions from `src/index.ts`:

-   `getAlkaneMeta(wasmHex: string): Promise<any>`: Extracts metadata from a WASM module provided as a hex string.
-   `fuzzAlkane(wasmHex: string, context: Context): Promise<ExecutionResult>`: Executes the WASM module with a specific context, allowing for targeted testing of individual opcodes and their parameters.
-   `fuzzAlkaneAll(wasmHex: string, options: { startOpcode?: number, endOpcode?: number }): Promise<any>`: Fuzzes a range of opcodes to automatically discover which ones are implemented.

### Interactive REPL

For interactive testing, you can use the pre-configured REPL environment.

1.  Run the REPL:
    ```bash
    pnpm nice-repl
    ```
2.  The `.replrc.js` file will automatically load the compiled test WASM (`wasmHex`) and all the core functions (`getAlkaneMeta`, `fuzzAlkane`, `fuzzAlkaneAll`, `Context`) into the REPL's global scope.

**Example REPL Session:**

```javascript
// Get the metadata from the preloaded WASM
await getAlkaneMeta(wasmHex)
// Expected output: { contract: 'MetaAlkane', methods: [...] }

// Fuzz a single opcode (e.g., Initialize with opcode 0)
var context = new Context()
context.inputs = [0n]
await fuzzAlkane(wasmHex, context)
// Expected output: { success: true, ... }

// Discover all implemented opcodes between 0 and 100
await fuzzAlkaneAll(wasmHex, { startOpcode: 0, endOpcode: 100 })
// Expected output: { totalOpcodesTested: 101, mostCommonError: 'abort called', implementedOpcodes: [ { opcode: 0, ... }, { opcode: 77, ... } ] }
```

## Testing

The project includes a comprehensive test suite. The `pretest` script will automatically handle the setup process.

-   Run all tests:
    ```bash
    pnpm test