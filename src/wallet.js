const bitcoin = require('bitcoinjs-lib');
const { BIP32Factory } = require('bip32');
const ecc = require('tiny-secp256k1');
const bip39 = require('bip39');
const axios = require('axios');

// Initialize bip32 with ecc
const bip32 = BIP32Factory(ecc);

// Using testnet for development and testing
const network = bitcoin.networks.testnet;
const apiBaseUrl = 'https://api.blockcypher.com/v1/btc/test3';

class BitcoinWallet {
    constructor() {
        this.mnemonic = null;
        this.wallet = null;
        this.address = null;
    }

    // Generate new wallet with mnemonic phrase
    async generateWallet() {
        try {
            // Generate mnemonic
            this.mnemonic = bip39.generateMnemonic();
            const seed = await bip39.mnemonicToSeed(this.mnemonic);
            
            // Generate root wallet from seed
            const root = bip32.fromSeed(seed, network);
            
            // Derive the first account's node (m/44'/1'/0'/0/0)
            const child = root.derivePath("m/44'/1'/0'/0/0");
            
            this.wallet = child;
            
            // Generate address from public key
            this.address = bitcoin.payments.p2pkh({
                pubkey: child.publicKey,
                network: network,
            }).address;

            return {
                mnemonic: this.mnemonic,
                address: this.address
            };
        } catch (error) {
            throw new Error(`Error generating wallet: ${error.message}`);
        }
    }

    // Import wallet from mnemonic
    async importFromMnemonic(mnemonic) {
        try {
            const seed = await bip39.mnemonicToSeed(mnemonic);
            const root = bip32.fromSeed(seed, network);
            const child = root.derivePath("m/44'/1'/0'/0/0");
            
            this.mnemonic = mnemonic;
            this.wallet = child;
            this.address = bitcoin.payments.p2pkh({
                pubkey: child.publicKey,
                network: network,
            }).address;

            return this.address;
        } catch (error) {
            throw new Error(`Error importing wallet: ${error.message}`);
        }
    }

    // Get wallet balance
    async getBalance() {
        try {
            if (!this.address) {
                throw new Error('Wallet not initialized');
            }

            const response = await axios.get(`${apiBaseUrl}/addrs/${this.address}/balance`);
            // Convert satoshis to BTC
            const balanceBTC = response.data.balance / 100000000;
            return balanceBTC;
        } catch (error) {
            throw new Error(`Error getting balance: ${error.message}`);
        }
    }

    // Get wallet address
    getAddress() {
        if (!this.address) {
            throw new Error('Wallet not initialized');
        }
        return this.address;
    }

    // Basic function to create and broadcast a transaction
    async sendBitcoin(toAddress, amountBTC) {
        try {
            if (!this.wallet) {
                throw new Error('Wallet not initialized');
            }

            // Get UTXOs
            const utxosResponse = await axios.get(`${apiBaseUrl}/addrs/${this.address}?unspentOnly=true`);
            const utxos = utxosResponse.data.txrefs || [];

            if (utxos.length === 0) {
                throw new Error('No unspent outputs found');
            }

            // Create transaction
            const psbt = new bitcoin.Psbt({ network });
            
            // Add inputs
            let totalAmount = 0;
            for (const utxo of utxos) {
                const txHex = await axios.get(`${apiBaseUrl}/txs/${utxo.tx_hash}`);
                psbt.addInput({
                    hash: utxo.tx_hash,
                    index: utxo.tx_output_n,
                    nonWitnessUtxo: Buffer.from(txHex.data.hex, 'hex'),
                });
                totalAmount += utxo.value;
            }

            // Convert BTC to satoshis
            const amountSatoshis = Math.floor(amountBTC * 100000000);
            const fee = 10000; // 0.0001 BTC fee
            
            if (totalAmount < amountSatoshis + fee) {
                throw new Error('Insufficient funds');
            }

            // Add outputs
            psbt.addOutput({
                address: toAddress,
                value: amountSatoshis,
            });
            
            // Add change output if necessary
            const change = totalAmount - amountSatoshis - fee;
            if (change > 0) {
                psbt.addOutput({
                    address: this.address,
                    value: change,
                });
            }

            // Sign inputs
            utxos.forEach((_, index) => {
                psbt.signInput(index, this.wallet);
            });

            psbt.finalizeAllInputs();

            // Build and broadcast
            const tx = psbt.extractTransaction();
            const txHex = tx.toHex();

            // Broadcast transaction
            const broadcastResponse = await axios.post(`${apiBaseUrl}/tx/push`, {
                tx: txHex
            });

            return broadcastResponse.data.tx.hash;
        } catch (error) {
            throw new Error(`Error sending bitcoin: ${error.message}`);
        }
    }
}

module.exports = BitcoinWallet;
