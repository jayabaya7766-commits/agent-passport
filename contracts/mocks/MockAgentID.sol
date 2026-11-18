// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @notice Minimal stand-in for the SPACE ID Agent ID registry, used ONLY in
/// tests. It is a plain ERC-721 so balanceOf() behaves exactly like the real
/// registry's for gating purposes. Never deployed to mainnet.
contract MockAgentID is ERC721 {
    uint256 private _nextId = 1;

    constructor() ERC721("Mock Agent ID", "AI") {}

    function mintTo(address to) external returns (uint256) {
        uint256 id = _nextId++;
        _safeMint(to, id);
        return id;
    }
}
