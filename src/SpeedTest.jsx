import React, { useState, useEffect } from "react";
import { motion} from "framer-motion";

// SVG icons
const UploadIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="17 8 12 3 7 8"></polyline>
    <line x1="12" y1="3" x2="12" y2="15"></line>
  </svg>
);

const DownloadIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);

const GaugeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M16.2 7.8l-2.8 2.8"></path>
    <path d="M2 12h2"></path>
    <path d="M12 2v2"></path>
    <path d="M22 12h-2"></path>
    <path d="M12 22v-2"></path>
    <path d="M20 12a8 8 0 0 0-8-8"></path>
    <path d="M12 12v3.5"></path>
  </svg>
);

// Función para obtener información IP
const fetchIpInfo = async (setIpInfo, setError) => {
  try {
    const isConnected = await checkInternetConnection();
    if (!isConnected) {
      throw new Error(
        "No hay conexión a Internet. No se puede obtener la información IP."
      );
    }

    const res = await fetch("https://api.ipquery.io/?format=json");
    if (!res.ok) {
      throw new Error("Error al obtener información IP");
    }

    //Pasar la respuesta en JSON
    const data = await res.json();

    // Estructuramos los datos para que sean más fáciles de usar
    const ipInfo = {
      ip: data.ip,
      isp: {
        asn: data.isp.asn,
        org: data.isp.org,
        isp: data.isp.isp,
      },
      location: {
        country: data.location.country,
        countryCode: data.location.country_code,
        city: data.location.city,
        state: data.location.state,
        zipcode: data.location.zipcode,
        latitude: data.location.latitude,
        longitude: data.location.longitude,
        timezone: data.location.timezone,
        localtime: data.location.localtime,
      },
      risk: {
        isMobile: data.risk.is_mobile,
        isVpn: data.risk.is_vpn,
        isTor: data.risk.is_tor,
        isProxy: data.risk.is_proxy,
        isDatacenter: data.risk.is_datacenter,
        riskScore: data.risk.risk_score,
      },
    };

    setIpInfo(ipInfo);
  } catch (error) {
    console.error("Error al obtener información IP:", error);
    setError(error.message || "No se pudo obtener la información IP");
  }
};

// Función para medir el ping
const measurePing = async () => {
  const attempts = 3; // Número de intentos
  const url = "https://www.google.com"; // URL a medir

  try {
    let minPing = Infinity;

    // Realiza intentos secuenciales para permitir reuso de conexiones
    for (let i = 0; i < attempts; i++) {
      try {
        // Usa un parámetro único para evitar caché y rastrear la solicitud
        const uniqueUrl = `${url}?ping=${Date.now()}`;
        const startTime = performance.now();

        await fetch(uniqueUrl, {
          method: "HEAD",
          mode: "no-cors",
          cache: "no-store",
          credentials: "omit",
          referrerPolicy: "no-referrer",
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
    console.error("Error al medir el ping:", error);
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
    const response = await fetch(
      `https://speed.cloudflare.com/__down?bytes=${fileSize}`,
      {
        signal: controller.signal, // Asignar el AbortController a la solicitud
      }
    );

    // Verificar si la respuesta es válida
    if (!response.ok) {
      throw new Error(`Error HTTP! Estado: ${response.status}`);
    }

    // Leer el contenido de la respuesta
    const buffer = await response.arrayBuffer();

    // Validar el tamaño del archivo descargado
    if (buffer.byteLength !== fileSize) {
      throw new Error(
        `Tamaño del archivo incorrecto. Esperado: ${fileSize} bytes, Recibido: ${buffer.byteLength} bytes`
      );
    }

    const endTime = performance.now();

    // Calcular la velocidad de descarga en Mbps
    const durationInSeconds = (endTime - startTime) / 1000;
    const speedMbps = (fileSize * 8) / (durationInSeconds * 1000000); // Mbps
    return Number(speedMbps.toFixed(2)); // Redondear a 2 decimales
  } catch (error) {
    console.error("Error al medir la velocidad de descarga:", error);

    // Lanzar un error más específico
    if (error.name === "AbortError") {
      throw new Error("La medición de velocidad de descarga fue cancelada.");
    } else {
      throw new Error(
        `Error al medir la velocidad de descarga: ${error.message}`
      );
    }
  }
};

// Función para medir la velocidad de subida
const measureUploadSpeed = async () => {
  const fileSize = 1 * 1024 * 1024; // 1MB
  const controller = new AbortController(); // AbortController para cancelar la solicitud si es necesario

  // TODO: Crear un buffer de datos ficticios para subir
  const dummyData = new Uint8Array(fileSize).fill(97); // Datos de ejemplo (carácter 'a')

  try {
    const startTime = performance.now();

    //TODO: Usar el endpoint de subida y metodo POST
    const response = await fetch("https://httpbin.org/post", {
      method: "POST",
      body: dummyData,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": fileSize.toString(), // Especificar tamaño
      },
    });

    if (!response.ok) {
      throw new Error(`Error HTTP! Estado: ${response.status}`);
    }

    const endTime = performance.now();
    const durationInSeconds = (endTime - startTime) / 1000;
    const speedMbps = (fileSize * 8) / (durationInSeconds * 1000000);
    return Number(speedMbps.toFixed(2));
  } catch (error) {
    console.error("Error en subida: ", error);
    throw new Error(`Error de red: ${error.message}`);
  }
};

const checkInternetConnection = async () => {
  const timeout = 5000; // 5 segundos
  const controller = new AbortController();
  const timeoutID = setTimeout(() => controller.abort(), timeout);

  try {
    await fetch("https://www.google.com", {
      mode: "no-cors",
      cache: "no-store",
      signal: controller.signal,
    });
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
        throw new Error(
          "No hay conexión a Internet. Por favor, verifique su conexión e intente nuevamente."
        );
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
      console.error("Error durante la prueba de velocidad:", error);
      setError(
        error.message ||
          "Ocurrió un error durante la prueba. Por favor, inténtelo de nuevo."
      );
    } finally {
      setIsLoading(false);
      setIsTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A2333] text-white font-sans">
      {/* Header */}
      <header className="p-4 flex justify-center items-center">
        {" "}
        {/* Updated Header */}
        <h1 className="text-2xl font-bold">SpeedCheck</h1>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Server Info */}
          {ipInfo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center mb-8 text-teal-400"
            >
              <p className="text-lg">{ipInfo.isp.org}</p>
              <p className="text-lg">
                {ipInfo.location.city} , {ipInfo.location.country}
              </p>
              <p className="text-sm text-gray-400">{ipInfo.ip}</p>
            </motion.div>
          )}

          {/* Test Button */}
          <div className="relative flex justify-center items-center mb-12">
            <motion.button
              onClick={runSpeedTest}
              disabled={isLoading}
              className={`w-48 h-48 rounded-full bg-transparent border-4 ${
                isLoading ? "border-emerald-500/50" : "border-emerald-500"
              } flex items-center justify-center text-2xl font-bold transition-all 
              hover:border-teal-400 hover:text-teal-400 hover:scale-105 focus:outline-none 
              disabled:opacity-50 disabled:cursor-not-allowed`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isLoading ? "" : "GO"}
            </motion.button>

            {isLoading && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {/* Anillo principal giratorio */}
                <motion.div
                  className="absolute w-56 h-56 border-4 border-transparent rounded-full"
                  style={{
                    borderTopColor: "#10b981",
                    borderRightColor: "#10b981",
                  }}
                  animate={{
                    rotate: 360,
                    scale: [1, 1.1, 1],
                    borderWidth: ["4px", "8px", "4px"],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "anticipate",
                  }}
                />

                {/* Anillo secundario contragiratorio */}
                <motion.div
                  className="absolute w-64 h-64 border-4 border-transparent rounded-full"
                  style={{
                    borderBottomColor: "#2dd4bf",
                    borderLeftColor: "#2dd4bf",
                  }}
                  animate={{
                    rotate: -360,
                    scale: [0.9, 1, 0.9],
                    opacity: [0.8, 1, 0.8],
                  }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />

                {/* Puntos saltarines */}
                <div className="absolute flex space-x-2">
                  {[...Array(3)].map((_, i) => (
                    <motion.span
                      key={i}
                      className="w-2 h-2 bg-emerald-400 rounded-full"
                      animate={{
                        y: [0, -10, 0],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Results */}
          <div className="grid grid-cols-3 gap-8 mb-12">
            {[
              { label: "PING", value: ping, unit: "ms", icon: <GaugeIcon /> },
              {
                label: "DESCARGA",
                value: downloadSpeed,
                unit: "Mbps",
                icon: <DownloadIcon />,
              },
              {
                label: "SUBIDA",
                value: uploadSpeed,
                unit: "Mbps",
                icon: <UploadIcon />,
              },
            ].map(({ label, value, unit, icon }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <div className="mb-2 text-emerald-500">{icon}</div>
                <p className="text-3xl font-bold mb-1">{value || "-"}</p>
                <p className="text-sm text-gray-400">{unit}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SpeedTest;
