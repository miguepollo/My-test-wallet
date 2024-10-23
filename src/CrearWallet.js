import React, { useState } from 'react';
import styled from 'styled-components';
import * as bip39 from 'bip39';

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

const WordList = styled.ul`
  list-style-type: none;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
`;

const Word = styled.li`
  background-color: #f0f0f0;
  padding: 5px 10px;
  border-radius: 3px;
`;

function CrearWallet({ onWalletCreated }) {
  const [mnemonic, setMnemonic] = useState('');

  const generarMnemonic = (longitud) => {
    console.log(`Generando mnemónico de ${longitud} palabras...`);
    const startTime = performance.now();
    
    const strength = longitud === 24 ? 256 : 128;
    const nuevaMnemonic = bip39.generateMnemonic(strength);
    
    const endTime = performance.now();
    console.log(`Mnemónico generado en ${endTime - startTime} ms`);
    console.log('Palabras generadas:', nuevaMnemonic);
    
    setMnemonic(nuevaMnemonic);
    onWalletCreated(nuevaMnemonic);
  };

  return (
    <Container>
      <h2>Crear Nueva Wallet</h2>
      <Button onClick={() => generarMnemonic(12)}>Generar 12 palabras</Button>
      <Button onClick={() => generarMnemonic(24)}>Generar 24 palabras</Button>
      {mnemonic && (
        <div>
          <h3>Tu frase mnemónica:</h3>
          <WordList>
            {mnemonic.split(' ').map((word, index) => (
              <Word key={index}>{word}</Word>
            ))}
          </WordList>
          <p>Guarda estas palabras en un lugar seguro. Son la clave para acceder a tu wallet.</p>
        </div>
      )}
    </Container>
  );
}

export default CrearWallet;
