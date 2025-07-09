// setup.js
// This script prepares the environment for testing by ensuring Rust is installed
// and the test WASM is compiled.

const { execSync } = require('child_process');
const os = require('os');

function commandExists(command) {
  try {
    const checkCommand = os.platform() === 'win32' ? `where ${command}` : `command -v ${command}`;
    execSync(checkCommand, { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

console.log('Running setup script...');

// 1. Check for and install Rust if necessary
if (!commandExists('rustup')) {
  console.log('rustup not found, installing...');
  try {
    if (os.platform() === 'win32') {
      console.error('Automatic rustup installation is not supported on Windows. Please install it manually from https://rustup.rs/');
      process.exit(1);
    } else {
      execSync("curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y", { stdio: 'inherit' });
    }
  } catch (e) {
    console.error('Failed to install rustup:', e);
    process.exit(1);
  }
} else {
  console.log('rustup is already installed.');
}

// 2. Build the test WASM
console.log('Building test-wasm...');
try {
  const cargoPath = os.platform() === 'win32' ? `${os.homedir()}\\.cargo\\bin\\cargo` : `${os.homedir()}/.cargo/bin/cargo`;
  execSync(`"${cargoPath}" build --release`, { cwd: './test-wasm', stdio: 'inherit' });
} catch (e) {
  console.error('Failed to build test-wasm:', e);
  process.exit(1);
}

console.log('Setup script finished successfully.');