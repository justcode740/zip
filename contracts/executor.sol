//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import { AxelarExecutable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/executables/AxelarExecutable.sol';
import { IAxelarGateway } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol';
import { IERC20 } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol';
import { IAxelarGasService } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol';

// For debug
// import "@nomiclabs/buidler/console.sol";

interface IWETH is IERC20 {
    function deposit() external payable;
    function withdraw(uint) external;
}

contract DistributionExecutable is AxelarExecutable {
    // A map recording which exchange can be used for swap on the chain this contract is deployed on
    mapping (address => bool) whitelistExchanges;
    // A map recording whcih dapp can be interacted with on the chain this contract is deployed on
    mapping (address => bool) whitelistDapps;
    // Axelar gas receiver used to pay gas on destination chain
    IAxelarGasService public immutable gasReceiver;
    // Unique identifer on whcih chian the contract is deployed on
    string public chainName;
    // Owner of the contract
    address public admin;

    uint256 MAX_INT = 2**256 - 1;
    // TODO: this is wrong, need to hardcode based on chain
    IWETH private constant WETH = IWETH(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);

    constructor(address gateway_, address gasReceiver_, string memory _chainName) AxelarExecutable(gateway_) {
        gasReceiver = IAxelarGasService(gasReceiver_);
        chainName = _chainName;
        admin = msg.sender;
    }

    modifier adminOnly {
        require(msg.sender == admin, "only admin can call");
        _;
    }

    event WhitelistExchanges(address[] list);
    function addWhitelistExchanges(address[] calldata list) external adminOnly {
        for (uint256 i = 0; i < list.length; i++){
            whitelistExchanges[list[i]] = true;
        }
        emit WhitelistExchanges(list);
    }

    function isWhitelistExchange(address addr) public view returns (bool) {
        return whitelistExchanges[addr];
    }

    event WhitelistDapps(address[] list);
    function addWhitelistDapps(address[] calldata list) external adminOnly {
        for (uint256 i = 0; i < list.length; i++){
            whitelistDapps[list[i]] = true;
        }
        emit WhitelistDapps(list);
    }

    function isWhitelistDapp(address addr) public view returns (bool) {
        return whitelistDapps[addr];
    }

    struct RouteInfo {
        address target; // 20bytes
        bytes payload; // xbytes
        address tokenIn; // 20bytes
    }

    // tokenAmount is amount of token in from user's wallet address, todo, support more than 1 token
    // Assume no intermediate path is weth, since a weth-a-b-weth-c-d-weth can always be break into weth-a-b-weth + weth-c-d-weth
    // Can someone call transferfrom and steal money here? need to double check.
    function exchange(RouteInfo[] calldata _routes) external payable {
        for (uint256 i = 0; i < _routes.length; i++) {
            RouteInfo calldata route = _routes[i];
            require(whitelistExchanges[route.target], "unwhitelist exchanges are used");
            // TODO maybe can optimize to prevent double approve
            IERC20(route.tokenIn).approve(route.target, MAX_INT);
            (bool _success, bytes memory _response) = route.target.call(route.payload);
            // is this _response necessary?
            require(_success); _response;
        }
        return;
    }

    struct BridgeInfo {
        string destinationChain; // 64 bytes
        string destinationAddress; // 64 bytes
        string tokenSymbol; // 64 bytes token symbol to bridge
        uint256 tokenAmount; // 32bytes token amoount to bridge
        bytes payload; // xbytes of ExecuteInfo, encoded off-chain
    }

    function zipexecute(
        RouteInfo[] calldata routes, 
        uint256 tokenInputAmount, // initial amount of token transfered to the contract to start all process, TODO allow multiple token deposits
        bool nativeEth, // use native eth for execution
        BridgeInfo calldata bridgeInfo
        // address[] calldata destinationAddresses,
    ) external payable {
        // msg.value =  weth used to pay for execution logic + weth to pay for gas service fee (e.g. axelar service fee + destination chain execution fee)
        uint256 ethReceived = msg.value;
        if (nativeEth) {
            require(routes[0].tokenIn == address(WETH), "ETH must be first token in");
            // Wrap _tokenAmount native ETH to WETH
            WETH.deposit{value: tokenInputAmount}();
            ethReceived = ethReceived - tokenInputAmount;
        }else{
            // Transfer tokenAmount of start token from user wallet to contract
            // This can be WETH, USDC, MATIC etc.
            IERC20(routes[0].tokenIn).transferFrom(msg.sender, address(this), tokenInputAmount);
        }

        // No / Empty payload means no swap needed, length>0 means need exchange
        if (routes[0].target != address(0x0)) {
            this.exchange(routes);  
        }
       
        // Now the contract should have bridged token of symbol
        address tokenAddress = gateway.tokenAddresses(bridgeInfo.tokenSymbol);
        // IERC20(tokenAddress).transferFrom(msg.sender, address(this), amount);
        IERC20(tokenAddress).approve(address(gateway), bridgeInfo.tokenAmount);
        // If use native token on source chain to pay destination chain executin cost + axelar service fee
        if (msg.value > 0) {
            gasReceiver.payNativeGasForContractCallWithToken{ value: ethReceived }(
                address(this),
                bridgeInfo.destinationChain,
                bridgeInfo.destinationAddress,
                bridgeInfo.payload,
                bridgeInfo.tokenSymbol,
                bridgeInfo.tokenAmount,
                msg.sender
            );
        }
        gateway.callContractWithToken(bridgeInfo.destinationChain, bridgeInfo.destinationAddress, bridgeInfo.payload, bridgeInfo.tokenSymbol, bridgeInfo.tokenAmount);
    }

    struct ExecuteInfo {
        address recipient; // 20bytes normally msg.sender for evm chains, if transaction
        address target; // 20bytes, target contract to call
        bytes payload; // payload to execute on
    }
    
    // Callback on receive tokens from axelar bridge
    function _executeWithToken(
        string calldata,
        string calldata,
        bytes calldata payload,
        string calldata tokenSymbol, // tokenSymbol of token received
        uint256 amount // amount of token received
    ) internal override {
        // Get necessary token to do the execution
        // exchange()
        // console.log(payload);
        (address recipient, address[] memory targets, bytes[] memory executionPayloads, address[] memory tokenIns) = abi.decode(payload, (address, address[], bytes[], address[]));
        if (targets.length > 0) {
            for (uint256 i = 0; i < targets.length; i++) {
                 IERC20(tokenIns[i]).approve(targets[i], MAX_INT);
                 (bool _success, bytes memory _response) = targets[i].call(executionPayloads[i]);
                 require(_success); _response;
            }
        }else{
            // Empty / no payload means a simple send
            address tokenAddress = gateway.tokenAddresses(tokenSymbol);
            IERC20(tokenAddress).transfer(recipient, amount);
        }

    
    }
}
