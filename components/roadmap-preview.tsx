"use client"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, Share2, Check, Play, Pause, SkipBack, SkipForward, MonitorPlay } from "lucide-react"
import html2canvas from "html2canvas"
import { InfiniteCanvas, InfiniteCanvasBanner } from "./infinite-canvas"

interface Phase {
  id: number
  title: string
  icon: string
  description: string
}

interface RoadmapData {
  title: string
  phases: Phase[]
}

const colors = [
  { bg: "from-yellow-400 to-yellow-500", circle: "from-yellow-300 to-yellow-400", dot: "bg-yellow-500" },
  { bg: "from-lime-400 to-green-500", circle: "from-lime-300 to-green-400", dot: "bg-green-500" },
  { bg: "from-teal-400 to-cyan-500", circle: "from-teal-300 to-cyan-400", dot: "bg-cyan-500" },
  { bg: "from-cyan-400 to-blue-500", circle: "from-cyan-300 to-blue-400", dot: "bg-blue-500" },
  { bg: "from-blue-400 to-indigo-500", circle: "from-blue-300 to-indigo-400", dot: "bg-blue-600" },
  { bg: "from-indigo-400 to-purple-500", circle: "from-indigo-300 to-purple-400", dot: "bg-purple-500" },
]

interface RoadmapPreviewProps {
  data: RoadmapData
  defaultTheme?: string
  templateSlug?: string | null
  onRequestTemplateUpload?: () => void
}

export default function RoadmapPreview({
  data,
  defaultTheme = "horizontal",
  templateSlug,
  onRequestTemplateUpload,
}: RoadmapPreviewProps) {
  const [theme, setTheme] = useState<"horizontal" | "circular" | "vertical" | "flow" | "banner">(
    (defaultTheme as any) || "horizontal",
  )
  const [copied, setCopied] = useState(false)
  const [exporting, setExporting] = useState(false)
  const roadmapRef = useRef<HTMLDivElement>(null)

  const [presentationMode, setPresentationMode] = useState(false)
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [autoPlayInterval, setAutoPlayInterval] = useState<NodeJS.Timeout | null>(null)
  const [slideMode, setSlideMode] = useState(false)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [roadMode, setRoadMode] = useState(false)

  useEffect(() => {
    if (presentationMode && isPlaying && data.phases.length > 0) {
      const interval = setTimeout(() => {
        setCurrentPhaseIndex((prev) => {
          if (prev < data.phases.length - 1) {
            return prev + 1
          } else {
            setIsPlaying(false)
            return prev
          }
        })
      }, 3500)
      setAutoPlayInterval(interval)
      return () => clearTimeout(interval)
    }
  }, [presentationMode, isPlaying, currentPhaseIndex, data.phases.length])

  const handleExportImage = async () => {
    if (!roadmapRef.current) return

    setExporting(true)
    try {
      const canvas = await html2canvas(roadmapRef.current, {
        backgroundColor: "#0a0a0a",
        scale: 2,
      })
      const link = document.createElement("a")
      link.href = canvas.toDataURL("image/png")
      link.download = `${data.title}-roadmap.png`
      link.click()
    } catch (error) {
      console.error("Error exporting image:", error)
    } finally {
      setExporting(false)
    }
  }

  const templateViewerAvailable = Boolean(templateSlug)

  const handleOpenTemplateViewer = () => {
    if (templateSlug) {
      window.open(`/present/${encodeURIComponent(templateSlug)}`, "_blank", "noopener,noreferrer")
    } else if (onRequestTemplateUpload) {
      onRequestTemplateUpload()
    }
  }

  const handleShare = async () => {
    const text = `
ProjectPath Roadmap: ${data.title}

${data.phases.map((phase) => `${phase.icon} ${phase.title}: ${phase.description}`).join("\n")}

Generated with ProjectPath - Transform any project idea into a visual roadmap.
`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Error copying to clipboard:", error)
    }
  }

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleNextPhase = () => {
    if (currentPhaseIndex < data.phases.length - 1) {
      setCurrentPhaseIndex(currentPhaseIndex + 1)
    }
  }

  const handlePrevPhase = () => {
    if (currentPhaseIndex > 0) {
      setCurrentPhaseIndex(currentPhaseIndex - 1)
    }
  }

  return (
    <div className="w-full space-y-8">
      {/* Header and controls */}
      <div className="space-y-4">
        <h2 className="text-3xl font-bold text-balance">{data.title}</h2>

        <div className="flex flex-wrap gap-3">
          {!presentationMode && !slideMode && !roadMode && (
            <div className="flex gap-2 bg-card/30 border border-border/50 rounded-lg p-2">
              {(["horizontal", "circular", "vertical", "flow", "banner"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all capitalize ${
                    theme === t
                      ? "bg-primary text-primary-foreground glow-accent-sm"
                      : "bg-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2 ml-auto">
            {slideMode ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-transparent"
                  onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                  disabled={currentSlideIndex === 0}
                >
                  <SkipBack className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-transparent"
                  onClick={() =>
                    setCurrentSlideIndex(Math.min(Math.ceil(data.phases.length / 2) - 1, currentSlideIndex + 1))
                  }
                  disabled={currentSlideIndex >= Math.ceil(data.phases.length / 2) - 1}
                >
                  <SkipForward className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-transparent"
                  onClick={() => {
                    setSlideMode(false)
                    setCurrentSlideIndex(0)
                  }}
                >
                  Exit
                </Button>
              </>
            ) : presentationMode ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-transparent"
                  onClick={handlePrevPhase}
                  disabled={currentPhaseIndex === 0}
                >
                  <SkipBack className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={handlePlayPause}>
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Play
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-transparent"
                  onClick={handleNextPhase}
                  disabled={currentPhaseIndex === data.phases.length - 1}
                >
                  <SkipForward className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-transparent"
                  onClick={() => {
                    setPresentationMode(false)
                    setCurrentPhaseIndex(0)
                    setIsPlaying(true)
                  }}
                >
                  Exit
                </Button>
              </>
            ) : roadMode ? (
              <>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={() => setRoadMode(false)}>
                  Exit
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-transparent"
                  onClick={() => {
                    setSlideMode(true)
                    setCurrentSlideIndex(0)
                  }}
                >
                  Slide
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-transparent"
                  onClick={() => {
                    setRoadMode(true)
                  }}
                >
                  Road
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-transparent"
                  onClick={() => {
                    setPresentationMode(true)
                    setCurrentPhaseIndex(0)
                    setIsPlaying(true)
                  }}
                >
                  <Play className="w-4 h-4" />
                  Present
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-transparent"
                  onClick={handleExportImage}
                  disabled={exporting}
                >
                  <Download className="w-4 h-4" />
                  {exporting ? "Exporting..." : "Export"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-transparent"
                  onClick={handleOpenTemplateViewer}
                  disabled={!templateViewerAvailable && !onRequestTemplateUpload}
                  title={
                    templateViewerAvailable
                      ? "Opens PPT template in a new tab using Microsoft Office Web Viewer"
                      : "Upload a PPT template to enable the viewer"
                  }
                >
                  <MonitorPlay className="w-4 h-4" />
                  {templateViewerAvailable ? "View PPT Template" : "Upload PPT Template"}
                </Button>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={handleShare}>
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      Share
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Roadmap visualization */}
      <div ref={roadmapRef} className="bg-card/30 border border-border/50 rounded-lg p-8 min-h-96">
        {slideMode ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <h1 className="text-5xl font-bold text-center mb-12">{data.title}</h1>

            <div className="grid grid-cols-2 gap-12">
              {data.phases.slice(currentSlideIndex * 2, (currentSlideIndex + 1) * 2).map((phase, idx) => {
                const phaseNum = currentSlideIndex * 2 + idx + 1
                const quarterLabel = `Q${phaseNum}`
                return (
                  <motion.div
                    key={phase.id}
                    initial={{ opacity: 0, x: idx === 0 ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <div className="relative">
                      <div className="absolute -left-8 -top-8 text-8xl font-bold text-primary/10">{quarterLabel}</div>
                      <div className="relative z-10 space-y-3">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                          <span className="text-4xl">{phase.icon}</span>
                          {phase.title}
                        </h2>
                        <p className="text-sm text-muted-foreground leading-relaxed">{phase.description}</p>
                        <div className="pt-2 border-t border-primary/20">
                          <p className="text-xs font-semibold text-primary uppercase mt-2">Key Points:</p>
                          <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                            <li>• Deliverable timeline</li>
                            <li>• Resource allocation</li>
                            <li>• Success metrics</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            <div className="flex justify-center gap-2 pt-8">
              {Array.from({ length: Math.ceil(data.phases.length / 2) }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentSlideIndex ? "w-8 bg-primary" : "bg-primary/30"
                  }`}
                />
              ))}
            </div>
          </motion.div>
        ) : roadMode ? (
          <InfiniteCanvas phases={data.phases} title={data.title} />
        ) : presentationMode ? (
          theme === "horizontal" ? (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPhaseIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.6 }}
                  className="space-y-6 max-w-2xl"
                >
                  <div className="text-6xl mb-6 animate-bounce">{data.phases[currentPhaseIndex].icon}</div>
                  <h3 className="text-4xl font-bold text-balance">{data.phases[currentPhaseIndex].title}</h3>
                  <p className="text-lg text-muted-foreground text-balance">
                    {data.phases[currentPhaseIndex].description}
                  </p>
                  <div className="pt-8">
                    <div className="flex items-center justify-center gap-2">
                      {data.phases.map((_, idx) => (
                        <div
                          key={idx}
                          className={`h-2 rounded-full transition-all ${
                            idx === currentPhaseIndex
                              ? "w-8 bg-primary"
                              : idx < currentPhaseIndex
                                ? "w-2 bg-primary/50"
                                : "w-2 bg-muted/30"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-4">
                      {currentPhaseIndex + 1} of {data.phases.length}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          ) : theme === "circular" ? (
            <div className="flex items-center justify-center h-96">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative w-80 h-80">
                {data.phases.map((phase, idx) => {
                  const angle = (idx / data.phases.length) * 360
                  const radius = 140
                  const x = radius * Math.cos((angle - 90) * (Math.PI / 180))
                  const y = radius * Math.sin((angle - 90) * (Math.PI / 180))

                  return (
                    <motion.div
                      key={phase.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{
                        opacity: idx === currentPhaseIndex ? 1 : 0.4,
                        scale: idx === currentPhaseIndex ? 1.2 : 0.9,
                      }}
                      transition={{ duration: 0.5 }}
                      style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                      }}
                      className="flex flex-col items-center"
                    >
                      <div
                        className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all ${
                          idx === currentPhaseIndex
                            ? "bg-primary/30 border-2 border-primary glow-accent-sm"
                            : "bg-card/50 border-2 border-primary/50"
                        }`}
                      >
                        {phase.icon}
                      </div>
                      <p className="text-xs font-semibold mt-2 text-center max-w-[80px]">{phase.title}</p>
                    </motion.div>
                  )
                })}

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <div className="text-center space-y-4">
                    <h3 className="text-2xl font-bold">{data.phases[currentPhaseIndex].title}</h3>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      {data.phases[currentPhaseIndex].description}
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          ) : theme === "vertical" ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 h-96 overflow-y-auto">
              {data.phases.map((phase, idx) => (
                <motion.div
                  key={phase.id}
                  animate={{ opacity: idx === currentPhaseIndex ? 1 : 0.3, x: idx === currentPhaseIndex ? 0 : -10 }}
                  transition={{ duration: 0.5 }}
                  className="flex gap-4 items-start opacity-transition"
                >
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all ${
                        idx === currentPhaseIndex
                          ? "bg-primary/30 border-2 border-primary glow-accent-sm"
                          : "bg-card/50 border-2 border-primary/50"
                      }`}
                    >
                      {phase.icon}
                    </div>
                    {idx < data.phases.length - 1 && (
                      <div className="w-1 h-12 bg-gradient-to-b from-primary/50 to-accent/50 rounded-full mt-2"></div>
                    )}
                  </div>
                  <div className="flex-1 pt-2">
                    <h3 className="font-semibold text-lg">{phase.title}</h3>
                    <p className="text-muted-foreground text-sm">{phase.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : theme === "flow" ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
              <div className="flex items-center justify-center">
                <h1 className="text-4xl font-bold text-center">{data.title.toUpperCase()}</h1>
              </div>

              <motion.div className="w-full max-w-2xl mx-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentPhaseIndex}
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    transition={{ duration: 0.6 }}
                    className="bg-gradient-to-br from-slate-600 to-slate-800 rounded-lg p-8 border border-slate-500"
                  >
                    <div className="text-6xl mb-6 animate-bounce">{data.phases[currentPhaseIndex].icon}</div>
                    <h3 className="font-semibold text-white text-2xl mb-3">{data.phases[currentPhaseIndex].title}</h3>
                    <p className="text-slate-300 text-lg leading-relaxed mb-6">
                      {data.phases[currentPhaseIndex].description}
                    </p>

                    <div className="pt-6 border-t border-slate-400">
                      <div className="flex items-center justify-center gap-2 mb-4">
                        {data.phases.map((_, idx) => (
                          <div
                            key={idx}
                            className={`h-2 rounded-full transition-all ${
                              idx === currentPhaseIndex
                                ? "w-8 bg-primary"
                                : idx < currentPhaseIndex
                                  ? "w-2 bg-primary/50"
                                  : "w-2 bg-muted/30"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-slate-300 text-center">
                        {currentPhaseIndex + 1} of {data.phases.length}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </motion.div>
          ) : theme === "banner" ? (
            <InfiniteCanvasBanner phases={data.phases} title={data.title} />
          ) : (
            <div className="flex items-center gap-4 overflow-x-auto pb-4">
              {data.phases.map((phase, idx) => (
                <div key={phase.id} className="flex items-center gap-4 flex-shrink-0">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex flex-col items-center glow-accent-sm"
                  >
                    <div className="w-16 h-16 rounded-full bg-card/50 border-2 border-primary/50 flex items-center justify-center text-3xl mb-2 glow-accent-sm">
                      {phase.icon}
                    </div>
                    <h3 className="font-semibold text-center">{phase.title}</h3>
                    <p className="text-xs text-muted-foreground text-center max-w-[120px]">{phase.description}</p>
                  </motion.div>
                  {idx < data.phases.length - 1 && (
                    <div className="w-8 h-1 bg-gradient-to-r from-primary/50 to-accent/50 rounded-full flex-shrink-0"></div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          <>
            {/* Default/Horizontal theme display */}
            {!presentationMode && !slideMode && theme === "horizontal" && !roadMode && (
              <div className="flex items-center gap-4 overflow-x-auto pb-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-4 min-w-full"
                >
                  {data.phases.map((phase, idx) => (
                    <div key={phase.id} className="flex items-center gap-4 flex-shrink-0">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex flex-col items-center glow-accent-sm"
                      >
                        <div className="w-16 h-16 rounded-full bg-card/50 border-2 border-primary/50 flex items-center justify-center text-3xl mb-2 glow-accent-sm">
                          {phase.icon}
                        </div>
                        <h3 className="font-semibold text-center">{phase.title}</h3>
                        <p className="text-xs text-muted-foreground text-center max-w-[120px]">{phase.description}</p>
                      </motion.div>
                      {idx < data.phases.length - 1 && (
                        <div className="w-8 h-1 bg-gradient-to-r from-primary/50 to-accent/50 rounded-full flex-shrink-0"></div>
                      )}
                    </div>
                  ))}
                </motion.div>
              </div>
            )}

            {/* Circular theme display */}
            {!presentationMode && !slideMode && theme === "circular" && !roadMode && (
              <div className="flex items-center justify-center h-96">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative w-80 h-80">
                  {data.phases.map((phase, idx) => {
                    const angle = (idx / data.phases.length) * 360
                    const radius = 140
                    const x = radius * Math.cos((angle - 90) * (Math.PI / 180))
                    const y = radius * Math.sin((angle - 90) * (Math.PI / 180))

                    return (
                      <motion.div
                        key={phase.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        style={{
                          position: "absolute",
                          left: "50%",
                          top: "50%",
                          transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                        }}
                        className="flex flex-col items-center"
                      >
                        <div className="w-14 h-14 rounded-full bg-card/50 border-2 border-primary/50 flex items-center justify-center text-2xl glow-accent-sm">
                          {phase.icon}
                        </div>
                        <p className="text-xs font-semibold mt-2 text-center max-w-[80px]">{phase.title}</p>
                      </motion.div>
                    )
                  })}
                </motion.div>
              </div>
            )}

            {/* Vertical theme display */}
            {!presentationMode && !slideMode && theme === "vertical" && !roadMode && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                {data.phases.map((phase, idx) => (
                  <motion.div
                    key={phase.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex gap-4 items-start"
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-card/50 border-2 border-primary/50 flex items-center justify-center text-xl glow-accent-sm">
                        {phase.icon}
                      </div>
                      {idx < data.phases.length - 1 && (
                        <div className="w-1 h-12 bg-gradient-to-b from-primary/50 to-accent/50 rounded-full mt-2"></div>
                      )}
                    </div>
                    <div className="flex-1 pt-2">
                      <h3 className="font-semibold text-lg">{phase.title}</h3>
                      <p className="text-muted-foreground text-sm">{phase.description}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Flow theme display for normal view */}
            {!presentationMode && !slideMode && theme === "flow" && !roadMode && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                <div className="flex items-center justify-center">
                  <h1 className="text-4xl font-bold text-center">{data.title.toUpperCase()}</h1>
                </div>

                {/* First row of phases */}
                <div className="flex items-center justify-between gap-6 flex-wrap">
                  {data.phases.slice(0, Math.ceil(data.phases.length / 2)).map((phase, idx) => {
                    const colorClass = colors[idx % colors.length]
                    const nextColor = colors[(idx + 1) % colors.length]

                    return (
                      <div key={phase.id} className="flex items-center gap-4 flex-1">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.1 }}
                          className="flex-1 bg-gradient-to-br from-slate-600 to-slate-800 rounded-lg p-4 border border-slate-500"
                        >
                          <div className="text-2xl mb-2">{phase.icon}</div>
                          <h3 className="font-semibold text-white text-sm">{phase.title.split(":")[0]}</h3>
                          {phase.title.includes(":") && (
                            <p className="text-xs text-slate-300 mt-1 font-semibold">{phase.title.split(":")[1]}</p>
                          )}
                          <p className="text-xs text-slate-300 mt-3 leading-relaxed">{phase.description}</p>
                        </motion.div>

                        {idx < Math.ceil(data.phases.length / 2) - 1 && (
                          <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: idx * 0.1 + 0.2 }}
                            className={`w-12 h-4 bg-gradient-to-r ${colorClass} rounded-full flex-shrink-0 relative`}
                          >
                            <div
                              className={`absolute right-0 top-1/2 w-0 h-0 border-l-8 border-t-2 border-b-2 -translate-y-1/2`}
                            />
                          </motion.div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Second row of phases */}
                {data.phases.length > Math.ceil(data.phases.length / 2) && (
                  <div className="flex items-center justify-between gap-6 flex-wrap">
                    {data.phases.slice(Math.ceil(data.phases.length / 2)).map((phase, idx) => {
                      const actualIdx = Math.ceil(data.phases.length / 2) + idx
                      const colorClass = colors[actualIdx % colors.length]

                      return (
                        <div key={phase.id} className="flex items-center gap-4 flex-1">
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: (idx + Math.ceil(data.phases.length / 2)) * 0.1 }}
                            className="flex-1 bg-gradient-to-br from-slate-600 to-slate-800 rounded-lg p-4 border border-slate-500"
                          >
                            <div className="text-2xl mb-2">{phase.icon}</div>
                            <h3 className="font-semibold text-white text-sm">{phase.title.split(":")[0]}</h3>
                            {phase.title.includes(":") && (
                              <p className="text-xs text-slate-300 mt-1 font-semibold">{phase.title.split(":")[1]}</p>
                            )}
                            <p className="text-xs text-slate-300 mt-3 leading-relaxed">{phase.description}</p>
                          </motion.div>

                          {idx < data.phases.length - Math.ceil(data.phases.length / 2) - 1 && (
                            <motion.div
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: 1 }}
                              transition={{ delay: (idx + Math.ceil(data.phases.length / 2)) * 0.1 + 0.2 }}
                              className={`w-12 h-4 bg-gradient-to-r ${colorClass} rounded-full flex-shrink-0`}
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* Banner theme display for normal view */}
            {!presentationMode && !slideMode && theme === "banner" && !roadMode && (
              <InfiniteCanvasBanner phases={data.phases} title={data.title} />
            )}
          </>
        )}
      </div>
    </div>
  )
}
