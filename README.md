# Bitcoin Test Wallet

A basic Bitcoin wallet implementation for testnet, featuring core wallet functionality including wallet generation, balance checking, and sending transactions.

## Features

- Generate new wallet with mnemonic phrase
- Import existing wallet using mnemonic
- Check wallet balance
- Send Bitcoin transactions (testnet)
- BIP32/BIP39 compliant
- Uses Bitcoin testnet for safe testing

## Installation

1. Clone the repository:
```bash
git clone https://github.com/miguepollo/My-test-wallet.git
cd My-test-wallet
```

2. Install dependencies:
```bash
npm install
```

## Usage

Run the example implementation:
```bash
npm start
```

### Code Example

```javascript
const BitcoinWallet = require('./src/wallet');

// Create new wallet instance
const wallet = new BitcoinWallet();

// Generate new wallet
const newWallet = await wallet.generateWallet();
console.log('Mnemonic:', newWallet.mnemonic);
console.log('Address:', newWallet.address);

// Import existing wallet
await wallet.importFromMnemonic('your twelve word mnemonic phrase here');

// Check balance
const balance = await wallet.getBalance();
console.log('Balance:', balance, 'BTC');

// Send Bitcoin
const txHash = await wallet.sendBitcoin('recipient_address', 0.0001);
console.log('Transaction Hash:', txHash);
```

## API Reference

### `generateWallet()`
Generates a new wallet with mnemonic phrase and address.

Returns:
- `mnemonic`: 12-word recovery phrase
- `address`: Bitcoin testnet address

### `importFromMnemonic(mnemonic)`
Imports an existing wallet using a mnemonic phrase.

Parameters:
- `mnemonic`: 12-word recovery phrase

Returns:
- Bitcoin testnet address

### `getBalance()`
Gets the current balance of the wallet.

Returns:
- Balance in BTC

### `getAddress()`
Gets the current wallet address.

Returns:
- Bitcoin testnet address

### `sendBitcoin(toAddress, amountBTC)`
Sends Bitcoin to specified address.

Parameters:
- `toAddress`: Recipient's Bitcoin address
- `amountBTC`: Amount to send in BTC

Returns:
- Transaction hash

## Important Notes

1. This is a **testnet** wallet - only use it with testnet Bitcoin
2. Store your mnemonic phrase securely - it's the only way to recover your wallet
3. Get testnet Bitcoin from faucets like:
   - https://coinfaucet.eu/en/btc-testnet/
   - https://testnet-faucet.mempool.co/

## Security Considerations

- This is a basic implementation for educational purposes
- Not recommended for production use without additional security measures
- Never share your mnemonic phrase
- Always backup your mnemonic phrase securely

## License

ISC
