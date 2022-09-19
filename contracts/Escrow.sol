//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

// contract interface
interface IERC721 {
    function transferFrom(
        address _from,
        address _to,
        uint256 _id
    ) external;
}

contract Escrow {
    address public nftAddress;
    uint256 public nftID;
    uint256 public purchasePrice;
    uint256 public escrowAmount;
    address payable public seller;
    address payable public buyer;

    address public inspector;
    address public lender;

    // MODIFIERS
    modifier onlyBuyer() {
        require(msg.sender == buyer, "Only buyer can call this function");
        _;
    }

    modifier onlyInspector() {
        require(
            msg.sender == inspector,
            "Only Inspector can call this function"
        );
        _;
    }

    // STATE VARIABLES
    bool public inspectionPassed = false;

    // MAPPINGS
    mapping(address => bool) public approval;

    constructor(
        address _nftAddress,
        uint256 _nftID,
        uint256 _purchasePrice,
        uint256 _escrowAmount,
        address payable _seller,
        address payable _buyer,
        address _inspector,
        address _lender
    ) {
        nftAddress = _nftAddress;
        nftID = _nftID;
        purchasePrice = _purchasePrice;
        escrowAmount = _escrowAmount;
        seller = _seller;
        buyer = _buyer;
        inspector = _inspector;
        lender = _lender;
    }

    // This function receives a down payment from the buyer for the Real Estate
    function depositEarnest() public payable onlyBuyer {
        require(msg.value >= escrowAmount);
    }

    function updateInspectionStatus(bool _passed) public onlyInspector {
        inspectionPassed = _passed;
    }

    // This function approves sales
    function approveSale() public {
        approval[msg.sender] = true;
    }

    //  This function return balance of the caller
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    //  This function cancels sale if inspection is not passed
    function cancelSale() public {
        if (inspectionPassed == false) {
            payable(buyer).transfer(address(this).balance);
        } else {
            payable(seller).transfer(address(this).balance);
        }
    }

    //  This checks out the sale
    function finalizeSale() public {
        require(inspectionPassed, "must pass inspection");
        require(approval[buyer], "must be approved by buyer");
        require(approval[seller], "must be approved by seller");
        require(approval[lender], "must be approved by lender");
        require(
            address(this).balance >= purchasePrice,
            "must have enough ether for sale"
        );

        (bool success, ) = payable(seller).call{value: address(this).balance}(
            ""
        );
        require(success);

        // Transfer ownership of propery
        IERC721(nftAddress).transferFrom((seller), buyer, nftID);
    }

    receive() external payable {}

    fallback() external payable {}
}
