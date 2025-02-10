import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

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

const fetchIpInfo = async (setIpInfo, setError) => {
  try {
    const isConnected = await checkInternetConnection();
    if (!isConnected) {
      throw new Error("No hay conexión a Internet. No se puede obtener la información IP.");
    }

    const res = await fetch("https://api.ipquery.io/?format=json");
    if (!res.ok) throw new Error("Error al obtener información IP");

    const data = await res.json();

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
    setError(error.message || "No se pudo obtener la información IP");
  }
};

const measurePing = async () => {
  const attempts = 3;
  const url = "https://www.google.com";

  try {
    let minPing = Infinity;
    for (let i = 0; i < attempts; i++) {
      try {
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
        if (duration < minPing) minPing = duration;
      } catch (error) {
        console.error("Error en intento de ping:", error);
      }
    }
    return Math.floor(minPing);
  } catch (error) {
    throw new Error("Error al medir el ping");
  }
};

const measureDownloadSpeed = async () => {
  const fileSize = 5 * 1024 * 1024;
  try {
    const startTime = performance.now();
    const response = await fetch(`https://speed.cloudflare.com/__down?bytes=${fileSize}`);
    if (!response.ok) throw new Error(`Error HTTP! Estado: ${response.status}`);
    
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength !== fileSize) throw new Error("Tamaño del archivo incorrecto");
    
    const duration = (performance.now() - startTime) / 1000;
    return Number(((fileSize * 8) / (duration * 1000000)).toFixed(2));
  } catch (error) {
    throw new Error("Error al medir la velocidad de descarga");
  }
};

const measureUploadSpeed = async () => {
  const fileSize = 1 * 1024 * 1024;
  const dummyData = new Uint8Array(fileSize).fill(97);

  try {
    const startTime = performance.now();
    const response = await fetch("https://httpbin.org/post", {
      method: "POST",
      body: dummyData,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": fileSize.toString(),
      },
    });
    if (!response.ok) throw new Error(`Error HTTP! Estado: ${response.status}`);
    
    const duration = (performance.now() - startTime) / 1000;
    return Number(((fileSize * 8) / (duration * 1000000)).toFixed(2));
  } catch (error) {
    throw new Error("Error al medir la velocidad de subida");
  }
};

const checkInternetConnection = async () => {
  try {
    await fetch("https://www.google.com", { mode: "no-cors", cache: "no-store" });
    return true;
  } catch (error) {
    return false;
  }
};

const SpeedTest = () => {
  const [isLoading, setIsLoading] = useState(false);
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
    if (isTesting) return;
    setIsTesting(true);
    setIsLoading(true);
    setDownloadSpeed(null);
    setUploadSpeed(null);
    setPing(null);
    setError(null);
    setLatencyWarning(false);

    try {
      if (!(await checkInternetConnection())) {
        throw new Error("No hay conexión a Internet. Verifique su conexión.");
      }

      const pingResult = await measurePing();
      setPing(pingResult);
      if (pingResult >= 250) setLatencyWarning(true);

      setDownloadSpeed(await measureDownloadSpeed());
      setUploadSpeed(await measureUploadSpeed());
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
      setIsTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A2333] text-white font-sans">
      <header className="p-4 flex justify-center items-center">
        <h1 className="text-2xl font-bold">SpeedCheck</h1>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 p-4 bg-red-900/50 text-red-300 rounded-lg"
            >
              {error}
            </motion.div>
          )}

          {latencyWarning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 p-4 bg-yellow-900/50 text-yellow-300 rounded-lg"
            >
              ¡Alta latencia detectada! (Ping ≥250ms)
            </motion.div>
          )}

          {ipInfo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center mb-8 text-teal-400"
            >
              <p className="text-lg">{ipInfo.isp.org}</p>
              <p className="text-lg">
                {ipInfo.location.city}, {ipInfo.location.country}
              </p>
              <p className="text-sm text-gray-400">{ipInfo.ip}</p>
            </motion.div>
          )}

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
              >
                <motion.div
                  className="absolute w-56 h-56 border-4 border-transparent rounded-full"
                  style={{ borderTopColor: "#10b981", borderRightColor: "#10b981" }}
                  animate={{
                    rotate: 360,
                    scale: [1, 1.1, 1],
                    borderWidth: ["4px", "8px", "4px"],
                  }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
                <div className="absolute flex space-x-2">
                  {[...Array(3)].map((_, i) => (
                    <motion.span
                      key={i}
                      className="w-2 h-2 bg-emerald-400 rounded-full"
                      animate={{ y: [0, -10, 0], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-8 mb-12">
            {[
              { label: "PING", value: ping, unit: "ms", icon: <GaugeIcon /> },
              { label: "DESCARGA", value: downloadSpeed, unit: "Mbps", icon: <DownloadIcon /> },
              { label: "SUBIDA", value: uploadSpeed, unit: "Mbps", icon: <UploadIcon /> },
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