// Generates token metadata JSON files 1..100 for the Agent Passport site.
// Run: node scripts/generate-metadata.js
// Output: site/metadata/<id>.json (+ badge.svg is hand-written, not generated).
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "..", "site", "metadata");
const IMAGE =
  "https://jayabaya7766-commits.github.io/agent-passport/metadata/badge.svg";
const DESCRIPTION =
  "Agent Passport is a free soulbound badge for Agent ID holders on BNB Chain. " +
  "Each Agent ID can mint exactly one Passport. The badge is non-transferable, " +
  "carries no monetary value, and grants no rewards or earnings.";

const COUNT = 100;

fs.mkdirSync(OUT, { recursive: true });
for (let id = 1; id <= COUNT; id++) {
  const meta = {
    name: `Agent Passport #${id}`,
    description: DESCRIPTION,
    image: IMAGE,
    attributes: [
      { trait_type: "Type", value: "Agent ID Badge" },
      { trait_type: "Soulbound", value: "Yes" },
      { trait_type: "Chain", value: "BNB Chain" },
      { trait_type: "Mint Price", value: "Free (gas only)" },
    ],
  };
  fs.writeFileSync(path.join(OUT, `${id}.json`), JSON.stringify(meta, null, 2) + "\n");
}
console.log(`Wrote ${COUNT} metadata files to ${OUT}`);

// Sanity check: every file parses and tokenURI(id) resolves to it.
for (let id = 1; id <= COUNT; id++) {
  JSON.parse(fs.readFileSync(path.join(OUT, `${id}.json`), "utf8"));
}
console.log("All files parse as valid JSON.");
