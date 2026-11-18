const { expect } = require("chai");
const { ethers } = require("hardhat");

const BASE_URI = "https://jayabaya7766-commits.github.io/agent-passport/metadata/";

describe("AgentPassport", function () {
  async function deployFixture() {
    const [deployer, alice, bob] = await ethers.getSigners();

    const MockAgentID = await ethers.getContractFactory("MockAgentID");
    const registry = await MockAgentID.deploy();

    const AgentPassport = await ethers.getContractFactory("AgentPassport");
    const passport = await AgentPassport.deploy(await registry.getAddress(), BASE_URI, deployer.address);

    return { deployer, alice, bob, registry, passport };
  }

  async function giveAgentId(registry, who) {
    await registry.mintTo(who.address);
  }

  it("has the right name, symbol, supply cap and owner", async function () {
    const { deployer, registry, passport } = await deployFixture();
    expect(await passport.name()).to.equal("Agent Passport");
    expect(await passport.symbol()).to.equal("APASS");
    expect(await passport.MAX_SUPPLY()).to.equal(100000);
    expect(await passport.owner()).to.equal(deployer.address);
    expect(await passport.agentIdRegistry()).to.equal(await registry.getAddress());
    expect(await passport.totalMinted()).to.equal(0);
  });

  it("(1) mint reverts without an Agent ID", async function () {
    const { alice, passport } = await deployFixture();
    await expect(passport.connect(alice).mint()).to.be.revertedWithCustomError(
      passport,
      "NoAgentId"
    );
    expect(await passport.totalMinted()).to.equal(0);
  });

  it("(2) mint succeeds with an Agent ID", async function () {
    const { alice, registry, passport } = await deployFixture();
    await giveAgentId(registry, alice);

    await expect(passport.connect(alice).mint())
      .to.emit(passport, "PassportMinted")
      .withArgs(alice.address, 1);

    expect(await passport.totalMinted()).to.equal(1);
    expect(await passport.balanceOf(alice.address)).to.equal(1);
    expect(await passport.ownerOf(1)).to.equal(alice.address);
    expect(await passport.hasMinted(alice.address)).to.equal(true);
    expect(await passport.passportOf(alice.address)).to.equal(1);
    expect(await passport.tokenURI(1)).to.equal(BASE_URI + "1.json");
  });

  it("(2b) mint is free: sending BNB reverts", async function () {
    const { alice, registry, passport } = await deployFixture();
    await giveAgentId(registry, alice);
    await expect(
      passport.connect(alice).mint({ value: ethers.parseEther("0.001") })
    ).to.be.reverted; // mint() is not payable
    expect(await passport.totalMinted()).to.equal(0);
  });

  it("(3) a second mint from the same wallet reverts", async function () {
    const { alice, registry, passport } = await deployFixture();
    await giveAgentId(registry, alice);
    await passport.connect(alice).mint();

    await expect(passport.connect(alice).mint()).to.be.revertedWithCustomError(
      passport,
      "AlreadyMinted"
    );
    expect(await passport.totalMinted()).to.equal(1);
  });

  it("(4) transfers revert (soulbound)", async function () {
    const { alice, bob, registry, passport } = await deployFixture();
    await giveAgentId(registry, alice);
    await passport.connect(alice).mint();

    await expect(
      passport.connect(alice).transferFrom(alice.address, bob.address, 1)
    ).to.be.revertedWithCustomError(passport, "Soulbound");

    await expect(
      passport.connect(alice)["safeTransferFrom(address,address,uint256)"](
        alice.address,
        bob.address,
        1
      )
    ).to.be.revertedWithCustomError(passport, "Soulbound");

    // Still owned by alice.
    expect(await passport.ownerOf(1)).to.equal(alice.address);
    expect(await passport.balanceOf(bob.address)).to.equal(0);
  });

  it("(5) only the owner can setBaseURI", async function () {
    const { alice, registry, passport } = await deployFixture();
    const NEW_BASE = "https://example.com/v2/";

    await expect(
      passport.connect(alice).setBaseURI(NEW_BASE)
    ).to.be.revertedWithCustomError(passport, "NotOwner");

    await passport.setBaseURI(NEW_BASE);
    // tokenURI reflects the new base once a token exists.
    await giveAgentId(registry, alice);
    await passport.connect(alice).mint();
    expect(await passport.tokenURI(1)).to.equal(NEW_BASE + "1.json");
  });

  it("tokenURI reverts for a nonexistent token", async function () {
    const { passport } = await deployFixture();
    await expect(passport.tokenURI(1)).to.be.revertedWithCustomError(
      passport,
      "ERC721NonexistentToken"
    );
  });
});
