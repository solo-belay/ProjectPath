"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, Loader2, Sparkles } from "lucide-react"
import PresentRuntime from "@/components/present-runtime"

const PUBLIC_BASE = process.env.NEXT_PUBLIC_PUBLIC_BASE_URL as string | undefined

export default function HomePage() {
  const [prompt, setPrompt] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [roadmapData, setRoadmapData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [templateFile, setTemplateFile] = useState<File | null>(null)
  const [templateUploading, setTemplateUploading] = useState(false)
  const [templateUploadError, setTemplateUploadError] = useState("")
  const [templateUploadSuccess, setTemplateUploadSuccess] = useState("")
  const [uploadedTemplate, setUploadedTemplate] = useState<{ slug: string; url: string; altUrl?: string; sdkUrl?: string } | null>(null)
  const uploadSectionRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [presenting, setPresenting] = useState(false)
  const [codePresenting, setCodePresenting] = useState(false)
  const [useAltUrl, setUseAltUrl] = useState(false)
  const [animLoading, setAnimLoading] = useState(false)
  const [animError, setAnimError] = useState("")
  const [animSlides, setAnimSlides] = useState<any[] | null>(null)
  const [animFallback, setAnimFallback] = useState<any[] | null>(null)
  const [copied, setCopied] = useState<"viewer" | "file" | null>(null)
  const [origin, setOrigin] = useState<string>("")

  const handleCopy = async (text: string, which: "viewer" | "file") => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(which)
      setTimeout(() => setCopied(null), 1500)
    } catch (e) {
      console.error("copy failed", e)
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin)
    }
  }, [])

  const baseUrl = useMemo(() => {
    const pb = (PUBLIC_BASE || "").trim()
    if (pb) {
      try {
        return pb.replace(/\/+$/, "")
      } catch {
        return pb
      }
    }
    return origin
  }, [origin])

  const pptUrl = useMemo(() => {
    if (!uploadedTemplate) return ""
    // Allow user to choose alternate URL if available
    if (useAltUrl && uploadedTemplate.altUrl && uploadedTemplate.altUrl.startsWith("http")) {
      return uploadedTemplate.altUrl
    }
    // Prefer Blob public URL from upload API
    if (uploadedTemplate.url && uploadedTemplate.url.startsWith("http")) {
      return uploadedTemplate.url
    }
    // Fallback to SDK URL if provided
    if (uploadedTemplate.sdkUrl && uploadedTemplate.sdkUrl.startsWith("http")) {
      return uploadedTemplate.sdkUrl
    }
    // Legacy local path (dev only)
    if (!baseUrl || !uploadedTemplate.slug) return ""
    return `${baseUrl}/uploads/${uploadedTemplate.slug}`
  }, [baseUrl, uploadedTemplate, useAltUrl])

  const officeEmbedUrl = useMemo(() => {
    if (!pptUrl) return ""
    const encoded = encodeURIComponent(pptUrl)
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encoded}`
  }, [pptUrl])

  const startCodePresent = async () => {
    if (!pptUrl || !roadmapData) return
    setAnimLoading(true)
    setAnimError("")
    try {
      const res = await fetch("/api/ppt-animations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateUrl: pptUrl,
          title: roadmapData.title,
          phases: roadmapData.phases,
        }),
      })
      if (!res.ok) {
        const p = await res.json().catch(() => ({}))
        throw new Error(p?.detail || p?.error || "Failed to prepare presentation")
      }
      const payload = await res.json()
      setAnimSlides(payload?.slides || [])
      setAnimFallback(payload?.fallbackTimeline || [])
      setCodePresenting(true)
    } catch (e: any) {
      setAnimError(e?.message || "Failed to prepare presentation")
    } finally {
      setAnimLoading(false)
    }
  }

  const handleTemplateFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }
    const lowerName = file.name.toLowerCase()
    if (!lowerName.endsWith(".pptx") && !lowerName.endsWith(".ppt")) {
      setTemplateUploadError("Please select a .ppt or .pptx file.")
      setTemplateUploadSuccess("")
      event.target.value = ""
      setTemplateFile(null)
      return
    }
    setTemplateFile(file)
    setTemplateUploadError("")
    setTemplateUploadSuccess("")
  }

  const uploadTemplate = async () => {
    if (!templateFile) {
      setTemplateUploadError("Select a PowerPoint file before uploading.")
      return
    }
    setTemplateUploading(true)
    setTemplateUploadError("")
    setTemplateUploadSuccess("")

    try {
      const formData = new FormData()
      formData.append("template", templateFile)

      const response = await fetch("/api/upload-template", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}))
        throw new Error(errorPayload?.detail || errorPayload?.error || "Failed to upload template")
      }

      const result = await response.json()
      setUploadedTemplate(result)
      setTemplateUploadSuccess("Template uploaded. It will be used for your roadmap preview on this page.")
    } catch (uploadError: any) {
      console.error("Template upload failed:", uploadError)
      setTemplateUploadError(uploadError?.message || "Failed to upload template. Please try again.")
    } finally {
      setTemplateUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      setTemplateFile(null)
    }
  }

  const generateRoadmap = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return
    if (!uploadedTemplate?.slug) {
      setError("Please upload a PPT/PPTX template before generating.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/generate-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate roadmap")
      }

      const data = await response.json()
      setRoadmapData(data)
      setSubmitted(true)
      startCodePresent()
    } catch (err: any) {
      setError(err?.message || "Failed to generate roadmap. Please try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary opacity-20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent opacity-15 rounded-full blur-3xl"></div>
      </div>

      <main className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="max-w-3xl mx-auto w-full pb-16">
          {!submitted && (
            <div className="text-center mb-16">
              <div className="flex items-center justify-center mb-6">
                <div className="p-3 rounded-full glow-accent-sm bg-accent/10 border border-accent/30">
                  <Sparkles className="w-8 h-8 text-accent" />
                </div>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 text-balance">ProjectPath</h1>
              <p className="text-xl text-muted-foreground text-balance">
                Your roadmap will be presented as code using your PPT template’s motion and styling.
              </p>
            </div>
          )}

          <div
            ref={uploadSectionRef}
            className="mb-10 space-y-3 rounded-lg border border-dashed border-border/50 bg-card/30 p-4 backdrop-blur"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                  PowerPoint Template (required)
                </p>
                <p className="text-sm text-muted-foreground">
                  Upload a .ppt or .pptx file. The roadmap will be shown on this page using your template.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 md:flex-row">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                onChange={handleTemplateFileChange}
                disabled={templateUploading}
                className="bg-background/60"
              />
              <Button type="button" variant="secondary" onClick={uploadTemplate} disabled={templateUploading || !templateFile}>
                {templateUploading ? "Uploading…" : templateFile ? "Upload template" : "Select a file first"}
              </Button>
            </div>
            {templateUploadError && <p className="text-sm text-destructive">{templateUploadError}</p>}
            {templateUploadSuccess && <p className="text-sm text-emerald-500">{templateUploadSuccess}</p>}
          </div>

          {!submitted ? (
            <form onSubmit={generateRoadmap} className="w-full">
              <div className="space-y-4 mb-8">
                <div className="relative">
                  <Input
                    placeholder="Describe your project idea or roadmap..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={loading}
                    className="w-full px-6 py-4 text-lg bg-card/50 border-2 border-border/50 rounded-lg focus:border-primary/50 focus:outline-none transition-all glow-accent-sm disabled:opacity-50"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  disabled={loading || !uploadedTemplate}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 glow-accent transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      Generate Roadmap
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  )}
                </Button>
                {!uploadedTemplate && (
                  <p className="text-amber-500 text-sm text-center">Upload a PPT/PPTX template to enable Generate.</p>
                )}
                {error && <p className="text-destructive text-sm text-center">{error}</p>}
              </div>
            </form>
          ) : (
            <div className="w-full">
              <button
                onClick={() => {
                  setSubmitted(false)
                  setPrompt("")
                  setRoadmapData(null)
                  setPresenting(false)
                  setCodePresenting(false)
                  setUseAltUrl(false)
                  setAnimSlides(null)
                  setAnimFallback(null)
                  setAnimError("")
                  setAnimLoading(false)
                }}
                className="mb-8 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
              >
                ← Back
              </button>

              {/* Present controls */}
              <div className="w-full bg-background border border-border/50 rounded-lg overflow-hidden p-4 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="text-sm text-muted-foreground">
                    Present your roadmap with your PPT template on this page.
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={startCodePresent}
                      disabled={!pptUrl || animLoading || !roadmapData}
                      className="bg-primary text-primary-foreground"
                      title="Replay the template’s animation timeline as code with per-phase focus"
                    >
                      {animLoading ? "Preparing…" : "Code Present"}
                    </Button>
                    {/* View PPT (native iframe) intentionally removed to enforce code-based presentation */}
                  </div>
                </div>

                {/* Diagnostics to resolve Office Viewer “An error occurred” */}
                <div className="rounded-md border border-dashed border-border/50 p-3 bg-card/30 space-y-2 text-xs">
                  <p className="text-muted-foreground">
                    If the viewer shows “An error occurred”, ensure the file URL is publicly reachable over <b>HTTPS</b>.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div>
                      <div className="font-semibold">Active File URL {useAltUrl ? "(alternate)" : "(primary)"}</div>
                      <div className="break-all">{pptUrl || "—"}</div>
                      <div className="mt-1 flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => pptUrl && handleCopy(pptUrl, "file")}
                          disabled={!pptUrl}
                        >
                          {copied === "file" ? "Copied" : "Copy"}
                        </Button>
                        {uploadedTemplate?.altUrl || uploadedTemplate?.sdkUrl ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setUseAltUrl((v) => !v)}
                          >
                            {useAltUrl ? "Use primary" : "Use alternate"}
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    {uploadedTemplate?.altUrl || uploadedTemplate?.sdkUrl ? (
                      <div>
                        <div className="font-semibold">Alternate URL</div>
                        <div className="break-all">{uploadedTemplate?.altUrl || uploadedTemplate?.sdkUrl || "—"}</div>
                      </div>
                    ) : null}

                    <div>
                      <div className="font-semibold">Viewer URL</div>
                      <div className="break-all">{officeEmbedUrl || "—"}</div>
                      <div className="mt-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => officeEmbedUrl && handleCopy(officeEmbedUrl, "viewer")}
                          disabled={!officeEmbedUrl}
                        >
                          {copied === "viewer" ? "Copied" : "Copy"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {!baseUrl || !baseUrl.startsWith("https://") ? (
                    <p className="text-amber-500">
                      Set NEXT_PUBLIC_PUBLIC_BASE_URL in .env to a public HTTPS URL (e.g., an ngrok https URL) and restart the dev server.
                    </p>
                  ) : null}
                </div>

                {!PUBLIC_BASE && (
                  <p className="text-xs text-muted-foreground">
                    Tip: If the viewer shows “An error occurred”, set NEXT_PUBLIC_PUBLIC_BASE_URL in your .env to a public
                    URL for this app (for example: https://your-subdomain.ngrok.app). Office Web Viewer cannot fetch files
                    from localhost. After setting it, restart the dev server.
                  </p>
                )}

                {codePresenting ? (
                  <div className="w-full">
                    {roadmapData ? (
                      <PresentRuntime
                        title={roadmapData.title}
                        phases={roadmapData.phases || []}
                        slides={animSlides || []}
                        fallbackTimeline={animFallback || []}
                      />
                    ) : null}
                  </div>
                ) : null}

                {/* PPT iframe section removed. Presentation runs as code via PresentRuntime. */}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
