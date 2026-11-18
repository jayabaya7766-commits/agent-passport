# Deploy checklist (for the parent agent)

Agent Passport is built and tested but **NOT deployed**. Deploy only after the
user has approved, topped up gas, and enabled Developer Mode.

## 1. Preconditions

- [ ] User approved the deploy (explicit yes for this transaction).
- [ ] Wallet topped up: deploy costs **1,313,318 gas** (measured). At 1–3 gwei
      that is ~0.0013–0.004 BNB. Top up **~0.005 BNB** to be safe (deploy +
      a test mint + margin). The wallet currently holds ~0.00042 BNB — not
      enough.
- [ ] Developer Mode ON in the Binance app (required for any baw transaction).
- [ ] Site is live at https://jayabaya7766-commits.github.io/agent-passport/
      (metadata must be reachable BEFORE deploy, because the base URI is a
      constructor argument).

## 2. Deploy

- Contract: `contracts/AgentPassport.sol`, compiled with solc **0.8.24**,
  optimizer enabled, runs **200**, evmVersion **paris**.
  Bytecode: `artifacts/contracts/AgentPassport.sol/AgentPassport.json`
  (run `npx hardhat compile` to refresh).
- Constructor arguments (in order):
  1. `_agentIdRegistry` = `0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F`
     (SPACE ID Agent ID registry on BSC — verify on BscScan before deploying)
  2. `_initialBaseURI` = `https://jayabaya7766-commits.github.io/agent-passport/metadata/`
- The deployer becomes the contract `owner` (can only call `setBaseURI`).
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
