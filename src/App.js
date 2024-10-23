import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import QRCode from 'qrcode.react';
import ConexionElectrum from './ConexionElectrum';
import CrearWallet from './CrearWallet';
import { generarDireccion } from './bitcoin-utils';
import Store from 'electron-store';

const store = new Store();

console.time('Inicialización de App');

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
`;

const Button = styled.button`
  background-color: #f7931a;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  margin: 10px;
  cursor: pointer;
`;

const CopyButton = styled(Button)`
  background-color: #4CAF50;
`;

const AddressContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
`;

const Address = styled.input`
  font-family: monospace;
  font-size: 14px;
  width: 300px;
  margin: 10px 0;
  padding: 5px;
`;

const CopyFeedback = styled.span`
  margin-left: 10px;
  color: #4CAF50;
  display: flex;
  align-items: center;
`;

const CheckIcon = styled.span`
  font-size: 18px;
  margin-right: 5px;
`;

function App() {
  console.time('Renderizado de App');
  const [address, setAddress] = useState('');
  const [client, setClient] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [copied, setCopied] = useState(false);
  const addressRef = useRef(null);

  useEffect(() => {
    console.time('useEffect de App');
    const autoConectar = store.get('autoConectar', false);
    const ip = store.get('nodeIp');
    const puerto = store.get('nodePuerto');

    if (autoConectar && ip && puerto) {
      setIsConnecting(true);
      console.time('Carga de electrum-client');
      import('electrum-client').then(ElectrumClient => {
        console.timeEnd('Carga de electrum-client');
        console.time('Conexión a Electrum');
        const client = new ElectrumClient.default(puerto, ip, 'ssl');
        client.connect().then(() => {
          console.timeEnd('Conexión a Electrum');
          setClient(client);
          setIsConnecting(false);
        }).catch(error => {
          console.error('Error en la conexión automática:', error);
          setIsConnecting(false);
        });
      });
    }
    console.timeEnd('useEffect de App');
  }, []);

  const handleGenerateAddress = async () => {
    if (client && wallet) {
      try {
        const { direccion } = await generarDireccion(client, wallet);
        console.log('Dirección generada:', direccion);
        setAddress(direccion);
        setCopied(false);
      } catch (error) {
        console.error('Error al generar dirección:', error);
        alert('Error al generar dirección');
      }
    } else {
      alert('Por favor, conéctate a un servidor Electrum y crea una wallet primero');
    }
  };

  const handleCopyAddress = () => {
    if (addressRef.current) {
      addressRef.current.select();
      addressRef.current.setSelectionRange(0, 99999);

      try {
        document.execCommand('copy');
        console.log('Dirección copiada:', addressRef.current.value);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000); // Oculta el mensaje después de 3 segundos
      } catch (err) {
        console.error('Error al copiar:', err);
        alert('No se pudo copiar la dirección');
      }
    }
  };

  const handleWalletCreated = (mnemonic) => {
    console.log('Wallet creada');
    setWallet(mnemonic);
    store.set('wallet', mnemonic);
  };

  if (!client && !isConnecting) {
    return <ConexionElectrum onConnect={setClient} />;
  }

  if (!wallet) {
    return <CrearWallet onWalletCreated={handleWalletCreated} />;
  }

  return (
    <Container>
      <h1>Mi Wallet Bitcoin</h1>
      {isConnecting ? (
        <p>Conectando al servidor Electrum...</p>
      ) : (
        <>
          <Button onClick={handleGenerateAddress}>Generar Nueva Dirección</Button>
          {address && (
            <>
              <AddressContainer>
                <Address 
                  ref={addressRef}
                  value={address}
                  readOnly
                />
                <CopyButton onClick={handleCopyAddress}>
                  Copiar
                </CopyButton>
                {copied && (
                  <CopyFeedback>
                    <CheckIcon>✓</CheckIcon>
                    Copiado
                  </CopyFeedback>
                )}
              </AddressContainer>
              <QRCode value={address} />
            </>
          )}
        </>
      )}
    </Container>
  );
}

console.timeEnd('Renderizado de App');
return App;

console.timeEnd('Inicialización de App');

export default App;
