import React, { useState, useEffect } from 'react';
import SpeedTest from '@cloudflare/speedtest';

const SpeedTestComponent = () => {
  const [downloadSpeed, setDownloadSpeed] = useState(null);
  const [uploadSpeed, setUploadSpeed] = useState(null);
  const [ping, setPing] = useState(null);

  useEffect(() => {
    let speedtest;

    const initSpeedTest = async () => {
      try {
        speedtest = await SpeedTest.create({
          autoStart: false,
        });
        
        speedtest.on('runningchange', (running) => {
          console.log(`Test ${running ? 'started' : 'stopped'}`);
        });

        speedtest.on('resultschange', (results) => {
          console.log('Results:', results);
        });

        speedtest.on('finish', (results) => {
          setDownloadSpeed(results.downloadSpeed);
          setUploadSpeed(results.uploadSpeed);
          setPing(results.ping);
        });

        speedtest.on('error', (error) => {
          console.error('Error:', error);
        });

        await speedtest.start();
      } catch (error) {
        console.error('Error initializing SpeedTest:', error);
      }
    };

    initSpeedTest();

    return () => {
      if (speedtest) {
        try {
          // Reemplazamos speedtest.destroy() con speedtest.stop()
          speedtest.stop();
        } catch (error) {
          console.warn('Failed to stop SpeedTest:', error);
        }
      }
    };
  }, []);

  const handleTest = () => {
    window.location.reload();
  };

  return (
    <div>
      <h1>Prueba de Velocidad de Internet</h1>
      {!downloadSpeed && !uploadSpeed && !ping ? (
        <p>Realizando prueba...</p>
      ) : (
        <>
          <p>Velocidad de Descarga: {downloadSpeed} Mbps</p>
          <p>Velocidad de Subida: {uploadSpeed} Mbps</p>
          <p>Ping: {ping} ms</p>
        </>
      )}
      <button onClick={handleTest}>Repetir Prueba</button>
    </div>
  );
};

export default SpeedTestComponent;
