// End-to-end proof of the FACTORY deployment path on a local Hardhat network.
// Etches the real Arachnid deterministic-deployment-proxy runtime code at its
// canonical address, sends the EXACT calldata the mainnet baw call will send
// (salt ++ initCode), and verifies the contract lands at the computed CREATE2
// address with the right constructor state. Runs locally only — nothing is
// sent to any live chain.
//
// Usage: npx hardhat run scripts/factory-e2e.js
const { ethers, network } = require("hardhat");

const FACTORY = "0x4e59b44847b379578588920cA78FbF26c0B4956C";
const FACTORY_CODE =
  "0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe03601600081602082378035828234f58015156039578182fd5b8082525050506014600cf3";
const REGISTRY = "0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F";
const BASE_URI = "https://jayabaya7766-commits.github.io/agent-passport/metadata/";
const OWNER = "0x38F3F94BFC3775Afb3dDED1ceB523A86157E616f";
const SALT = ethers.keccak256(ethers.toUtf8Bytes("agent-passport-v1"));

async function main() {
  const [deployer] = await ethers.getSigners();
  const Factory = await ethers.getContractFactory("AgentPassport");

  // Full init code: creation bytecode + ABI-encoded constructor args.
  const deployTx = await Factory.getDeployTransaction(REGISTRY, BASE_URI, OWNER);
  const initCode = deployTx.data;
  const initCodeHash = ethers.keccak256(initCode);
  const expected = ethers.getCreate2Address(FACTORY, SALT, initCodeHash);

  // Factory calldata: salt (32 bytes) ++ initCode. No function selector —
  // the proxy reads salt from the first 32 bytes and deploys the rest.
  const calldata = ethers.concat([SALT, initCode]);

  console.log("salt:", SALT);
  console.log("initCode bytes:", (initCode.length - 2) / 2);
  console.log("calldata bytes:", (calldata.length - 2) / 2);
  console.log("expected CREATE2 address:", expected);

  // Etch the real factory runtime code at its canonical address locally.
  await network.provider.send("hardhat_setCode", [FACTORY, FACTORY_CODE]);

  // Send the EXACT factory call the mainnet deploy will use.
  const tx = await deployer.sendTransaction({ to: FACTORY, data: calldata, value: 0 });
  const receipt = await tx.wait();
  console.log("factory tx status:", receipt.status, "gas used:", receipt.gasUsed.toString());

  // Verify the contract exists at the computed address with correct state.
  const code = await ethers.provider.getCode(expected);
  if (code === "0x") throw new Error("NO CODE at expected address — factory deploy FAILED");
  console.log("code at expected address: yes,", (code.length - 2) / 2, "bytes");

  const passport = await ethers.getContractAt("AgentPassport", expected);
  console.log("name:", await passport.name());
  console.log("symbol:", await passport.symbol());
  console.log("owner:", await passport.owner());
  console.log("agentIdRegistry:", await passport.agentIdRegistry());
  console.log("MAX_SUPPLY:", (await passport.MAX_SUPPLY()).toString());
  console.log("totalMinted:", (await passport.totalMinted()).toString());
  console.log("baseURI check tokenURI(1) reverts (no token yet):");
  try {
    await passport.tokenURI(1);
    throw new Error("tokenURI(1) should have reverted");
  } catch (e) {
    if (!e.message.includes("ERC721NonexistentToken") && !String(e).includes("ERC721NonexistentToken")) throw e;
    console.log("  reverted as expected (ERC721NonexistentToken)");
  }
  if ((await passport.owner()).toLowerCase() !== OWNER.toLowerCase())
    throw new Error("owner mismatch");
  console.log("FACTORY E2E: PASS");

  // Save the exact mainnet calldata + expected address for the parent.
  const fs = require("fs");
  fs.writeFileSync(
    "factory-deploy.json",
    JSON.stringify(
      { factory: FACTORY, salt: SALT, expectedAddress: expected, calldata, initCodeBytes: (initCode.length - 2) / 2, calldataBytes: (calldata.length - 2) / 2, localGasUsed: receipt.gasUsed.toString() },
      null,
      2
    )
  );
  console.log("saved factory-deploy.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
