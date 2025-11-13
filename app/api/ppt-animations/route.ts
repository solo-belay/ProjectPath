/**
 * PPT Animation Extractor (Aspose.Slides Cloud)
 *
 * POST body:
 * {
 *   "templateUrl": "https://public.blob.vercel-storage.com/uploads/....pptx",
 *   "title": "My Roadmap",
 *   "phases": [{ id, title, icon, description }]
 * }
 *
 * Response:
 * {
 *   "slides": [
 *     {
 *       "index": 1,
 *       "animations": [
 *         { "target": "shape-1", "effect": "appear", "duration": 0.6, "delay": 0.0 },
 *         ...
 *       ]
 *     }
 *   ],
 *   "fallbackTimeline": [
 *     { "phaseIndex": 0, "effect": "focus-in", "duration": 3.0, "delay": 0.0 },
 *     ...
 *   ]
 * }
 *
 * Notes:
 * - Requires ASPOSE_CLIENT_ID and ASPOSE_CLIENT_SECRET in env (Vercel Project Settings).
 * - We upload the PPTX to Aspose temporary storage, read per-slide animations, and return
 *   a simplified timeline suitable for React/Framer Motion playback.
 * - If Aspose is unavailable or returns errors, we fallback to a deterministic focus-per-phase timeline.
 */

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

type Phase = { id: number; title: string; icon: string; description: string }
type Body = { templateUrl: string; title: string; phases: Phase[] }

const ASPOSE_TOKEN_URL = "https://api.aspose.cloud/connect/token"
const ASPOSE_API_BASE = "https://api.aspose.cloud/v3.0"

/**
 * Exchange client credentials for a bearer token
 */
async function getAsposeToken(clientId: string, clientSecret: string) {
  const form = new URLSearchParams()
  form.append("grant_type", "client_credentials")
  form.append("client_id", clientId)
  form.append("client_secret", clientSecret)
  const res = await fetch(ASPOSE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(`Aspose token failed: ${res.status} ${txt}`)
  }
  const json = (await res.json()) as { access_token: string; token_type: string; expires_in: number }
  return json.access_token
}

/**
 * Upload the PPTX file bytes to Aspose storage under a given path
 */
async function uploadToAsposeStorage(token: string, storagePath: string, bytes: ArrayBuffer) {
  // PUT https://api.aspose.cloud/v3.0/slides/storage/file/{path}
  const url = `${ASPOSE_API_BASE}/slides/storage/file/${encodeURIComponent(storagePath)}`
  const res = await fetch(url, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/octet-stream" },
    body: bytes,
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(`Aspose upload failed: ${res.status} ${txt}`)
  }
}

/**
 * Fetch slide count
 */
async function getSlideCount(token: string, fileName: string) {
  // GET /slides/{name}/slides
  const url = `${ASPOSE_API_BASE}/slides/${encodeURIComponent(fileName)}/slides`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(`Aspose get slides failed: ${res.status} ${txt}`)
  }
  const json = await res.json()
  const slides = Array.isArray(json?.slideList) ? json.slideList : []
  return slides.length || json?.slideList?.length || json?.slides?.length || 0
}

/**
 * Get animation info for a single slide
 */
async function getSlideAnimations(token: string, fileName: string, slideIndex: number) {
  // GET /slides/{name}/slides/{slideIndex}/animations
  const url = `${ASPOSE_API_BASE}/slides/${encodeURIComponent(fileName)}/slides/${slideIndex}/animations`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(`Aspose slide animations failed: ${res.status} ${txt}`)
  }
  const json = await res.json()
  return json
}

/**
 * Transform Aspose animation JSON to a simplified timeline suitable for React playback
 */
function simplifyAnimations(asposeJson: any) {
  const simplified: Array<{ target: string; effect: string; duration: number; delay: number }> = []

  try {
    const mainSeq = asposeJson?.mainSequence || asposeJson?.MainSequence || []
    let t = 0
    for (const step of mainSeq) {
      const effectType =
        step?.type || step?.Type || step?.effectType || "appear"
      const duration = Number(step?.timing?.duration || step?.Timing?.Duration || 0.6) || 0.6
      const delay = Number(step?.timing?.delay || step?.Timing?.Delay || 0.0) || 0.0
      const target = step?.targetShapeIndex ? `shape-${step.targetShapeIndex}` : "shape-unknown"
      simplified.push({ target, effect: String(effectType).toLowerCase(), duration, delay: t + delay })
      t += duration + delay
    }
  } catch {
    // ignore, return empty
  }

  return simplified
}

/**
 * Fallback timeline: focus per phase (3.5s each) with simple fade/scale
 */
function fallbackTimeline(phases: Phase[]) {
  const seq: Array<{ phaseIndex: number; effect: string; duration: number; delay: number }> = []
  let t = 0
  for (let i = 0; i < phases.length; i++) {
    seq.push({ phaseIndex: i, effect: "focus-in", duration: 3.5, delay: t })
    t += 3.5
  }
  return seq
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .replace(/-{2,}/g, "-")
  .slice(0, 80)
}

export async function POST(request: Request) {
  try {
    const { templateUrl, title, phases } = (await request.json()) as Body

    if (!templateUrl || !/^https?:\/\//i.test(templateUrl)) {
      return Response.json({ error: "templateUrl (https) is required" }, { status: 400 })
    }
    if (!title || !Array.isArray(phases) || phases.length === 0) {
      return Response.json({ error: "title and phases[] are required" }, { status: 400 })
    }

    const clientId = process.env.ASPOSE_CLIENT_ID
    const clientSecret = process.env.ASPOSE_CLIENT_SECRET
    if (!clientId || !clientSecret) {
      // Provide a deterministic fallback so UI can still present code-based animation.
      return Response.json(
        {
          slides: [],
          fallbackTimeline: fallbackTimeline(phases),
          note: "ASPOSE_CLIENT_ID/ASPOSE_CLIENT_SECRET not set; returned fallback timeline only.",
        },
        { status: 200, headers: { "Cache-Control": "no-store" } },
      )
    }

    // Download PPTX from public Blob URL (or any HTTPS)
    const fileRes = await fetch(templateUrl, { cache: "no-store" })
    if (!fileRes.ok) {
      throw new Error(`Failed to download template: ${fileRes.status}`)
    }
    const fileBytes = await fileRes.arrayBuffer()

    // Authenticate with Aspose
    const token = await getAsposeToken(clientId, clientSecret)

    // Pick a unique name in Aspose storage
    const safe = slugify(title || "roadmap")
    const fileName = `${safe}-${Date.now()}.pptx`
    const storagePath = fileName // root

    // Upload to Aspose
    await uploadToAsposeStorage(token, storagePath, fileBytes)

    // Probe slides and collect simplified animation data
    const count = await getSlideCount(token, fileName)
    const slides: Array<{ index: number; animations: ReturnType<typeof simplifyAnimations> }> = []
    const maxSlides = Math.min(count || 1, 15)
    for (let i = 1; i <= maxSlides; i++) {
      try {
        const anim = await getSlideAnimations(token, fileName, i)
        const simplified = simplifyAnimations(anim)
        slides.push({ index: i, animations: simplified })
      } catch (e) {
        // On failure, still include placeholder for the slide index
        slides.push({ index: i, animations: [] })
      }
    }

    // Return both slide animation info and a deterministic per-phase fallback focus sequence
    return Response.json(
      {
        slides,
        fallbackTimeline: fallbackTimeline(phases),
        meta: { slideCount: count },
      },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch (err: any) {
    console.error("ppt-animations error:", err?.message || err)
    return Response.json(
      {
        error: "Failed to extract PPT animations",
        detail: err?.message || "Unknown error",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    )
  }
}