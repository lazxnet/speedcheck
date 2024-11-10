import React, { useState, useEffect } from 'react';
import { Upload, Download, Gauge } from 'lucide-react';
import { motion } from 'framer-motion';

// Función para medir el ping
const measurePing = async () => {
  const attempts = 3;
  const results = [];

  for (let i = 0; i < attempts; i++) {
    try {
      const start = performance.now();
      await fetch('https://www.google.com', { mode: 'no-cors' });
      const end = performance.now();
      results.push(end - start);
    } catch (error) {
      console.error('Error al medir el ping:', error);
    }
  }

  if (results.length === 0) {
    throw new Error('No se pudo medir el ping después de múltiples intentos');
  }

  // Calcular la mediana del ping
  results.sort((a, b) => a - b);
  const median = results[Math.floor(results.length / 2)];
  return median;
};

// Función para medir la velocidad de descarga
const measureDownloadSpeed = async () => {
  try {
    const fileSize = 5 * 1024 * 1024; // 5MB
    const startTime = performance.now();
    const response = await fetch(`https://speed.cloudflare.com/__down?bytes=${fileSize}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    await response.arrayBuffer();
    const endTime = performance.now();
    const durationInSeconds = (endTime - startTime) / 1000;
    return (fileSize * 8) / durationInSeconds / 1000000; // Mbps
  } catch (error) {
    console.error('Error al medir la velocidad de descarga:', error);
    throw error;
  }
};

// Función para medir la velocidad de subida
const measureUploadSpeed = async () => {
  try {
    const dataSize = 2 * 1024 * 1024; // 2MB
    const data = new ArrayBuffer(dataSize);
    const startTime = performance.now();
    const response = await fetch('https://speed.cloudflare.com/__up', {
      method: 'POST',
      body: data,
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const endTime = performance.now();
    const durationInSeconds = (endTime - startTime) / 1000;
    return (dataSize * 8) / durationInSeconds / 1000000; // Mbps
  } catch (error) {
    console.error('Error al medir la velocidad de subida:', error);
    throw error;
  }
};

const checkInternetConnection = async () => {
  try {
    await fetch('https://www.google.com', { mode: 'no-cors', cache: 'no-store' });
    return true;
  } catch (error) {
    console.error('Error checking internet connection:', error);
    return false;
  }
};

// Componente SpeedTest
const SpeedTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState(null);
  const [uploadSpeed, setUploadSpeed] = useState(null);
  const [ping, setPing] = useState(null);
  const [ipInfo, setIpInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchIpInfo = async () => {
      try {
        const isConnected = await checkInternetConnection();
        if (!isConnected) {
          throw new Error('No hay conexión a Internet. No se puede obtener la información IP.');
        }

        const res = await fetch('https://ipapi.co/json/');
        if (!res.ok) {
          throw new Error('Error al obtener información IP');
        }
        const data = await res.json();
        setIpInfo(data);
      } catch (error) {
        console.error('Error al obtener información IP:', error);
        setError(error.message || 'No se pudo obtener la información IP');
      }
    };

    fetchIpInfo();
  }, []);

  const runSpeedTest = async () => {
    setIsLoading(true);
    setProgress(0);
    setDownloadSpeed(null);
    setUploadSpeed(null);
    setPing(null);
    setError(null);

    try {
      const isConnected = await checkInternetConnection();
      if (!isConnected) {
        throw new Error('No hay conexión a Internet. Por favor, verifique su conexión e intente nuevamente.');
      }

      // Medir ping
      setProgress(10);
      const pingResult = await measurePing();
      setPing(Math.round(pingResult));

      // Medir velocidad de descarga
      setProgress(40);
      const downloadResult = await measureDownloadSpeed();
      setDownloadSpeed(Number(downloadResult.toFixed(2)));

      // Medir velocidad de subida
      setProgress(70);
      const uploadResult = await measureUploadSpeed();
      setUploadSpeed(Number(uploadResult.toFixed(2)));

      setProgress(100);
    } catch (error) {
      console.error('Error durante la prueba de velocidad:', error);
      setError(error.message || 'Ocurrió un error durante la prueba. Por favor, inténtelo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100 font-sans">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white rounded-lg shadow-md overflow-hidden"
      >
        <div className="p-6 bg-blue-600 text-white">
          <h3 className="text-2xl font-semibold text-center">SpeedCheck</h3>
          <p className="text-center opacity-80">Comprueba tu velocidad de Internet</p>
        </div>
        <div className="p-6">
          {ipInfo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-4 text-gray-800 text-sm"
            >
              <p>IP: {ipInfo.ip}</p>
              <p>Ubicación: {ipInfo.city}, {ipInfo.country_name}</p>
              <p>Proveedor: {ipInfo.org}</p>
            </motion.div>
          )}
          <button
            className={`w-full py-3 px-4 font-medium text-white bg-blue-600 rounded-full transition duration-200 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
            }`}
            onClick={runSpeedTest}
            disabled={isLoading}
          >
            {isLoading ? 'Ejecutando prueba...' : 'Iniciar Test de Velocidad'}
          </button>
          {isLoading && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              className="h-2 bg-blue-600 rounded-full mt-4"
            />
          )}
          <div className="grid grid-cols-3 gap-4 mt-6">
            {['ping', 'download', 'upload'].map((metric) => (
              <motion.div
                key={metric}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.3 }}
                className="text-center"
              >
                <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${
                  metric === 'ping' ? 'bg-blue-100 text-blue-600' :
                  metric === 'download' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                  {metric === 'ping' ? <Gauge size={24} /> :
                   metric === 'download' ? <Download size={24} /> : <Upload size={24} />}
                </div>
                <p className="text-lg font-semibold mt-2">
                  {metric === 'ping' ? (ping !== null ? `${ping} ms` : '-') :
                   metric === 'download' ? (downloadSpeed !== null ? `${downloadSpeed} Mbps` : '-') :
                   (uploadSpeed !== null ? `${uploadSpeed} Mbps` : '-')}
                </p>
                <p className="text-sm text-gray-600">
                  {metric === 'ping' ? 'Ping' : metric === 'download' ? 'Descarga' : 'Subida'}
                </p>
              </motion.div>
            ))}
          </div>
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 text-red-600 text-center"
            >
              {error}
            </motion.p>
          )}
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="p-4 bg-gray-100 text-center text-sm text-gray-600"
        >
          Los resultados son estimaciones y pueden variar. Para obtener una medición más precisa, ejecute varias pruebas.
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SpeedTest;