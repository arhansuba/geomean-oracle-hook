const hre = require("hardhat");

async function main() {
  console.log("Deploying GeomeanOracleHook...");

  // Get the contract factory
  const GeomeanOracleHook = await hre.ethers.getContractFactory("GeomeanOracleHook");

  // Get the Balancer V3 Vault address for the current network
  const VAULT_ADDRESS = getVaultAddress(hre.network.name);

  // Get the allowed pool factory address for the current network
  const ALLOWED_POOL_FACTORY = getAllowedPoolFactory(hre.network.name);

  // Deploy the contract
  const geomeanOracleHook = await GeomeanOracleHook.deploy(VAULT_ADDRESS, ALLOWED_POOL_FACTORY);

  // Wait for the contract to be deployed
  await geomeanOracleHook.deployed();

  console.log("GeomeanOracleHook deployed to:", geomeanOracleHook.address);

  // Verify the contract on Etherscan (if not on a local network)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    await geomeanOracleHook.deployTransaction.wait(5);  // wait for 5 block confirmations

    console.log("Verifying contract on Etherscan...");
    await hre.run("verify:verify", {
      address: geomeanOracleHook.address,
      constructorArguments: [VAULT_ADDRESS, ALLOWED_POOL_FACTORY],
    });
    console.log("Contract verified on Etherscan");
  }
}

function getVaultAddress(network) {
  // Replace these addresses with the actual Balancer V3 Vault addresses for each network
  const vaultAddresses = {
    mainnet: "0x...",
    goerli: "0x...",
    arbitrum: "0x...",
    // Add other networks as needed
  };

  const address = vaultAddresses[network];
  if (!address) {
    throw new Error(`No Vault address configured for network: ${network}`);
  }
  return address;
}

function getAllowedPoolFactory(network) {
  // Replace these addresses with the actual allowed pool factory addresses for each network
  const factoryAddresses = {
    mainnet: "0x...",
    goerli: "0x...",
    arbitrum: "0x...",
    // Add other networks as needed
  };

  const address = factoryAddresses[network];
  if (!address) {
    throw new Error(`No allowed pool factory address configured for network: ${network}`);
  }
  return address;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });