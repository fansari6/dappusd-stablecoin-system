import { expect } from 'chai';
import { network } from 'hardhat';

describe('DappUSD', function () {
  let dusd;
  let admin;
  let addr1;
  let addr2;
  let ethers;

  beforeEach(async function () {
    ({ ethers } = await network.connect());

    [admin, addr1, addr2] = await ethers.getSigners();

    const adminAddress = await admin.getAddress();
    dusd = await ethers.deployContract('DappUSD', [adminAddress]);
    await dusd.waitForDeployment();
  });

  it('should deploy correct with name and symbol', async function () {
    expect(await dusd.name()).to.equal('Dapp USD');
    expect(await dusd.symbol()).to.equal('DUSD');
  });

  it('should allow admin to mint tokens', async function () {
    await dusd.mint(addr1.address, ethers.parseUnits('100', 18));
    const balance = await dusd.balanceOf(addr1.address);
    expect(balance).to.equal(ethers.parseUnits('100', 18));
  });

  it('should not allow non-minter to mint tokens', async function () {
    const MINTER_ROLE = await dusd.MINTER_ROLE();

    await expect(
      dusd.connect(addr1).mint(addr1.address, ethers.parseUnits('100', 18)),
    ).to.be.revert(ethers);
  });

  it('should allow token hold to transfer tokens', async function () {
    await dusd.mint(addr1.address, ethers.parseUnits('100', 18));

    await dusd
      .connect(addr1)
      .transfer(addr2.address, ethers.parseUnits('40', 18));

    expect(await dusd.balanceOf(addr1.address)).to.equal(
      ethers.parseUnits('60', 18),
    );
    expect(await dusd.balanceOf(addr2.address)).to.equal(
      ethers.parseUnits('40', 18),
    );
  });

  it('should allow admin to burn tokens from an address', async function () {
    await dusd.mint(addr1.address, ethers.parseUnits('100', 18));
    await dusd.burn(addr1.address, ethers.parseUnits('30', 18));

    expect(await dusd.balanceOf(addr1.address)).to.equal(
      ethers.parseUnits('70', 18),
    );
  });

  it('should pause transfer when paused', async function () {
    await dusd.mint(addr1.address, ethers.parseUnits('100', 18));
    await dusd.pause();

    await expect(
      dusd.connect(addr1).transfer(addr2.address, ethers.parseUnits('10', 18)),
    ).to.be.revert(ethers);
  });

  it('should allow transfers again after unpause', async function () {
    await dusd.mint(addr1.address, ethers.parseUnits('100', 18));
    await dusd.pause();
    await dusd.unpause();

    await dusd
      .connect(addr1)
      .transfer(addr2.address, ethers.parseUnits('10', 18));

    expect(await dusd.balanceOf(addr2.address)).to.equal(
      ethers.parseUnits('10', 18),
    );
  });

  it('should allow admin to grant MINTER_ROLE', async function () {
    const MINTER_ROLE = await dusd.MINTER_ROLE();

    await dusd.grantRole(MINTER_ROLE, addr1.address);

    expect(await dusd.hasRole(MINTER_ROLE, addr1.address)).to.equal(true);
  });

  it('should allow new minter to mint tokens', async function () {
    const MINTER_ROLE = await dusd.MINTER_ROLE();

    await dusd.grantRole(MINTER_ROLE, addr1.address);

    await dusd.connect(addr1).mint(addr2.address, ethers.parseUnits('50', 18));

    expect(await dusd.balanceOf(addr2.address)).to.equal(
      ethers.parseUnits('50', 18),
    );
  });

  it('should revoke minter role', async function () {
    const MINTER_ROLE = await dusd.MINTER_ROLE();

    await dusd.grantRole(MINTER_ROLE, addr1.address);

    await dusd.revokeRole(MINTER_ROLE, addr1.address);

    expect(await dusd.hasRole(MINTER_ROLE, addr1.address)).to.equal(false);
  });
});
