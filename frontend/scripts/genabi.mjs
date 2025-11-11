import fs from "node:fs";
import path from "node:path";

// Simple generator that updates frontend ABI and address from contracts artifacts/deployments
const root = path.resolve(process.cwd(), "../contracts");
// write directly into current frontend package
const frontend = path.resolve(process.cwd());

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function writeFile(p, content) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, "utf8");
}

function toTsExport(name, obj) {
  return `export const ${name} = ${JSON.stringify(obj, null, 2)};\n`;
}

function upperFirst(s) { return s[0].toUpperCase() + s.slice(1); }

function main() {
  const artifactsDir = path.join(root, "artifacts", "contracts", "GeoVoteFHE.sol");
  const abiFile = path.join(artifactsDir, "GeoVoteFHE.json");
  if (!fs.existsSync(abiFile)) {
    console.error("ABI not found. Please run `npm run build` in contracts first.");
    process.exit(1);
  }
  const abiJson = readJson(abiFile);
  const abiTs = `export const GeoVoteABI = ${JSON.stringify({ abi: abiJson.abi }, null, 2)};\n`;
  writeFile(path.join(frontend, "abi", "GeoVoteABI.ts"), abiTs);

  // Deployments
  const deploymentsDir = path.join(root, "deployments");
  const addresses = {};
  if (fs.existsSync(deploymentsDir)) {
    for (const chain of fs.readdirSync(deploymentsDir)) {
      const f = path.join(deploymentsDir, chain, "GeoVoteFHE.json");
      if (fs.existsSync(f)) {
        const d = readJson(f);
        addresses[String(d.chainId ?? chain)] = {
          address: d.address,
          chainId: d.chainId ?? (chain === "localhost" ? 31337 : undefined),
          chainName: upperFirst(chain),
        };
      }
    }
  }
  if (Object.keys(addresses).length > 0) {
    const addrTs = toTsExport("GeoVoteAddresses", addresses);
    writeFile(path.join(frontend, "abi", "GeoVoteAddresses.ts"), addrTs);
  } else {
    console.warn("No deployments found under contracts/deployments");
  }
  console.log("ABI and addresses generated.");
}

main();


