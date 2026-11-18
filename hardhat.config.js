require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    // Pinned exact version — BscScan verification must use these exact settings.
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      // "paris" avoids Shanghai/Cancun opcodes (e.g. PUSH0) so the bytecode
      // runs on every BSC hardfork, past and present.
      evmVersion: "paris",
    },
  },
  networks: {
    // BSC mainnet endpoint for read-only use and for the parent's deploy step.
    // NO accounts/keys are configured here on purpose: deployment is done by
    // the parent agent with the user's own wallet. See docs/DEPLOY.md.
    bsc: {
      url: "https://bsc-dataseed.bnbchain.org",
      chainId: 56,
    },
  },
};
