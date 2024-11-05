import React, { useState, useEffect } from 'react';
import { Upload, Download, Gauge } from 'lucide-react';

// Función para medir el ping
const measurePing = async () => {
  try {
    const start = performance.now();
    await fetch('https://www.google.com', { mode: 'no-cors' });
    const end = performance.now();
    return end - start;
  } catch (error) {
    console.error('Error al medir el ping:', error);
    return null;
  }
};

// Función para medir la velocidad de descarga
const measureDownloadSpeed = async () => {
  try {
    const fileSize = 5 * 1024 * 1024; // 5MB
    const startTime = performance.now();
    const response = await fetch(`https://speed.cloudflare.com/__down?bytes=${fileSize}`);
    await response.arrayBuffer();
    const endTime = performance.now();
    const durationInSeconds = (endTime - startTime) / 1000;
    return (fileSize * 8) / durationInSeconds / 1000000; // Mbps
  } catch (error) {
    console.error('Error al medir la velocidad de descarga:', error);
    return null;
  }
};

// Función para medir la velocidad de subida
const measureUploadSpeed = async () => {
  try {
    const dataSize = 2 * 1024 * 1024; // 2MB
    const data = new ArrayBuffer(dataSize);
    const startTime = performance.now();
    await fetch('https://speed.cloudflare.com/__up', {
      method: 'POST',
      body: data,
    });
    const endTime = performance.now();
    const durationInSeconds = (endTime - startTime) / 1000;
    return (dataSize * 8) / durationInSeconds / 1000000; // Mbps
  } catch (error) {
    console.error('Error al medir la velocidad de subida:', error);
    return null;
  }
};

// Componente SpeedTest
export default function SpeedTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState(null);
  const [uploadSpeed, setUploadSpeed] = useState(null);
  const [ping, setPing] = useState(null);
  const [ipInfo, setIpInfo] = useState(null);
  const [host, setHost] = useState(window.location.hostname);

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => setIpInfo(data))
      .catch(error => console.error('Error al obtener información IP:', error));
  }, []);

  const runSpeedTest = async () => {
    setIsLoading(true);
    setProgress(0);
    setDownloadSpeed(null);
    setUploadSpeed(null);
    setPing(null);

    // Medir ping
    setProgress(10);
    const pingResult = await measurePing();
    setPing(pingResult !== null ? Math.round(pingResult) : 'Error');

    // Medir velocidad de descarga
    setProgress(40);
    const downloadResult = await measureDownloadSpeed();
    setDownloadSpeed(downloadResult !== null ? Number(downloadResult.toFixed(2)) : 'Error');

    // Medir velocidad de subida
    setProgress(70);
    const uploadResult = await measureUploadSpeed();
    setUploadSpeed(uploadResult !== null ? Number(uploadResult.toFixed(2)) : 'Error');

    setProgress(100);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100 font-sans">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md">
        <div className="p-6">
          <h3 className="text-xl font-semibold text-center">SpeedCheck</h3>
          <p className="text-gray-600 text-center">Comprueba tu velocidad de Internet</p>
        </div>
        <div className="p-6">
          {ipInfo && (
            <div className="mb-4 text-gray-800 text-sm">
              <p>IP: {ipInfo.ip}</p>
              <p>Ubicación: {ipInfo.city}, {ipInfo.country_name}</p>
              <p>Proveedor: {ipInfo.org}</p>
              <p>Host: {host}</p> {/* Mostrar el host aquí */}
            </div>
          )}
          <button
            className={`w-full py-2 px-4 font-medium text-white bg-blue-600 rounded transition duration-200 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
            onClick={runSpeedTest}
            disabled={isLoading}
          >
            {isLoading ? 'Ejecutando prueba...' : 'Iniciar Test de Velocidad'}
          </button>
          {isLoading && (
            <div className="w-full h-1 bg-gray-300 rounded mt-4">
              <div className="h-full bg-blue-600" style={{ width: `${progress}%` }} />
            </div>
          )}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="w-8 h-8 mx-auto text-blue-600">
                <Gauge size={32} />
              </div>
              <p className="text-lg font-semibold">{ping !== null ? `${ping} ms` : '-'}</p>
              <p className="text-sm text-gray-600">Ping</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 mx-auto text-green-600">
                <Download size={32} />
              </div>
              <p className="text-lg font-semibold">{downloadSpeed !== null ? `${downloadSpeed} Mbps` : '-'}</p>
              <p className="text-sm text-gray-600">Descarga</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 mx-auto text-red-600">
                <Upload size={32} />
              </div>
              <p className="text-lg font-semibold">{uploadSpeed !== null ? `${uploadSpeed} Mbps` : '-'}</p>
              <p className="text-sm text-gray-600">Subida</p>
            </div>
          </div>
        </div>
        <div className="p-6 text-center text-sm text-gray-600">
          Los resultados son estimaciones y pueden variar. Para obtener una medición más precisa, ejecute varias pruebas.
        </div>
      </div>
    </div>
  );
}
