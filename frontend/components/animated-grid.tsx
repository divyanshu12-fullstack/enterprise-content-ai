"use client"

import { useEffect, useRef } from "react"

interface AnimatedGridProps {
  className?: string
}

export function AnimatedGrid({ className }: AnimatedGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    let time = 0

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = canvas.offsetWidth * dpr
      canvas.height = canvas.offsetHeight * dpr
      ctx.scale(dpr, dpr)
    }

    const draw = () => {
      if (!ctx || !canvas) return

      const width = canvas.offsetWidth
      const height = canvas.offsetHeight

      ctx.clearRect(0, 0, width, height)

      const gridSize = 40
      const cols = Math.ceil(width / gridSize) + 1
      const rows = Math.ceil(height / gridSize) + 1

      ctx.strokeStyle = "rgba(139, 92, 246, 0.08)"
      ctx.lineWidth = 1

      // Draw vertical lines with wave effect
      for (let i = 0; i < cols; i++) {
        ctx.beginPath()
        const x = i * gridSize
        const offset = Math.sin(time * 0.002 + i * 0.1) * 2
        ctx.moveTo(x + offset, 0)
        for (let j = 0; j < rows; j++) {
          const y = j * gridSize
          const waveOffset = Math.sin(time * 0.002 + i * 0.1 + j * 0.05) * 2
          ctx.lineTo(x + waveOffset, y)
        }
        ctx.stroke()
      }

      // Draw horizontal lines with wave effect
      for (let j = 0; j < rows; j++) {
        ctx.beginPath()
        const y = j * gridSize
        const offset = Math.sin(time * 0.002 + j * 0.1) * 2
        ctx.moveTo(0, y + offset)
        for (let i = 0; i < cols; i++) {
          const x = i * gridSize
          const waveOffset = Math.sin(time * 0.002 + j * 0.1 + i * 0.05) * 2
          ctx.lineTo(x, y + waveOffset)
        }
        ctx.stroke()
      }

      // Draw glowing intersection points
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * gridSize
          const y = j * gridSize
          const pulse = Math.sin(time * 0.003 + i * 0.2 + j * 0.2) * 0.5 + 0.5
          
          if (pulse > 0.7) {
            ctx.beginPath()
            ctx.arc(x, y, 1.5, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(139, 92, 246, ${pulse * 0.4})`
            ctx.fill()
          }
        }
      }

      time++
      animationFrameId = requestAnimationFrame(draw)
    }

    resize()
    draw()

    window.addEventListener("resize", resize)

    return () => {
      window.removeEventListener("resize", resize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className || ""}`}
    />
  )
}
