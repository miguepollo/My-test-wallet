import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

console.time('Tiempo total de inicio');

console.time('Importación de dependencias');
// Aquí puedes importar otras dependencias si las tienes
console.timeEnd('Importación de dependencias');

console.time('Renderizado inicial');
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root'),
  () => {
    console.timeEnd('Renderizado inicial');
    console.timeEnd('Tiempo total de inicio');
  }
);
