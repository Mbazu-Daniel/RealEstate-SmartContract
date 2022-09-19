const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

const ether = tokens;

describe("RealEstate", () => {
  let realEstate, escrow;
  let deployer, seller;
  let nftID = 1;

  beforeEach(async () => {
    // Setup accounts
    accounts = await ethers.getSigners();
    deployer = accounts[0];
    seller = deployer;
    buyer = accounts[1];
    inspector = accounts[2];
    lender = accounts[3];

    // payment
    (purchasePrice = ether(100)), (escrowAmount = ether(20));

    // Load contract
    let RealEstate = await ethers.getContractFactory("RealEstate");
    let Escrow = await ethers.getContractFactory("Escrow");

    // deploy contracts
    realEstate = await RealEstate.deploy();
    escrow = await Escrow.deploy(
      realEstate.address,
      nftID,
      purchasePrice,
      escrowAmount,

      seller.address,
      buyer.address,
      inspector.address,
      lender.address
    );

    // Seller approves NFT
    transaction = await realEstate
      .connect(seller)
      .approve(escrow.address, nftID);
    await transaction.wait();
  });

  describe("Deployment", async () => {
    it("sends an NFT to the seller", async () => {
      expect(await realEstate.ownerOf(nftID)).to.equal(seller.address);
    });
  });

  describe("Selling real estate", async () => {
    let balance, transaction;
    it("executes a successful transaction", async () => {
      // Expect seller to be NFT owner before the sale

      expect(await realEstate.ownerOf(nftID)).to.equal(seller.address);

      // Check escrow balance before buyer deposit
      balance = await escrow.getBalance();
      console.log("Escrow Balance", ethers.utils.formatEther(balance));

      // Buyer deposits earnest
      transaction = await escrow
        .connect(buyer)
        .depositEarnest({ value: escrowAmount });
      console.log("Buyer deposits earnest");

      // Check escrow balance after buyer deposit
      balance = await escrow.getBalance();
      console.log("Escrow Balance", ethers.utils.formatEther(balance));

      // Inspector updates status
      transaction = await escrow
        .connect(inspector)
        .updateInspectionStatus(true);
      await transaction.wait();
      console.log("Inspector updates status");

      // Buyer Approves Sale
      transaction = await escrow.connect(buyer).approveSale();
      await transaction.wait();
      console.log("Buyer approves sale");

      // seller Approves Sale
      transaction = await escrow.connect(seller).approveSale();
      await transaction.wait();
      console.log("seller approves sale");

      // Lender funds sale
      transaction = await lender.sendTransaction({
        to: escrow.address,
        value: ether(80),
      });

      // lender Approves Sale
      transaction = await escrow.connect(lender).approveSale();
      await transaction.wait();
      console.log("lender approves sale");

      // finalize sale
      transaction = await escrow.connect(buyer).finalizeSale();
      await transaction.wait();
      console.log("Buyer finalizes sale");

      // Expect buyer to be NFT owner after the sale
      expect(await realEstate.ownerOf(nftID)).to.equal(buyer.address);

      // Expect Seller to receive funds
      balance = await ethers.provider.getBalance(seller.address);
      expect(balance).to.be.above(ether(10099));
      console.log("Seller balance", ethers.utils.formatEther(balance));
    });
  });
}); // end of the test
