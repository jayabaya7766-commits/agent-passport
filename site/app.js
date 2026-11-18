// Agent Passport — frontend logic (no build step, ethers v6 vendored).
// Read-only data comes from public BSC RPCs; minting goes through the user's
// own injected wallet. Nothing is ever signed automatically.
(function () {
  "use strict";

  var CFG = window.APASS_CONFIG || {};
  var $ = function (id) { return document.getElementById(id); };

  var PASSPORT_ABI = [
    "function mint()",
    "function hasMinted(address) view returns (bool)",
    "function passportOf(address) view returns (uint256)",
    "function totalMinted() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
    "function MAX_SUPPLY() view returns (uint256)",
    "function owner() view returns (address)",
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
  ];
  var REGISTRY_ABI = ["function balanceOf(address) view returns (uint256)"];
  var TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
  var ZERO = "0x0000000000000000000000000000000000000000";

  var deployed = Boolean(CFG.contractAddress);
  var readProvider = null;
  var userAddress = null;
  var userChainId = null;

  function short(addr) {
    return addr ? addr.slice(0, 6) + "…" + addr.slice(-4) : "—";
  }
  function setMsg(text, kind) {
    var el = $("mintMsg");
    el.textContent = text || "";
    el.className = "msg" + (kind ? " " + kind : "");
  }

  // ---- read-only provider: first public RPC that answers ----
  async function getReadProvider() {
    if (readProvider) return readProvider;
    for (var i = 0; i < CFG.rpcUrls.length; i++) {
      try {
        var p = new ethers.JsonRpcProvider(CFG.rpcUrls[i], CFG.chainId);
        await p.getBlockNumber();
        readProvider = p;
        return p;
      } catch (e) { /* try the next RPC */ }
    }
    throw new Error("No public BSC RPC answered.");
  }

  function passportRead() {
    return new ethers.Contract(CFG.contractAddress, PASSPORT_ABI, readProvider);
  }
  function registryRead() {
    return new ethers.Contract(CFG.agentIdRegistry, REGISTRY_ABI, readProvider);
  }

  // ---- page setup ----
  async function init() {
    if (typeof ethers === "undefined") {
      $("libError").classList.remove("hidden");
      return;
    }
    $("hackathonLink").href = CFG.hackathonUrl;
    if (!deployed) {
      $("notDeployed").classList.remove("hidden");
      $("mintBtn").textContent = "Contract not deployed yet";
      $("leaderboard").innerHTML =
        '<p class="muted">The leaderboard appears once the contract is live.</p>';
      return;
    }
    $("contractLink").innerHTML =
      '<a href="' + CFG.chainExplorer + "/address/" + CFG.contractAddress +
      '" target="_blank" rel="noopener">' + CFG.contractAddress + "</a>";
    try {
      await getReadProvider();
      await refreshMintedCount();
      await loadLeaderboard();
    } catch (e) {
      $("mintedCount").textContent = "— / " + CFG.maxSupply.toLocaleString();
      $("leaderboard").innerHTML =
        '<p class="muted">Leaderboard temporarily unavailable — the public BSC ' +
        "RPCs did not answer. Please try again later.</p>";
    }
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", onAccountsChanged);
      window.ethereum.on("chainChanged", function () { window.location.reload(); });
    }
  }

  async function refreshMintedCount() {
    try {
      var n = await passportRead().totalMinted();
      $("mintedCount").textContent =
        Number(n).toLocaleString() + " / " + CFG.maxSupply.toLocaleString();
    } catch (e) { /* leave as-is */ }
  }

  // ---- wallet ----
  async function connect() {
    if (!window.ethereum) {
      setMsg("No wallet found. Install a wallet with an injected provider (e.g. MetaMask or Binance Wallet) and try again.", "error");
      return;
    }
    setMsg("");
    try {
      var provider = new ethers.BrowserProvider(window.ethereum);
      var accounts = await provider.send("eth_requestAccounts", []);
      userAddress = accounts[0];
      var net = await provider.getNetwork();
      userChainId = Number(net.chainId);
      $("connectBtn").textContent = short(userAddress);
      $("walletAddr").textContent = short(userAddress);
      $("networkName").textContent =
        userChainId === CFG.chainId ? "BNB Chain (56)" : "Chain " + userChainId + " (wrong network)";
      if (userChainId !== CFG.chainId) {
        $("switchBtn").classList.remove("hidden");
        $("mintBtn").disabled = true;
        $("mintBtn").textContent = "Switch to BNB Chain to mint";
        return;
      }
      $("switchBtn").classList.add("hidden");
      await refreshUserState(provider);
    } catch (e) {
      setMsg("Could not connect to the wallet: " + friendlyError(e), "error");
    }
  }

  async function switchNetwork() {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x38" }], // 56
      });
    } catch (e) {
      if (e && e.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: "0x38",
              chainName: "BNB Smart Chain",
              nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
              rpcUrls: [CFG.chainRpc],
              blockExplorerUrls: [CFG.chainExplorer],
            }],
          });
        } catch (e2) {
          setMsg("Could not add BNB Chain: " + friendlyError(e2), "error");
        }
      } else {
        setMsg("Could not switch network: " + friendlyError(e), "error");
      }
    }
  }

  async function refreshUserState(provider) {
    var btn = $("mintBtn");
    btn.disabled = true;
    btn.textContent = "Checking…";
    try {
      await getReadProvider();
      var hasId = (await registryRead().balanceOf(userAddress)) > 0n;
      var el = $("agentIdStatus");
      el.textContent = hasId ? "Yes — Agent ID held" : "No Agent ID found";
      el.className = hasId ? "yes" : "no";

      var minted = await passportRead().hasMinted(userAddress);
      if (minted) {
        var tokenId = await passportRead().passportOf(userAddress);
        var pel = $("passportStatus");
        pel.innerHTML =
          'Owned — Passport <a href="' + CFG.chainExplorer + "/nft/" +
          CFG.contractAddress + "/" + tokenId + '" target="_blank" rel="noopener">#' +
          tokenId + "</a>";
        pel.className = "yes";
        btn.textContent = "You already own a Passport";
        setMsg("One Passport per wallet — yours is #" + tokenId + ". It is soulbound and cannot be transferred.");
      } else if (!hasId) {
        $("passportStatus").textContent = "Not minted";
        btn.textContent = "Minting requires an Agent ID";
        setMsg("This wallet holds no Agent ID. Claim an Agent ID in the Binance app first (Wallet > homepage banner > Agent ID).");
      } else {
        $("passportStatus").textContent = "Not minted yet";
        btn.disabled = false;
        btn.textContent = "Mint your free Passport";
        setMsg("");
      }
      await refreshMintedCount();
    } catch (e) {
      btn.textContent = "Could not load status";
      setMsg("Could not read on-chain state: " + friendlyError(e) + " Please try again.", "error");
    }
  }

  async function mint() {
    var btn = $("mintBtn");
    btn.disabled = true;
    btn.textContent = "Waiting for wallet…";
    setMsg("Confirm the transaction in your wallet. The mint itself is free — you only pay gas.");
    try {
      var provider = new ethers.BrowserProvider(window.ethereum);
      var signer = await provider.getSigner();
      var contract = new ethers.Contract(CFG.contractAddress, PASSPORT_ABI, signer);
      var tx = await contract.mint();
      btn.textContent = "Minting…";
      setMsg("Transaction sent: " + tx.hash + ". Waiting for confirmation…");
      var receipt = await tx.wait();
      if (receipt.status !== 1n) throw new Error("Transaction failed on-chain.");
      setMsg("Minted! Your Passport is on its way to your wallet.", "ok");
      await refreshUserState(provider);
      await loadLeaderboard();
    } catch (e) {
      btn.disabled = false;
      btn.textContent = "Mint your free Passport";
      setMsg("Mint failed: " + friendlyError(e), "error");
    }
  }

  // ---- leaderboard: recent mints from Transfer events (from = 0x0) ----
  async function loadLeaderboard() {
    var box = $("leaderboard");
    if (!deployed || !CFG.deployBlock) {
      box.innerHTML = '<p class="muted">The leaderboard appears once the contract is live.</p>';
      return;
    }
    box.innerHTML = '<p class="muted">Loading…</p>';
    try {
      var provider = await getReadProvider();
      var latest = await provider.getBlockNumber();
      var from = CFG.deployBlock;
      var rows = [];
      // Scan backwards in chunks; stop once we have 10 minters.
      var CHUNK = 5000;
      var to = latest;
      while (to >= from && rows.length < 10) {
        var chunkFrom = Math.max(from, to - CHUNK + 1);
        var logs = await provider.getLogs({
          address: CFG.contractAddress,
          topics: [TRANSFER_TOPIC, ethers.zeroPadValue(ZERO, 32)],
          fromBlock: chunkFrom,
          toBlock: to,
        });
        for (var i = logs.length - 1; i >= 0 && rows.length < 10; i--) {
          var log = logs[i];
          var toAddr = "0x" + log.topics[2].slice(26);
          var tokenId = BigInt(log.topics[3]).toString();
          rows.push({ to: toAddr, tokenId: tokenId, block: log.blockNumber });
        }
        to = chunkFrom - 1;
      }
      if (rows.length === 0) {
        box.innerHTML = "<p class=\"muted\">No Passports minted yet — be the first.</p>";
        return;
      }
      var html = '<table class="leader"><thead><tr><th>#</th><th>Minter</th><th>Passport</th></tr></thead><tbody>';
      rows.forEach(function (r, i) {
        html += "<tr><td>" + (i + 1) + "</td><td class=\"addr\"><a href=\"" +
          CFG.chainExplorer + "/address/" + r.to + '" target="_blank" rel="noopener">' +
          short(r.to) + "</a></td><td>#" + r.tokenId + "</td></tr>";
      });
      box.innerHTML = html + "</tbody></table>";
    } catch (e) {
      box.innerHTML =
        '<p class="muted">Leaderboard temporarily unavailable — the public BSC ' +
        "RPCs are rate-limiting event queries right now. The mint still works; " +
        "please try again later.</p>";
    }
  }

  function onAccountsChanged(accounts) {
    if (!accounts || accounts.length === 0) {
      userAddress = null;
      $("connectBtn").textContent = "Connect Wallet";
      $("walletAddr").textContent = "Not connected";
      $("agentIdStatus").textContent = "—";
      $("passportStatus").textContent = "—";
      var btn = $("mintBtn");
      btn.disabled = true;
      btn.textContent = "Connect your wallet to mint";
    } else {
      connect();
    }
  }

  function friendlyError(e) {
    if (!e) return "unknown error";
    if (e.code === 4001 || (e.message && /rejected/i.test(e.message))) {
      return "you rejected the request in your wallet.";
    }
    if (e.reason) return e.reason;
    var m = (e.message || String(e)).replace(/^Error:\s*/, "");
    return m.length > 180 ? m.slice(0, 180) + "…" : m;
  }

  $("connectBtn").addEventListener("click", connect);
  $("mintBtn").addEventListener("click", mint);
  $("switchBtn").addEventListener("click", switchNetwork);

  document.addEventListener("DOMContentLoaded", init);
})();
