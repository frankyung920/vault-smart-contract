import { ethers } from "ethers";
import { ethers as hhEthers } from "hardhat";
const { expect } = require("chai");

describe("Vault", function () {
  let Vault: any;
  let WethMock: any;
  let TestToken: any;
  let wethAddress = "";
  let tokenAddress = "";
  let vaultAddress = "";
  let owner: any;
  let addr1: any;
  let addr2: any;

  beforeEach(async function () {
    [owner, addr1, addr2] = await hhEthers.getSigners();
    // Deploy the mock WETH token
    const WethMockContract = await hhEthers.getContractFactory("MockWETH");
    WethMock = await WethMockContract.deploy();
    wethAddress = await WethMock.getAddress();

    // Deploy the Test token
    const TestTokenContract = await hhEthers.getContractFactory("TestToken");
    TestToken = await TestTokenContract.deploy(
      "TestToken",
      "TT",
      ethers.parseEther("10000000000")
    );
    tokenAddress = await TestToken.getAddress();

    // Deploy the Vault contract
    const VaultContract = await hhEthers.getContractFactory("Vault");
    Vault = await VaultContract.deploy(wethAddress);
    vaultAddress = await Vault.getAddress();
  });

  describe("Ownership", function () {
    it("transferOwnership should update owner", async function () {
      await Vault.transferOwnership(addr1.address);
      expect(await Vault.owner()).to.equal(addr1.address);
    });
  });

  describe("depositETH function", function () {
    it("Should deposit 1 ETH into the vault", async function () {
      const depositAmount = ethers.parseEther("1");

      await expect(() =>
        Vault.connect(addr1).depositETH({ value: depositAmount })
      ).to.changeEtherBalance(addr1, -depositAmount); // Check if ETH balance of addr1 decreases
      expect(await Vault.connect(owner).getEthDeposit(addr1.address)).to.equal(
        depositAmount
      );

      const depositTx = await Vault.connect(addr1).depositETH({
        value: depositAmount,
      });
      await expect(depositTx)
        .to.emit(Vault, "Deposit")
        .withArgs(addr1.address, ethers.ZeroAddress, depositAmount);
    });
  });

  describe("depositToken function", function () {
    beforeEach(async function () {
      // addr1 will have 1000 test token for testing
      const transferAmount = ethers.parseEther("1000");
      await TestToken.transfer(addr1.address, transferAmount);
    });

    it("should allow users to deposit ERC20 tokens", async function () {
      const addr1Balance = await TestToken.balanceOf(addr1.address);
      // Addr1 approves vault to spend their tokens
      const depositAmount = ethers.parseEther("1000");

      await TestToken.connect(addr1).approve(vaultAddress, depositAmount);

      await Vault.connect(addr1).depositToken(tokenAddress, depositAmount);

      const balance = await Vault.getDeposit(addr1.address, tokenAddress);
      expect(balance).to.equal(depositAmount);
    });
  });

  describe("withdrawETH function", function () {
    beforeEach(async function () {
      await Vault.connect(addr1).depositETH({ value: ethers.parseEther("10") });
    });

    it("should allow a user to withdraw ETH", async function () {
      hhEthers.provider.getBalance;
      const initialBalance = await hhEthers.provider.getBalance(addr1.address);
      const withdrawAmount = ethers.parseEther("5");

      await expect(Vault.connect(addr1).withdrawETH(withdrawAmount))
        .to.emit(Vault, "Withdraw")
        .withArgs(addr1.address, ethers.ZeroAddress, withdrawAmount);

      const finalBalance = await hhEthers.provider.getBalance(addr1.address);

      expect(finalBalance - initialBalance).to.be.closeTo(
        withdrawAmount,
        ethers.parseEther("0.01")
      ); // Consider gas costs
    });

    it("should fail if the user tries to withdraw more ETH than they have deposited", async function () {
      const withdrawAmount = ethers.parseEther("15"); // More than deposited
      await expect(
        Vault.connect(addr1).withdrawETH(withdrawAmount)
      ).to.be.revertedWith("Insufficient balance");
    });
  });

  describe("withdrawToken function", function () {
    beforeEach(async function () {
      const transferAmount = ethers.parseEther("1000");
      await TestToken.connect(owner).transfer(addr1.address, transferAmount);
      await TestToken.connect(addr1).approve(vaultAddress, transferAmount);
      await Vault.connect(addr1).depositToken(tokenAddress, transferAmount);
    });

    it("should allow a user to withdraw ERC20 tokens", async function () {
      const withdrawAmount = ethers.parseEther("500");

      await expect(
        Vault.connect(addr1).withdrawToken(tokenAddress, withdrawAmount)
      )
        .to.emit(Vault, "Withdraw")
        .withArgs(addr1.address, tokenAddress, withdrawAmount);

      const finalBalance = await TestToken.balanceOf(addr1.address);
      expect(finalBalance).to.equal(ethers.parseEther("500")); // 1000 - 500
    });

    it("should fail if the user tries to withdraw more tokens than they have deposited", async function () {
      const withdrawAmount = ethers.parseEther("1500"); // More than deposited
      await expect(
        Vault.connect(addr1).withdrawToken(tokenAddress, withdrawAmount)
      ).to.be.revertedWith("Insufficient balance");
    });
  });

  describe("wrapETH function", function () {
    beforeEach(async function () {
      const depositAmount = ethers.parseEther("10");
      await Vault.connect(addr1).depositETH({ value: depositAmount });
    });

    it("should allow a user to wrap ETH into WETH", async function () {
      const wrapAmount = ethers.parseEther("1");
      await expect(Vault.connect(addr1).wrapETH(wrapAmount))
        .to.emit(Vault, "WrapETH")
        .withArgs(addr1.address, wrapAmount);

      const wethBalance = await Vault.connect(owner).getDeposit(
        addr1.address,
        wethAddress
      );
      expect(wethBalance).to.equal(wrapAmount);

      const remainingEthDeposit = await Vault.getEthDeposit(addr1.address);
      expect(remainingEthDeposit).to.equal(ethers.parseEther("9")); // 10 initially deposited - 1 wrapped
    });

    it("should fail if the user tries to wrap more ETH than they have deposited", async function () {
      const wrapAmount = ethers.parseEther("11"); // More than deposited
      await expect(Vault.connect(addr1).wrapETH(wrapAmount)).to.be.revertedWith(
        "Insufficient ETH balance"
      );
    });
  });

  describe("unwrapWETH function", function () {
    const depositAmount = ethers.parseEther("10");
    const wrapAmount = ethers.parseEther("5");
    beforeEach(async function () {
      await Vault.connect(addr2).depositETH({ value: depositAmount });
      await Vault.connect(addr2).wrapETH(wrapAmount);
    });

    it("should allow a user to unwrap WETH into ETH", async function () {
      const unwrapAmount = ethers.parseEther("1");

      // Perform the unwrap operation
      const tx = await Vault.connect(addr2).unwrapWETH(unwrapAmount);
      await expect(tx)
        .to.emit(Vault, "UnwrapWETH")
        .withArgs(addr2.address, unwrapAmount);

      const ethDepositInVault = await Vault.connect(owner).getEthDeposit(
        addr2.address
      );

      expect(ethDepositInVault).to.equal(
        depositAmount - wrapAmount + unwrapAmount
      );

      // Verify the WETH balance within the vault for the user has decreased
      const wethBalanceInVault = await Vault.connect(owner).getDeposit(
        addr2.address,
        wethAddress
      );
      expect(wethBalanceInVault).to.equal(wrapAmount - unwrapAmount); // Assuming they only had 1 WETH
    });

    it("should fail if the user tries to unwrap more WETH than they have", async function () {
      const unwrapAmount = ethers.parseEther("6"); // More than wrapped
      await expect(
        Vault.connect(addr2).unwrapWETH(unwrapAmount)
      ).to.be.revertedWith("Insufficient WETH balance");
    });
  });
});
