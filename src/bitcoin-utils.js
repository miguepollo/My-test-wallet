import * as bitcoin from 'bitcoinjs-lib';
import * as bip39 from 'bip39';
import { BIP32Factory } from 'bip32';
import * as ecc from '@bitcoinerlab/secp256k1';
import ECPairFactory from 'ecpair';

const bip32 = BIP32Factory(ecc);
const ECPair = ECPairFactory(ecc);

export async function generarDireccion(client, mnemonic) {
  console.log('Iniciando generación de dirección');
  try {
    console.log('Convirtiendo mnemónico a seed');
    const seed = await bip39.mnemonicToSeed(mnemonic);
    console.log('Seed generada');

    console.log('Creando root desde seed');
    const root = bip32.fromSeed(Buffer.from(seed));
    console.log('Root creado');

    const path = "m/44'/0'/0'/0/0"; // Cambia esto para generar diferentes direcciones
    console.log('Derivando path:', path);
    const child = root.derivePath(path);
    console.log('Path derivado');

    console.log('Generando dirección');
    const keyPair = ECPair.fromPrivateKey(Buffer.from(child.privateKey));
    const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });
    console.log('Dirección generada:', address);
    
    try {
      console.log('Suscribiendo dirección al servidor Electrum');
      const scripthash = bitcoin.crypto.sha256(Buffer.from(address)).toString('hex');
      await client.blockchain_scripthash_subscribe(scripthash);
      console.log('Dirección suscrita exitosamente');
    } catch (error) {
      console.error('Error al suscribirse a la dirección:', error);
    }

    return { direccion: address };
  } catch (error) {
    console.error('Error en generarDireccion:', error);
    throw error;
  }
}
