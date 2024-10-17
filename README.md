# Geomean Oracle Hook for Balancer v3

This project implements a Geomean Oracle Hook for Balancer v3, providing a price oracle based on the geometric mean of token prices within a pool. This oracle can be used to get a more accurate and manipulation-resistant price for assets in the pool.

## Features

- Calculates geometric mean of token prices
- Updates prices after each swap
- Integrates seamlessly with Balancer v3 pools
- Provides a manipulation-resistant price oracle
- Implements security measures against price manipulation and reentrancy attacks

## Project Structure

```
geomean-oracle-hook/
├── contracts/
│   ├── GeomeanOracleHook.sol
│   └── interfaces/
│       └── IGeomeanOracleHook.sol
├── test/
│   └── GeomeanOracleHook.test.js
├── scripts/
│   └── deploy.js
├── .gitignore
├── hardhat.config.js
├── package.json
└── README.md
```

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/geomean-oracle-hook.git
   cd geomean-oracle-hook
   ```

2. Install dependencies:
   ```
   npm install
   ```

## Usage

1. Configure the Balancer V3 Vault address and allowed pool factory address in the `deploy.js` script.

2. Deploy the contract:
   ```
   npx hardhat run scripts/deploy.js --network <your-network>
   ```

3. Interact with the deployed contract using the `IGeomeanOracleHook` interface.

## Testing

Run the test suite:

```
npx hardhat test
```

## Security Measures

- Implements ReentrancyGuard to prevent reentrancy attacks
- Uses Ownable for access control on critical functions
- Implements a minimum update interval to prevent frequent price manipulations
- Checks for price deviations to prevent sudden large price changes

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the GPL-3.0 License.
