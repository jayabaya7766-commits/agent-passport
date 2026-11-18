// Prints deploy-time values for the parent agent: deploy gas estimate,
// deployed bytecode size, and the ABI-encoded constructor arguments needed
// for BscScan verification. Runs against the local Hardhat network only —
// nothing is sent to any live chain.
//
// Usage: npx hardhat run scripts/prepare-deploy.js
const { ethers } = require("hardhat");

const REGISTRY = "0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F"; // SPACE ID Agent ID (BSC)
const BASE_URI = "https://jayabaya7766-commits.github.io/agent-passport/metadata/";

async function main() {
  const [deployer] = await ethers.getSigners();
  const Factory = await ethers.getContractFactory("AgentPassport");

  // Gas estimate for the deployment transaction (same bytecode as mainnet).
  const deployTx = await Factory.getDeployTransaction(REGISTRY, BASE_URI);
  const gasEstimate = await ethers.provider.estimateGas({
    ...deployTx,
    from: deployer.address,
  });
  console.log("deploy gas estimate:", gasEstimate.toString());

  const contract = await Factory.deploy(REGISTRY, BASE_URI);
  const receipt = await contract.deploymentTransaction().wait();
  console.log("deploy gas used (local):", receipt.gasUsed.toString());
  console.log("local address (NOT mainnet):", await contract.getAddress());

  const bytecode = Factory.bytecode;
  console.log("deployed bytecode bytes:", (bytecode.length - 2) / 2);

  // ABI-encoded constructor arguments (for the BscScan verification form).
  const encodedArgs = ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "string"],
    [REGISTRY, BASE_URI]
  );
  console.log("constructor args (abi-encoded):", encodedArgs);
  console.log("registry:", REGISTRY);
  console.log("baseURI:", BASE_URI);
  console.log("owner will be the deployer:", deployer.address);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
