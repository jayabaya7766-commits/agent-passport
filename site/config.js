// Agent Passport — site configuration.
// The contract address is filled in by the parent agent AFTER deployment
// (see docs/DEPLOY.md). Until then the mint UI shows "not deployed yet".
window.APASS_CONFIG = {
  chainId: 56,
  chainName: "BNB Smart Chain",
  chainRpc: "https://bsc-dataseed.bnbchain.org",
  chainExplorer: "https://bscscan.com",

  // Deployed 2026-11-18 via the Arachnid CREATE2 factory (tx
  // 0x75102861128020f404b932e2f85e2086cff54be190ec480d87d4647f1d26cf4c).
  contractAddress: "0x6C42273df5AF1dF73C8140b76D5402B466692f55",
  // The block the contract was deployed in.
  // The leaderboard scans mint events from this block forward.
  deployBlock: 134339070,

  // SPACE ID Agent ID registry (ERC-721) on BNB Chain — from the official
  // Binance Agent ID Hackathon announcement.
  agentIdRegistry: "0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F",

  // Public BSC RPCs tried in order for read-only calls.
  rpcUrls: [
    "https://bsc-dataseed.bnbchain.org",
    "https://bsc-dataseed1.bnbchain.org",
    "https://bsc-dataseed2.bnbchain.org",
    "https://bsc-dataseed3.bnbchain.org",
    "https://bsc-dataseed4.bnbchain.org",
  ],

  maxSupply: 100000,
  baseUri: "https://jayabaya7766-commits.github.io/agent-passport/metadata/",
  hackathonUrl:
    "https://www.binance.com/en/support/announcement/detail/95f5dbe0ea674a48a739b59e046648bf",
};
