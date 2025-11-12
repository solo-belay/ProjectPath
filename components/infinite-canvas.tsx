"use client"
import { useRef, useEffect, useState } from "react"
import type React from "react"

interface Phase {
  id: number
  title: string
  icon: string
  description: string
}

interface InfiniteCanvasProps {
  phases: Phase[]
  title: string
}

export function InfiniteCanvas({ phases, title }: InfiniteCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setScale((prev) => Math.max(0.5, Math.min(3, prev * delta)))
  }

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

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.addEventListener("wheel", handleWheel, { passive: false })
    return () => container.removeEventListener("wheel", handleWheel)
  }, [])

  // Calculate points along a smooth bezier curve
  const pathPoints = [
    { x: 200, y: 200, quarter: "Q1" },
    { x: 500, y: 150, quarter: "Q2" },
    { x: 800, y: 300, quarter: "Q3" },
    { x: 1000, y: 600, quarter: "Q4" },
    { x: 700, y: 900, quarter: "Q5" },
    { x: 400, y: 800, quarter: "Q6" },
    { x: 200, y: 1000, quarter: "Q7" },
  ]

  return (
    <div
      ref={containerRef}
      className="w-full bg-gradient-to-br from-background via-card/30 to-background rounded-lg overflow-hidden cursor-grab active:cursor-grabbing relative"
      style={{ minHeight: "600px" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <svg
        className="w-full h-full absolute top-0 left-0"
        viewBox="0 0 1400 1200"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: "0 0",
          transition: isDragging ? "none" : "transform 0.1s ease-out",
        }}
      >
        <defs>
          <linearGradient id="roadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(99, 102, 241, 0.5)" />
            <stop offset="100%" stopColor="rgba(168, 85, 247, 0.5)" />
          </linearGradient>
        </defs>

        <path
          d="M 200 200 C 350 150 450 150 500 150 C 650 150 750 250 800 300 C 900 400 950 500 1000 600 C 1050 700 900 800 700 900 C 500 1000 300 950 200 1000"
          stroke="url(#roadGrad)"
          strokeWidth="150"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Road highlight edge */}
        <path
          d="M 200 200 C 350 150 450 150 500 150 C 650 150 750 250 800 300 C 900 400 950 500 1000 600 C 1050 700 900 800 700 900 C 500 1000 300 950 200 1000"
          stroke="rgba(99, 102, 241, 0.9)"
          strokeWidth="30"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {phases.map((phase, idx) => {
          const point = pathPoints[idx % pathPoints.length]

          return (
            <g key={phase.id}>
              {/* Phase circle on road */}
              <circle
                cx={point.x}
                cy={point.y}
                r="60"
                fill="rgba(30, 30, 46, 0.95)"
                stroke="rgb(99, 102, 241)"
                strokeWidth="4"
              />

              {/* Quarter number in circle */}
              <text
                x={point.x}
                y={point.y - 15}
                textAnchor="middle"
                className="text-3xl font-bold"
                style={{ fontSize: "24px", fill: "rgb(99, 102, 241)", fontWeight: "bold" }}
              >
                {point.quarter}
              </text>

              {/* Icon in circle */}
              <text x={point.x} y={point.y + 20} textAnchor="middle" className="text-2xl" style={{ fontSize: "28px" }}>
                {phase.icon}
              </text>

              {/* Title text - positioned above the road node */}
              <text
                x={point.x}
                y={point.y - 120}
                textAnchor="middle"
                style={{ fontSize: "14px", fill: "rgb(99, 102, 241)", fontWeight: "700", fontFamily: "sans-serif" }}
              >
                {phase.title}
              </text>

              {/* Description text - positioned on/near the road with better wrapping */}
              <foreignObject x={point.x - 80} y={point.y + 80} width="160" height="100">
                <div style={{ fontSize: "11px", color: "rgb(156, 163, 175)", textAlign: "center", lineHeight: "1.3" }}>
                  {phase.description}
                </div>
              </foreignObject>
            </g>
          )
        })}
      </svg>

      <div className="absolute bottom-4 right-4 flex gap-2 bg-card/80 border border-border/50 rounded-lg p-2 pointer-events-auto z-10">
        <button
          onClick={() => setScale((prev) => Math.max(0.5, prev - 0.1))}
          className="px-3 py-1 text-sm bg-primary/20 hover:bg-primary/30 rounded border border-primary/30 text-foreground"
        >
          −
        </button>
        <span className="px-3 py-1 text-sm text-muted-foreground min-w-[50px] text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={() => setScale((prev) => Math.min(3, prev + 0.1))}
          className="px-3 py-1 text-sm bg-primary/20 hover:bg-primary/30 rounded border border-primary/30 text-foreground"
        >
          +
        </button>
      </div>

      {/* Reset button */}
      <div className="absolute bottom-4 left-4 pointer-events-auto z-10">
        <button
          onClick={() => {
            setScale(1)
            setPan({ x: 0, y: 0 })
          }}
          className="px-3 py-1 text-sm bg-card/80 border border-border/50 rounded hover:bg-card/90 text-foreground"
        >
          Reset
        </button>
      </div>

      {/* Help text */}
      <div className="absolute top-4 left-4 text-xs text-muted-foreground bg-card/80 border border-border/50 rounded p-2 pointer-events-none z-10">
        <p>Drag to pan • Scroll to zoom</p>
      </div>
    </div>
  )
}

const colors = [
  { bg: "from-yellow-400 to-yellow-500", dot: "bg-yellow-500" },
  { bg: "from-lime-400 to-green-500", dot: "bg-green-500" },
  { bg: "from-teal-400 to-cyan-500", dot: "bg-cyan-500" },
  { bg: "from-cyan-400 to-blue-500", dot: "bg-blue-500" },
  { bg: "from-blue-400 to-indigo-500", dot: "bg-blue-600" },
  { bg: "from-indigo-400 to-purple-500", dot: "bg-purple-500" },
]

export function InfiniteCanvasBanner({ phases, title }: InfiniteCanvasProps) {
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

  return (
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
        <div className="space-y-8 min-w-max">
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
                <div key={phase.id} className="relative">
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
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center text-4xl border-4 border-white">
                    {phase.icon}
                  </div>

                  {/* Phase number */}
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 font-bold text-sm text-gray-800 pointer-events-none">
                    {`0${idx + 1}`}
                  </div>
                </div>
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
              <div key={`desc-${phase.id}`} className="text-center">
                <h4 className="font-semibold text-lg mb-3">{phase.title}</h4>
                <p className="text-muted-foreground text-sm max-w-3xl mx-auto leading-relaxed">{phase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
