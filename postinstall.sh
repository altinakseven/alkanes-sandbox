#!/bin/bash
set -e

# Check if rustup is installed
if ! command -v rustup &> /dev/null
then
    echo "rustup could not be found, installing..."
    # Install rustup non-interactively
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    # Add rustup to the current shell's PATH
    source "$HOME/.cargo/env"
else
    echo "rustup is already installed."
fi

# Navigate to the test-wasm directory and build
echo "Cleaning and building test-wasm..."
(cd test-wasm && cargo clean && cargo build --release)

echo "postinstall script finished."