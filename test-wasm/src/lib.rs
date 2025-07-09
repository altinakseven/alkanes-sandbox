// Chadson v69.0.0
//
// THIS FILE IS THE CANONICAL IMPLEMENTATION FOR A TEST WASM.
// DO NOT MODIFY THIS FILE.
// The TypeScript host implementation must be adapted to correctly
// read the metadata from this WASM module as-is.

#[allow(unused_imports)]
use alkanes_runtime::{declare_alkane, message::MessageDispatch, runtime::AlkaneResponder};
use metashrew_support::compat::to_arraybuffer_layout;
use anyhow::{anyhow, Result};
use alkanes_support::response::CallResponse;

#[derive(Default)]
pub struct MetaAlkane;

impl MetaAlkane {
  fn initialize(&self) -> Result<CallResponse> {
    Ok(CallResponse::default())
  }
  fn mint(&self, _amount: u128) -> Result<CallResponse> {
    Ok(CallResponse::default())
  }
  fn fallback(&self) -> Result<CallResponse> {
    Err(anyhow!("unimplemented"))
  }
}

#[derive(MessageDispatch)]
enum MetaAlkaneMessage {
  #[opcode(0)]
  Initialize,
  #[opcode(77)]
  Mint {
    amount: u128
  }
}

impl AlkaneResponder for MetaAlkane {}

declare_alkane! {
    impl AlkaneResponder for MetaAlkane {
        type Message = MetaAlkaneMessage;
    }
}
