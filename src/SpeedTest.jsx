import React, { useState, useEffect } from 'react';
import { Upload, Download, Gauge } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Función externa para obtener información IP
const fetchIpInfo = async (setIpInfo, setError) => {
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

// Función para medir el ping
const measurePing = async () => {
  const attempts = 3; // Número de intentos
  const url = 'https://www.google.com'; // URL a medir

  try {
    let minPing = Infinity;

    // Realiza intentos secuenciales para permitir reuso de conexiones
    for (let i = 0; i < attempts; i++) {
      try {
        // Usa un parámetro único para evitar caché y rastrear la solicitud
        const uniqueUrl = `${url}?ping=${Date.now()}`;
        const startTime = performance.now();
        
        await fetch(uniqueUrl, {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-store',
          credentials: 'omit',
          referrerPolicy: 'no-referrer'
        });
        
        const duration = performance.now() - startTime;
        
        // Actualiza el ping mínimo encontrado
        if (duration < minPing) minPing = duration;
        
      } catch (error) {
        console.error("Error en intento de ping:", error);
      }
    }

    if (minPing === Infinity) {
      throw new Error("Todos los intentos fallaron");
    }

    return Math.floor(minPing);
  } catch (error) {
    console.error('Error al medir el ping:', error);
    throw error;
  }
};

// Función para medir la velocidad de descarga
const measureDownloadSpeed = async () => {
  const fileSize = 5 * 1024 * 1024; // 5MB
  const controller = new AbortController(); // AbortController para cancelar la solicitud si es necesario

  try {
    const startTime = performance.now();

    // Realizar la solicitud de descarga
    const response = await fetch(`https://speed.cloudflare.com/__down?bytes=${fileSize}`, {
      signal: controller.signal, // Asignar el AbortController a la solicitud
    });

    // Verificar si la respuesta es válida
    if (!response.ok) {
      throw new Error(`Error HTTP! Estado: ${response.status}`);
    }

    // Leer el contenido de la respuesta
    const buffer = await response.arrayBuffer();

    // Validar el tamaño del archivo descargado
    if (buffer.byteLength !== fileSize) {
      throw new Error(`Tamaño del archivo incorrecto. Esperado: ${fileSize} bytes, Recibido: ${buffer.byteLength} bytes`);
    }

    const endTime = performance.now();

    // Calcular la velocidad de descarga en Mbps
    const durationInSeconds = (endTime - startTime) / 1000;
    const speedMbps = (fileSize * 8) / (durationInSeconds * 1000000); // Mbps
    return Number(speedMbps.toFixed(2)); // Redondear a 2 decimales
  } catch (error) {
    console.error('Error al medir la velocidad de descarga:', error);

    // Lanzar un error más específico
    if (error.name === 'AbortError') {
      throw new Error('La medición de velocidad de descarga fue cancelada.');
    } else {
      throw new Error(`Error al medir la velocidad de descarga: ${error.message}`);
    }
  }
};

// Función para medir la velocidad de subida
const measureUploadSpeed = async () => {
  const fileSize = 1 * 1024 * 1024; // 1MB
  const controller = new AbortController(); // AbortController para cancelar la solicitud si es necesario

  // TODO: Crear un buffer de datos ficticios para subir
  const dummyData = new Uint8Array(fileSize).fill(97); // Datos de ejemplo (carácter 'a')

  try{
    const startTime = performance.now();

    //TODO: Usar el endpoint de subida y metodo POST
    const response = await fetch('https://httpbin.org/post', {
      method: 'POST',
      body: dummyData,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': fileSize.toString(), // Especificar tamaño
      },
    });

    if (!response.ok) {
      throw new Error(`Error HTTP! Estado: ${response.status}`);
    }

    const endTime = performance.now();
    const durationInSeconds = (endTime - startTime) /1000;
    const speedMbps = (fileSize * 8) / (durationInSeconds * 1000000); 
    return Number(speedMbps.toFixed(2));
  } catch (error){
    console.error("Error en subida: ", error);
    throw new Error(`Error de red: ${error.message}`);
  }
};

const checkInternetConnection = async () => {
  const timeout = 5000; // 5 segundos
  const controller = new AbortController();
  const timeoutID = setTimeout(() => controller.abort(), timeout);

  try {
    await fetch("https://www.google.com", {mode: 'no-cors', cache:'no-store', signal: controller.signal});
    clearTimeout(timeoutID);
    return true;
  } catch (error) {
    console.error("Error checking internet connection: ", error);
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
  const [latencyWarning, setLatencyWarning] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    fetchIpInfo(setIpInfo, setError);
  }, []);

  const runSpeedTest = async () => {
    if (isTesting) return; // Evita múltiples ejecuciones
    setIsTesting(true);
    setIsLoading(true);
    setProgress(0);
    setDownloadSpeed(null);
    setUploadSpeed(null);
    setPing(null);
    setError(null);
    setLatencyWarning(false);

    try {
      const isConnected = await checkInternetConnection();
      if (!isConnected) {
        throw new Error('No hay conexión a Internet. Por favor, verifique su conexión e intente nuevamente.');
      }

      // Medir ping
      setProgress(10);
      const pingResult = await measurePing();
      setPing(Math.round(pingResult));
      
      // Check pingResult si es mayor o igual a 250 ms
      if (pingResult >= 250) {
        setLatencyWarning(true);
      }

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
      setIsTesting(false);
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
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-4 text-gray-800 text-sm overflow-hidden"
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
            {['latencia', 'download', 'upload'].map((metric) => (
              <motion.div
                key={metric}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.3 }}
                className="text-center"
              >
                <motion.div 
                  className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${
                    metric === 'latencia' ? 'bg-blue-100 text-blue-600' :
                    metric === 'download' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {metric === 'latencia' ? <Gauge size={24} /> :
                   metric === 'download' ? <Download size={24} /> : <Upload size={24} />}
                </motion.div>
                <motion.p 
                  className="text-lg font-semibold mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  {metric === 'latencia' ? (ping !== null ? `${ping} ms` : '-') :
                   metric === 'download' ? (downloadSpeed !== null ? `${downloadSpeed} Mbps` : '-') :
                   (uploadSpeed !== null ? `${uploadSpeed} Mbps` : '-')}
                </motion.p>
                <p className="text-sm text-gray-600">
                  {metric === 'latencia' ? 'Latencia' : metric === 'download' ? 'Descarga' : 'Subida'}
                </p>
              </motion.div>
            ))}
          </div>
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                className="mt-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded"
                role="alert"
              >
                <p className="font-bold">Error</p>
                {error}
              </motion.p>
            )}
            {latencyWarning && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                className="mt-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded"
                role="alert"
              >
                <p className="font-bold">Advertencia</p>
                Su conexión es inestable.
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="p-4 bg-gray-100 text-center text-sm text-gray-600"
        >
          Los resultados son estimaciones y pueden variar. Para obtener una medición más precisa, ejecute varias pruebas.
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SpeedTest;