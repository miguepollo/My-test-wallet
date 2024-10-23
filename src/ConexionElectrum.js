import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import ElectrumClient from 'electrum-client';
import Store from 'electron-store';

const store = new Store();

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background-color: #f0f0f0;
  height: 100vh;
`;

const Input = styled.input`
  margin: 10px;
  padding: 5px;
  width: 200px;
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

const StatusMessage = styled.p`
  color: ${props => props.error ? 'red' : 'green'};
  font-weight: bold;
`;

function ConexionElectrum({ onConnect }) {
  const [ip, setIp] = useState(store.get('nodeIp', ''));
  const [puerto, setPuerto] = useState(store.get('nodePuerto', ''));
  const [autoConectar, setAutoConectar] = useState(store.get('autoConectar', false));
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (autoConectar && ip && puerto) {
      handleConectar();
    }
  }, []);

  const handleConectar = async () => {
    setIsLoading(true);
    setStatus('Conectando...');
    try {
      console.log(`Intentando conectar a ${ip}:${puerto}`);
      const client = new ElectrumClient(puerto, ip, 'ssl');
      await client.connect();
      console.log('Conectado exitosamente');
      
      store.set('nodeIp', ip);
      store.set('nodePuerto', puerto);
      store.set('autoConectar', autoConectar);
      
      setStatus('Conexión exitosa');
      onConnect(client);
    } catch (error) {
      console.error('Error al conectar:', error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <h1>Conectar a Servidor Electrum</h1>
      <Input 
        type="text" 
        placeholder="IP del servidor" 
        value={ip} 
        onChange={(e) => setIp(e.target.value)} 
        disabled={isLoading}
      />
      <Input 
        type="number" 
        placeholder="Puerto" 
        value={puerto} 
        onChange={(e) => setPuerto(e.target.value)} 
        disabled={isLoading}
      />
      <label>
        <input
          type="checkbox"
          checked={autoConectar}
          onChange={(e) => setAutoConectar(e.target.checked)}
        />
        Conectar automáticamente al iniciar
      </label>
      <Button onClick={handleConectar}>Conectar</Button>
      <StatusMessage error={!!status}>{status}</StatusMessage>
    </Container>
  );
}

export default ConexionElectrum;
