# Deploy checklist (for the parent agent)

Agent Passport is built and tested but **NOT deployed**. Deploy only after the
user has approved, topped up gas, and enabled Developer Mode.

## 1. Preconditions

- [ ] User approved the deploy (explicit yes for this transaction).
- [ ] Gas: factory deploy costs **1,317,399 gas** (measured locally via the
      factory e2e). At the live BSC gas price of 0.05 gwei that is
      ~0.000066 BNB. The wallet holds ~0.00042 BNB — enough, NO top-up
      needed (the earlier ~0.005 BNB figure was a pessimistic 3-gwei
      estimate; corrected 2026-11-18 22:51 WIB).
- [ ] Developer Mode ON in the Binance app (required for any baw transaction).
- [ ] Site is live at https://jayabaya7766-commits.github.io/agent-passport/
      (metadata must be reachable BEFORE deploy, because the base URI is a
      constructor argument).

## 2. Deploy (via CREATE2 factory — updated 2026-11-18)

`baw` cannot deploy contracts directly (no deploy command; `contract-call
preview` requires `--to`). Deployment goes through the canonical Arachnid
deterministic deployment proxy (CREATE2 factory) at
`0x4e59b44847b379578588920cA78FbF26c0B4956C` (EIP-7997; on-chain code
verified byte-identical on BSC). The factory is a raw proxy: a plain
contract call with calldata = salt (32 bytes) ++ initCode, value 0.

- Contract: `contracts/AgentPassport.sol`, compiled with solc **0.8.24**,
  optimizer enabled, runs **200**, evmVersion **paris**.
  Bytecode: `artifacts/contracts/AgentPassport.sol/AgentPassport.json`
  (run `npx hardhat compile` to refresh).
- Constructor arguments (in order):
  1. `_agentIdRegistry` = `0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F`
     (SPACE ID Agent ID registry on BSC — verify on BscScan before deploying)
  2. `_initialBaseURI` = `https://jayabaya7766-commits.github.io/agent-passport/metadata/`
  3. `_owner` = `0x38F3F94BFC3775Afb3dDED1ceB523A86157E616f` (user's Agentic
     Wallet — the owner is a constructor parameter because the factory, not
     the user, is `msg.sender` at construction)
- Salt: `0x68bcbb05d2769831408a69db9ed7af20356bb8d4d309791efddd27effdf9c0c9`
  (= keccak256("agent-passport-v1")); exact calldata in `factory-deploy.json`.
- Expected CREATE2 address: `0x6C42273df5AF1dF73C8140b76D5402B466692f55`
  (verified empty on BSC mainnet before deploying; proven by
  `scripts/factory-e2e.js`, PASS).
- Deploy with the user's own wallet via the normal preview → execute flow
  (one-line summary + clean simulation first, per the safety rails). The
  deploy transaction itself carries **value 0**.
- Record the deployed address and the deployment block number.

## 3. Post-deploy

1. **Update the site config**: set `contractAddress` and `deployBlock` in
   `site/config.js`, then publish:
   ```sh
   ./scripts/publish-pages.sh   # syncs site/ to the gh-pages branch
   ```
   Wait ~1–2 min, then confirm the live site shows the mint UI.
2. **Verify on BscScan** — see `docs/VERIFICATION.md`.
3. **Smoke-test the mint** from the user's wallet (it holds Agent ID
   leofergodeo.ai, so it can mint Passport #1). Confirm `hasMinted`,
   `passportOf`, and `tokenURI(1)` read back correctly.
4. **Hackathon form**: the user fills it himself with the BscScan contract
   link + the site URL.

## 4. If the base URI ever needs changing

Only the owner can call `setBaseURI(newBaseURI)` (value 0). This is the only
owner power. It does not affect existing tokens' ownership — only where their
metadata is read from.
