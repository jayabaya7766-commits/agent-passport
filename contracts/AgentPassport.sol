// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/// @notice Minimal interface of the SPACE ID Agent ID registry (ERC-721).
/// Only balanceOf is needed: an address holds an Agent ID iff balanceOf > 0.
/// Mainnet registry: 0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F
interface IAgentIDRegistry {
    function balanceOf(address owner) external view returns (uint256);
}

/// @title Agent Passport
/// @notice Free soulbound badge NFT for SPACE ID Agent ID holders on BNB Chain.
/// @dev Built for the Binance Wallet x BNB Chain Agent ID Hackathon.
/// - FREE: mint() is not payable and costs nothing but gas. The contract
///   never holds funds: there is no payable function anywhere.
/// - ONE PER WALLET: each address can mint exactly one Passport.
/// - AGENT ID GATED: only addresses holding a SPACE ID Agent ID can mint.
/// - SOULBOUND: every transfer and every burn reverts; only minting works.
/// - OWNER POWERS (disclosed per hackathon rules): the owner (deployer) can
///   ONLY call setBaseURI(). There is no pause, no freeze, no tax, no mint
///   fee, no withdraw, no mint-to, and no ownership transfer.
contract AgentPassport is ERC721 {
    using Strings for uint256;

    /// @notice The SPACE ID Agent ID registry used for the mint gate.
    IAgentIDRegistry public immutable agentIdRegistry;

    /// @notice Deployer. Can ONLY call setBaseURI(). Not transferable.
    /// @dev The owner is a constructor parameter (not msg.sender) because the
    /// contract is deployed via an on-chain factory: the factory is
    /// msg.sender at construction, so the real owner must be passed in.
    address public immutable owner;

    /// @notice Hard cap on total Passports.
    uint256 public constant MAX_SUPPLY = 100_000;

    /// @notice Number of Passports minted so far (also the next token id - 1).
    uint256 public totalMinted;

    /// @notice True once an address has minted its one Passport.
    mapping(address => bool) public hasMinted;

    /// @notice tokenId owned by an address (0 = none). One Passport per wallet.
    mapping(address => uint256) public passportOf;

    string private _baseTokenURI;

    event PassportMinted(address indexed to, uint256 indexed tokenId);

    error AlreadyMinted();
    error NoAgentId();
    error SoldOut();
    error Soulbound();
    error NotOwner();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(address _agentIdRegistry, string memory _initialBaseURI, address _owner)
        ERC721("Agent Passport", "APASS")
    {
        agentIdRegistry = IAgentIDRegistry(_agentIdRegistry);
        owner = _owner;
        _baseTokenURI = _initialBaseURI;
    }

    /// @notice Mint the caller's one free Passport. Requires an Agent ID.
    /// @dev Not payable: sending BNB with this call reverts.
    function mint() external {
        if (hasMinted[msg.sender]) revert AlreadyMinted();
        if (agentIdRegistry.balanceOf(msg.sender) == 0) revert NoAgentId();
        if (totalMinted >= MAX_SUPPLY) revert SoldOut();

        hasMinted[msg.sender] = true;
        totalMinted += 1;
        passportOf[msg.sender] = totalMinted;

        emit PassportMinted(msg.sender, totalMinted);
        _safeMint(msg.sender, totalMinted);
    }

    /// @notice The ONLY owner power: change the metadata base URI.
    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    /// @notice tokenURI = baseURI + tokenId + ".json"
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        string memory base = _baseURI();
        return bytes(base).length > 0 ? string.concat(base, tokenId.toString(), ".json") : "";
    }

    /// @notice Soulbound: only minting (from == address(0)) is allowed.
    /// Every transfer and every burn reverts with Soulbound().
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        if (from != address(0)) revert Soulbound();
        return super._update(to, tokenId, auth);
    }
}
