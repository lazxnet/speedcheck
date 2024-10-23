import React, { useState, useEffect } from 'react';
import { Wifi, Upload, Download, MapPin, Globe } from 'lucide-react';
import './SpeedTest.css';

// Function to simulate a speed test
const simulateSpeedTest = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        download: Math.random() * 100 + 50, // 50-150 Mbps
        upload: Math.random() * 50 + 25, // 25-75 Mbps
      });
    }, 3000); // Simulates a 3-second test
  });
};

export default function SpeedTest() {
  const [networkInfo, setNetworkInfo] = useState(null);
  const [speedResults, setSpeedResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => setNetworkInfo(data));
  }, []);

  const runSpeedTest = async () => {
    setIsLoading(true);
    const results = await simulateSpeedTest();
    setSpeedResults(results);
    setIsLoading(false);
  };

  return (
    <div className="container">
      <h1 className="title">SpeedCheck</h1>
      
      <div className="card-grid">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Información de Red</h2>
            <p className="card-description">Detalles sobre tu conexión</p>
          </div>
          <div className="card-content">
            {networkInfo ? (
              <div className="network-info">
                <p><Globe className="icon" /> IP: {networkInfo.ip}</p>
                <p><MapPin className="icon" /> Ubicación: {networkInfo.city}, {networkInfo.country_name}</p>
                <p><Wifi className="icon" /> Proveedor: {networkInfo.org}</p>
              </div>
            ) : (
              <p>Cargando información de red...</p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Resultados de Velocidad</h2>
            <p className="card-description">Velocidad de descarga y subida</p>
          </div>
          <div className="card-content">
            {speedResults ? (
              <div className="speed-results">
                <div className="speed-item">
                  <p><Download className="icon" /> Descarga: {speedResults.download.toFixed(2)} Mbps</p>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: `${(speedResults.download / 150) * 100}%`}}></div>
                  </div>
                </div>
                <div className="speed-item">
                  <p><Upload className="icon" /> Subida: {speedResults.upload.toFixed(2)} Mbps</p>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: `${(speedResults.upload / 75) * 100}%`}}></div>
                  </div>
                </div>
              </div>
            ) : (
              <p>Ejecuta la prueba para ver los resultados</p>
            )}
          </div>
        </div>
      </div>

      <div className="button-container">
        <button onClick={runSpeedTest} disabled={isLoading} className="start-button">
          {isLoading ? 'Probando...' : 'Iniciar Prueba de Velocidad'}
        </button>
      </div>
    </div>
  );
}