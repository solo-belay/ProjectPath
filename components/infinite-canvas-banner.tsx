"use client"
import { motion } from "framer-motion"
import type React from "react"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react"

interface Phase {
  id: number
  title: string
  icon: string
  description: string
}

const colors = [
  { bg: "from-yellow-400 to-yellow-500", dot: "bg-yellow-500" },
  { bg: "from-lime-400 to-green-500", dot: "bg-green-500" },
  { bg: "from-teal-400 to-cyan-500", dot: "bg-cyan-500" },
  { bg: "from-cyan-400 to-blue-500", dot: "bg-blue-500" },
  { bg: "from-blue-400 to-indigo-500", dot: "bg-blue-600" },
  { bg: "from-indigo-400 to-purple-500", dot: "bg-purple-500" },
]

export function InfiniteCanvasBanner({ phases, title }: { phases: Phase[]; title: string }) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setScale(Math.max(0.5, Math.min(3, scale * delta)))
  }

  const handleZoomIn = () => setScale(Math.min(3, scale * 1.2))
  const handleZoomOut = () => setScale(Math.max(0.5, scale * 0.8))
  const handleReset = () => {
    setScale(1)
    setPan({ x: 0, y: 0 })
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex gap-2 mb-4">
        <Button variant="outline" size="sm" onClick={handleZoomIn}>
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleZoomOut}>
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleReset}>
          <RotateCcw className="w-4 h-4" />
        </Button>
        <span className="text-sm text-muted-foreground ml-auto self-center">{(scale * 100).toFixed(0)}%</span>
      </div>

      <div
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className="w-full h-96 bg-card/30 border border-border/50 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing"
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: "0 0",
            transition: isDragging ? "none" : "transform 0.1s",
          }}
          className="w-full p-8"
        >
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            {/* Title */}
            <div className="text-center space-y-2 mb-12">
              <h1 className="text-3xl font-bold text-balance">{title.toUpperCase()}</h1>
              <p className="text-sm text-muted-foreground">
                Structured approach to delivering technology solutions for business transformation
              </p>
            </div>

            {/* Pentagon cards */}
            <div className="flex items-start justify-center gap-8 flex-wrap">
              {phases.map((phase, idx) => {
                const color = colors[idx % colors.length]

                return (
                  <motion.div
                    key={phase.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="relative"
                  >
                    {/* Pentagon shape */}
                    <div
                      className={`w-48 h-56 bg-gradient-to-br ${color.bg} rounded-t-3xl rounded-b-lg shadow-lg flex flex-col items-center justify-end pb-6 px-4`}
                      style={{
                        clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)",
                      }}
                    >
                      <h3 className="text-lg font-bold text-gray-900 text-center mb-2">{phase.title.split(":")[0]}</h3>
                      {phase.title.includes(":") && (
                        <p className="text-xs text-gray-800 text-center font-semibold">{phase.title.split(":")[1]}</p>
                      )}
                    </div>

                    {/* White circle with icon */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: idx * 0.1 + 0.1 }}
                      className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center text-4xl border-4 border-white"
                    >
                      {phase.icon}
                    </motion.div>

                    {/* Phase number */}
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 font-bold text-sm text-gray-800 pointer-events-none">
                      {`0${idx + 1}`}
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Dashed timeline */}
            <div className="flex items-center justify-center mt-20 px-8">
              <svg className="w-full h-12" viewBox="0 0 1400 50" preserveAspectRatio="none">
                <line
                  x1="0"
                  y1="25"
                  x2="1400"
                  y2="25"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="10,10"
                  opacity="0.3"
                />
                {phases.map((_, idx) => {
                  const x = ((idx + 0.5) / phases.length) * 1400
                  return <circle key={`dot-${idx}`} cx={x} cy="25" r="8" className={colors[idx % colors.length].dot} />
                })}
              </svg>
            </div>

            {/* Phase descriptions */}
            <div className="grid gap-8 mt-12">
              {phases.map((phase, idx) => (
                <motion.div
                  key={`desc-${phase.id}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.1 + 0.2 }}
                  className="text-center"
                >
                  <h4 className="font-semibold text-lg mb-3">{phase.title}</h4>
                  <p className="text-muted-foreground text-sm max-w-3xl mx-auto leading-relaxed">{phase.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
