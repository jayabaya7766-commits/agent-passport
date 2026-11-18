# BscScan verification

Use the flattened single-file source with these **exact** settings. Any
difference (compiler version, optimizer, runs, EVM version) fails verification.

## Settings

| Field | Value |
|---|---|
| Source file | `flattened/AgentPassport.flattened.sol` (1,615 lines, 1 SPDX line) |
| Compiler | Solidity **0.8.24** (exact — the source pins `pragma solidity 0.8.24`) |
| Optimization | Enabled, runs **200** |
| EVM version | **paris** |
| License | MIT |
| Contract name | `AgentPassport` |

## Constructor arguments (ABI-encoded)

Paste this into the "Constructor Arguments" field (or let the form
auto-detect them — if it asks, this is the value):

```
0x00000000000000000000000060b9262456de011f7d15a54cdd8c48baaa8b022f0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000003f68747470733a2f2f6a61796162617961373736362d636f6d6d6974732e6769746875622e696f2f6167656e742d70617373706f72742f6d657461646174612f00
```

Decoded: `address 0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F`,
`string "https://jayabaya7766-commits.github.io/agent-passport/metadata/"`.

Regenerate any time with:

```sh
npx hardhat run scripts/prepare-deploy.js
```

## Steps (BscScan web form)

1. Open the deployed contract on BscScan → **Contract** tab → **Verify and
   Publish**.
2. Compiler Type: **Solidity (Single file)**. Compiler Version: **v0.8.24+commit.e11b9ed9**
   (the exact 0.8.24 build Hardhat used — check `npx hardhat compile --force`
   output if unsure). Open Source License Type: **MIT**.
3. Tick **Optimization: Yes**, runs **200**. EVM Version: **paris** (if the
   form offers an EVM selector; older forms default it — leave default only
   if paris is not offered and verification still passes).
4. Paste the entire contents of `flattened/AgentPassport.flattened.sol`.
5. Paste the constructor arguments above.
6. Submit. On success the contract shows a green checkmark and the source
   becomes public — this is what the hackathon form requires.

## Alternative: hardhat-verify

`@nomicfoundation/hardhat-verify` is installed (via the toolbox). With a
BscScan API key in the environment, verification can also run from the CLI:

```sh
npx hardhat verify --network bsc <DEPLOYED_ADDRESS> \
  0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F \
  "https://jayabaya7766-commits.github.io/agent-passport/metadata/"
```

Note: the `bsc` network in `hardhat.config.js` has no accounts configured on
purpose — the CLI path needs a funded deployer key, which only the parent
agent handles.
