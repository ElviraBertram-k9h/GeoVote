import { ethers } from "hardhat";
import fs from "node:fs";
import path from "node:path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const factory = await ethers.getContractFactory("GeoVoteFHE");
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("GeoVoteFHE deployed at:", address);

  // persist deployment info for frontend generator
  try {
    const network = await ethers.provider.getNetwork();
    const chainId = Number(network.chainId);
    // resolve folder by network
    const networkName = (network.name && network.name !== "unknown") ? network.name : String(chainId);
    const outDir = path.join(process.cwd(), "deployments", networkName);
    fs.mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, "GeoVoteFHE.json");
    fs.writeFileSync(
      outFile,
      JSON.stringify(
        {
          name: "GeoVoteFHE",
          address,
          chainId,
        },
        null,
        2
      ),
      "utf8"
    );
    console.log("Saved deployment:", outFile);
  } catch (e) {
    console.log("Unable to persist deployment file:", e);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


