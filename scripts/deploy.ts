import { ethers } from "hardhat";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const wethAddress = process.env.WETH_ADDRESS;

  if (!wethAddress) {
    throw new Error("WETH_ADDRESS environment variable is not set.");
  }

  // Now deploy the Vault contract with the WETH address from the environment variable
  const Vault = await ethers.getContractFactory("Vault");
  const vault = await Vault.deploy(wethAddress);
  console.log("Vault deployed to:", vault.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
