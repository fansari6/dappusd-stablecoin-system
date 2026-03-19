import { network } from 'hardhat';

async function main() {
  const { ethers } = await network.connect();

  const [deployer] = await ethers.getSigners();
  console.log('Deploying with account:', deployer.address);

  const token = await ethers.deployContract('DappUSD', [deployer.address]);
  await token.waitForDeployment();

  console.log('DappUSD deployed to:', await token.getAddress());
  console.log('Token name:', await token.name());
  console.log('Token symbol:', await token.symbol());
  console.log('Total supply:', (await token.totalSupply()).toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
