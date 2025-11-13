"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Play, Pause, SkipBack, SkipForward } from "lucide-react"

type Phase = {
  id: number
  title: string
  icon: string
  description: string
}

type FallbackBeat = {
  phaseIndex: number
  effect: string
  duration: number
  delay: number
}

type SlideAnim = {
  index: number
  animations: Array<{ target: string; effect: string; duration: number; delay: number }>
}

export default function PresentRuntime({
  title,
  phases,
  slides,
  fallbackTimeline,
  autoStart = true,
}: {
  title: string
  phases: Phase[]
  slides?: SlideAnim[]
  fallbackTimeline: FallbackBeat[]
  autoStart?: boolean
}) {
  // We currently use the simplified fallback timeline on a per-phase basis.
  // If slides/animations are provided, we could map "targets" to phase indices later
  // by inspecting text content/shape associations, but for now we honor the intended per-phase
  // focus beat timing from fallbackTimeline as authoritative.
  const beats = useMemo(() => {
    const tl = (fallbackTimeline || []).slice().sort((a, b) => a.delay - b.delay)
    if (tl.length === 0) {
      // fallback if API returned nothing
      const seq: FallbackBeat[] = []
      let t = 0
      for (let i = 0; i < phases.length; i++) {
        seq.push({ phaseIndex: i, effect: "focus-in", duration: 3.5, delay: t })
        t += 3.5
      }
      return seq
    }
    return tl
  }, [fallbackTimeline, phases.length])

  // Resolve playhead by time
  const [playing, setPlaying] = useState<boolean>(autoStart)
  const [currentIdx, setCurrentIdx] = useState<number>(0)
  const timerRef = useRef<number | null>(null)

  // Set up auto-advance by beat durations
  useEffect(() => {
    if (!playing || beats.length === 0) return
    // Clear any running timer
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
    // Current beat duration
    const dur = Math.max(0.3, beats[currentIdx]?.duration ?? 3.5) * 1000
    timerRef.current = window.setTimeout(() => {
      setCurrentIdx((p) => Math.min(beats.length - 1, p + 1))
      timerRef.current = null
    }, dur)
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [playing, currentIdx, beats])

  const goNext = () => setCurrentIdx((p) => Math.min(beats.length - 1, p + 1))
  const goPrev = () => setCurrentIdx((p) => Math.max(0, p - 1))
  const togglePlay = () => setPlaying((p) => !p)

  // Compute the currently focused phase index according to the active beat
  const focusedPhase = beats[currentIdx]?.phaseIndex ?? 0

  // Basic mapping from effect -> framer-motion variants (extensible)
  const effect = (beats[currentIdx]?.effect || "focus-in").toLowerCase()
  const variants = {
    enter: { opacity: 0, scale: 0.98, y: 12 },
    center: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.98, y: -8 },
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={goPrev} disabled={currentIdx === 0} className="gap-2">
            <SkipBack className="w-4 h-4" /> Prev
          </Button>
          <Button variant="outline" size="sm" onClick={togglePlay} className="gap-2">
            {playing ? (
              <>
                <Pause className="w-4 h-4" /> Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> Play
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goNext}
            disabled={currentIdx >= beats.length - 1}
            className="gap-2"
          >
            Next <SkipForward className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stage: focus on one phase at a time with animated transition */}
      <div className="bg-card/30 border border-border/50 rounded-lg p-6 min-h-[320px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={focusedPhase}
            initial={variants.enter}
            animate={variants.center}
            exit={variants.exit}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="space-y-6"
          >
            <div className="flex items-center justify-center">
              <div className="text-6xl animate-bounce">{phases[focusedPhase]?.icon}</div>
            </div>
            <h3 className="text-3xl font-bold text-center">{phases[focusedPhase]?.title}</h3>
            <p className="text-muted-foreground text-center max-w-2xl mx-auto">
              {phases[focusedPhase]?.description}
            </p>

            {/* Progress indicators */}
            <div className="pt-6">
              <div className="flex items-center justify-center gap-2">
                {phases.map((_, idx) => (
                  <div
                    key={idx}
                    className={
                      idx === focusedPhase
                        ? "w-8 h-2 rounded-full bg-primary"
                        : idx < focusedPhase
                          ? "w-2 h-2 rounded-full bg-primary/50"
                          : "w-2 h-2 rounded-full bg-muted/30"
                    }
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                {focusedPhase + 1} of {phases.length}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Filmstrip of all phases with subtle emphasis on focused one */}
      <div className="flex items-center gap-4 overflow-x-auto pb-2">
        {phases.map((p, idx) => {
          const active = idx === focusedPhase
          return (
            <motion.div
              key={p.id}
              onClick={() => {
                setCurrentIdx(beats.findIndex((b) => b.phaseIndex === idx) || 0)
                setPlaying(false)
              }}
              whileHover={{ scale: active ? 1.02 : 1.03 }}
              className={`flex-shrink-0 w-56 p-4 rounded-lg border transition-all cursor-pointer ${
                active ? "border-primary bg-primary/10" : "border-border/50 bg-card/30"
              }`}
            >
              <div className="text-3xl mb-2">{p.icon}</div>
              <h4 className={`text-sm font-semibold ${active ? "text-primary" : ""}`}>{p.title}</h4>
              <p className="text-xs text-muted-foreground line-clamp-3">{p.description}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Debug/Meta (optional future: render native PPT animation mapping) */}
      {slides && slides.length > 0 ? (
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer">Animation data (from template)</summary>
          <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap">
            {JSON.stringify(
              {
                beats,
                slides: slides.slice(0, 3), // show first few slides
              },
              null,
              2,
            )}
          </pre>
        </details>
      ) : null}
    </div>
  )
}