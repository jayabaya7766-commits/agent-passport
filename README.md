# Agent Passport

A free soulbound badge NFT for Agent ID holders on BNB Chain — built for the
[Agent ID Hackathon](https://www.binance.com/en/support/announcement/detail/95f5dbe0ea674a48a739b59e046648bf)
(Binance Wallet × BNB Chain). Project submissions close **9 December 2026, 08:00 UTC**.

- **Free mint** (gas only), exactly **1 Passport per wallet**
- **Gated** on holding a SPACE ID Agent ID
- **Soulbound**: transfers and burns revert; only minting works
- **Max supply** 100,000 · token IDs sequential from 1
- **No funds ever touch the contract**: no payable function, no fee, no tax

Live site: https://jayabaya7766-commits.github.io/agent-passport/

## Contract

`contracts/AgentPassport.sol` — ERC-721 `Agent Passport` (`APASS`), Solidity
0.8.24, OpenZeppelin Contracts 5.0.2.

| Item | Value |
|---|---|
| Agent ID registry (BSC) | `0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F` |
| Mint gate | `registry.balanceOf(msg.sender) > 0` |
| Mint price | 0 (not payable — sending BNB reverts) |
| Max supply | 100,000 |
| tokenURI | `baseURI + tokenId + ".json"` |
| Metadata base URI | `https://jayabaya7766-commits.github.io/agent-passport/metadata/` |
| Deploy gas (measured) | 1,313,318 gas |

### Owner powers — disclosed (hackathon red lines)

The owner is the deployer. The owner can **only** call `setBaseURI()` (change
the metadata base URI). There is **no** pause, **no** freeze, **no** tax,
**no** mint fee, **no** withdraw, **no** mint-to, and **no** ownership
transfer. The contract holds no funds and cannot move anyone's Passport.

### Build & test

```sh
npm install
npx hardhat compile
npx hardhat test        # 8 tests, all passing
```

Tests prove: mint reverts without an Agent ID; mint succeeds with one; a
second mint reverts; transfers revert (soulbound); only the owner can
`setBaseURI`. A mock Agent ID registry (`contracts/mocks/MockAgentID.sol`)
stands in for the real registry — no mainnet fork needed.

## Layout

| Path | What it is |
|---|---|
| `contracts/` | `AgentPassport.sol` + test mock |
| `test/` | Hardhat test suite |
| `flattened/` | Single-file source for BscScan verification |
| `site/` | Static frontend (GitHub Pages) + `metadata/` JSONs 1–100 |
| `docs/` | `DEPLOY.md` (parent's deploy checklist), `VERIFICATION.md` (BscScan) |
| `scripts/` | `prepare-deploy.js` (gas/args), `generate-metadata.js`, `publish-pages.sh` |

## Status

- [x] Contract written, compiled, tested (8/8)
- [x] Flattened source + verification settings ready
- [x] Site + metadata live on GitHub Pages
- [ ] **Deploy** (parent's job — needs gas top-up + DevMode; see `docs/DEPLOY.md`)
- [ ] BscScan verification (see `docs/VERIFICATION.md`)
- [ ] Hackathon form (filled by the user himself)

## Safety

No QR-code login, no session storage, no prompts bypassing user confirmation,
no seed/key/credential collection, no unauthorized transfers, no unlimited
approvals, no promised returns. The site states plainly that minting costs
gas and the badge carries no monetary value.
