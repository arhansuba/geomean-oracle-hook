// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.21;

import "@balancer-labs/v3-interfaces/contracts/vault/IHooks.sol";
import "@balancer-labs/v3-interfaces/contracts/vault/VaultTypes.sol";

interface IGeomeanOracleHook is IHooks {
    event GeomeanOracleHookRegistered(
        address indexed hooksContract,
        address indexed factory,
        address indexed pool
    );
    
    event PriceUpdated(address indexed pool, uint256[] prices);

    function onRegister(
        address factory,
        address pool,
        TokenConfig[] memory tokenConfigs,
        LiquidityManagement calldata liquidityManagement
    ) external returns (bool);

    function getHookFlags() external pure returns (HookFlags memory hookFlags);

    function onAfterSwap(AfterSwapParams calldata params) external returns (bool, uint256);

    function getGeomeanPrice(address pool) external view returns (uint256);

    function setAllowedPoolFactory(address newFactory) external;

    function getAllowedPoolFactory() external view returns (address);

    function getLastPrices(address pool) external view returns (uint256[] memory);

    function getLastUpdateTime(address pool) external view returns (uint256);
}