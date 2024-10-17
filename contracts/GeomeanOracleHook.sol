// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.21;

import "../balancer-v3-monorepo/pkg/interfaces/contracts/vault/IBasePoolFactory.sol";
import "../balancer-v3-monorepo/pkg/interfaces/contracts/vault/IHooks.sol";
import "../balancer-v3-monorepo/pkg/interfaces/contracts/vault/IVault.sol";
import "../balancer-v3-monorepo/pkg/interfaces/contracts/vault/VaultTypes.sol";
import "../balancer-v3-monorepo/pkg/interfaces/contracts/math/FixedPoint.sol";
import "../balancer-v3-monorepo/pkg/interfaces/contracts/vault/VaultGuard.sol";
import "../balancer-v3-monorepo/pkg/interfaces/contracts/vault/BaseHooks.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GeomeanOracleHook is BaseHooks, VaultGuard, ReentrancyGuard, Ownable {
    using FixedPoint for uint256;

    address immutable _allowedPoolFactory;
    mapping(address => uint256[]) private _lastPrices;
    mapping(address => uint256) private _lastUpdateTime;
    uint256 private constant PRICE_PRECISION = 1e18;
    uint256 private constant MIN_UPDATE_INTERVAL = 1 minutes;
    uint256 private constant MAX_PRICE_DEVIATION = 10; // 10% max deviation

    event GeomeanOracleHookRegistered(
        address indexed hooksContract,
        address indexed factory,
        address indexed pool
    );
    event PriceUpdated(address indexed pool, uint256[] prices);

    constructor(IVault vault, address allowedPoolFactory) VaultGuard(vault) Ownable(msg.sender) {
        require(allowedPoolFactory != address(0), "Invalid pool factory address");
        _allowedPoolFactory = allowedPoolFactory;
    }

    function onRegister(
        address factory,
        address pool,
        TokenConfig[] memory tokenConfigs,
        LiquidityManagement calldata
    ) public override onlyVault returns (bool) {
        require(factory == _allowedPoolFactory, "Unauthorized factory");
        require(IBasePoolFactory(factory).isPoolFromFactory(pool), "Invalid pool");

        emit GeomeanOracleHookRegistered(address(this), factory, pool);
        _lastPrices[pool] = new uint256[](tokenConfigs.length);
        _lastUpdateTime[pool] = block.timestamp;

        return true;
    }

    function getHookFlags() public pure override returns (HookFlags memory hookFlags) {
        hookFlags.shouldCallAfterSwap = true;
    }

    function onAfterSwap(AfterSwapParams calldata params) external override onlyVault nonReentrant returns (bool, uint256) {
        address pool = params.pool;
        uint256[] storage prices = _lastPrices[pool];
        
        require(block.timestamp >= _lastUpdateTime[pool] + MIN_UPDATE_INTERVAL, "Update too frequent");

        uint256 newPriceIn = params.amountInScaled18.divDown(params.amountOutScaled18);
        uint256 newPriceOut = params.amountOutScaled18.divDown(params.amountInScaled18);

        require(_isValidPriceUpdate(prices[params.indexIn], newPriceIn), "Price deviation too high");
        require(_isValidPriceUpdate(prices[params.indexOut], newPriceOut), "Price deviation too high");

        // Update price for swapped tokens
        prices[params.indexIn] = newPriceIn;
        prices[params.indexOut] = newPriceOut;

        _lastUpdateTime[pool] = block.timestamp;
        emit PriceUpdated(pool, prices);

        return (true, params.amountCalculatedRaw);
    }

    function getGeomeanPrice(address pool) external view returns (uint256) {
        uint256[] storage prices = _lastPrices[pool];
        require(prices.length > 0, "No prices available");

        uint256 product = PRICE_PRECISION;
        uint256 length = prices.length;

        for (uint256 i = 0; i < length; i++) {
            require(prices[i] > 0, "Invalid price");
            product = product.mulDown(prices[i].powDown(PRICE_PRECISION / length));
        }

        return product;
    }

    function _isValidPriceUpdate(uint256 oldPrice, uint256 newPrice) private pure returns (bool) {
        if (oldPrice == 0) return true;
        uint256 deviation = oldPrice > newPrice
            ? oldPrice.divDown(newPrice)
            : newPrice.divDown(oldPrice);
        return deviation <= PRICE_PRECISION + (PRICE_PRECISION / MAX_PRICE_DEVIATION);
    }

    function setAllowedPoolFactory(address newFactory) external onlyOwner {
        require(newFactory != address(0), "Invalid pool factory address");
        _allowedPoolFactory = newFactory;
    }

    function getAllowedPoolFactory() external view returns (address) {
        return _allowedPoolFactory;
    }

    function getLastPrices(address pool) external view returns (uint256[] memory) {
        return _lastPrices[pool];
    }

    function getLastUpdateTime(address pool) external view returns (uint256) {
        return _lastUpdateTime[pool];
    }
}