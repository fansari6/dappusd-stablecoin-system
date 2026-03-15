import { network } from 'hardhat';

async function main() {
  const { ethers } = await network.connect('localhost');

  const [deployer] = await ethers.getSigners();
  console.log('Deploying contract with account;', deployer.address);

  const dusd = await ethers.deployContract('DappUSD', [deployer.address]);
  await dusd.waitForDeployment();

  console.log('DappUSD deployed to:', await dusd.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exit = 1;
});
