import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { Upload, Download, Gauge } from 'lucide-react'

// Estilos con styled-components
const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background-color: #f3f4f6;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
`

const Card = styled.div`
  width: 100%;
  max-width: 28rem;
  background-color: #ffffff;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
`

const CardHeader = styled.div`
  padding: 1.5rem;
`

const CardTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  text-align: center;
`

const CardDescription = styled.p`
  color: #6b7280;
  font-size: 0.875rem;
  text-align: center;
`

const CardContent = styled.div`
  padding: 1.5rem;
`

const CardFooter = styled.div`
  padding: 1.5rem;
  text-align: center;
  font-size: 0.875rem;
  color: #6b7280;
`

const IpInfo = styled.div`
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: #4b5563;
`

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #ffffff;
  background-color: #3b82f6;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #2563eb;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const Progress = styled.div`
  width: 100%;
  height: 0.5rem;
  background-color: #e5e7eb;
  border-radius: 9999px;
  overflow: hidden;
  margin-top: 1rem;
`

const ProgressBar = styled.div`
  height: 100%;
  background-color: #3b82f6;
  transition: width 0.3s ease;
`

const ResultsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-top: 1.5rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`

const ResultItem = styled.div`
  text-align: center;
`

const ResultIcon = styled.div`
  width: 2rem;
  height: 2rem;
  margin: 0 auto 0.5rem;
  color: ${props => props.color};
`

const ResultValue = styled.p`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
`

const ResultLabel = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
`

// Función para medir el ping
const measurePing = async () => {
  const start = performance.now()
  await fetch('https://www.google.com', { mode: 'no-cors' })
  const end = performance.now()
  return end - start
}

// Función para medir la velocidad de descarga
const measureDownloadSpeed = async () => {
  const fileSize = 5 * 1024 * 1024 // 5MB
  const startTime = performance.now()
  const response = await fetch(`https://speed.cloudflare.com/__down?bytes=${fileSize}`)
  await response.arrayBuffer()
  const endTime = performance.now()
  const durationInSeconds = (endTime - startTime) / 1000
  return (fileSize * 8) / durationInSeconds / 1000000 // Mbps
}

// Función para medir la velocidad de subida
const measureUploadSpeed = async () => {
  const dataSize = 2 * 1024 * 1024 // 2MB
  const data = new ArrayBuffer(dataSize)
  const startTime = performance.now()
  await fetch('https://speed.cloudflare.com/__up', {
    method: 'POST',
    body: data
  })
  const endTime = performance.now()
  const durationInSeconds = (endTime - startTime) / 1000
  return (dataSize * 8) / durationInSeconds / 1000000 // Mbps
}

// Componente SpeedTest
export default function SpeedTest() {
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [downloadSpeed, setDownloadSpeed] = useState(null)
  const [uploadSpeed, setUploadSpeed] = useState(null)
  const [ping, setPing] = useState(null)
  const [ipInfo, setIpInfo] = useState(null)

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => setIpInfo(data))
  }, [])

  const runSpeedTest = async () => {
    setIsLoading(true)
    setProgress(0)
    setDownloadSpeed(null)
    setUploadSpeed(null)
    setPing(null)

    // Medir ping
    setProgress(10)
    const pingResult = await measurePing()
    setPing(Math.round(pingResult))

    // Medir velocidad de descarga
    setProgress(40)
    const downloadResult = await measureDownloadSpeed()
    setDownloadSpeed(Number(downloadResult.toFixed(2)))

    // Medir velocidad de subida
    setProgress(70)
    const uploadResult = await measureUploadSpeed()
    setUploadSpeed(Number(uploadResult.toFixed(2)))

    setProgress(100)
    setIsLoading(false)
  }

  return (
    <Container>
      <Card>
        <CardHeader>
          <CardTitle>SpeedCheck</CardTitle>
          <CardDescription>Comprueba tu velocidad de conexión</CardDescription>
        </CardHeader>
        <CardContent>
          {ipInfo && (
            <IpInfo>
              <p>IP: {ipInfo.ip}</p>
              <p>Ubicación: {ipInfo.city}, {ipInfo.country_name}</p>
              <p>Proveedor: {ipInfo.org}</p>
            </IpInfo>
          )}
          <Button onClick={runSpeedTest} disabled={isLoading}>
            {isLoading ? 'Ejecutando prueba...' : 'Iniciar Test de Velocidad'}
          </Button>
          {isLoading && (
            <Progress>
              <ProgressBar style={{ width: `${progress}%` }} />
            </Progress>
          )}
          <ResultsContainer>
            <ResultItem>
              <ResultIcon color="#3b82f6">
                <Gauge size={32} />
              </ResultIcon>
              <ResultValue>{ping !== null ? `${ping.toFixed(2)} ms` : '-'}</ResultValue>
              <ResultLabel>Ping</ResultLabel>
            </ResultItem>
            <ResultItem>
              <ResultIcon color="#10b981">
                <Download size={32} />
              </ResultIcon>
              <ResultValue>{downloadSpeed !== null ? `${downloadSpeed} Mbps` : '-'}</ResultValue>
              <ResultLabel>Descarga</ResultLabel>
            </ResultItem>
            <ResultItem>
              <ResultIcon color="#ef4444">
                <Upload size={32} />
              </ResultIcon>
              <ResultValue>{uploadSpeed !== null ? `${uploadSpeed} Mbps` : '-'}</ResultValue>
              <ResultLabel>Subida</ResultLabel>
            </ResultItem>
          </ResultsContainer>
        </CardContent>
        <CardFooter>
          Los resultados son estimaciones y pueden variar. Para obtener una medición más precisa, ejecute varias pruebas.
        </CardFooter>
      </Card>
    </Container>
  )
}