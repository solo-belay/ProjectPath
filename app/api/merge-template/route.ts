export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 5

// Temporarily disabled. We shifted to the Aspose-driven code presentation flow
// via [POST](app/api/ppt-animations/route.ts:1) and in-page animation runtime.
// This endpoint will be reintroduced if we need to export a merged PPTX file.

export async function POST() {
  return Response.json(
    {
      error: "PPT merge is disabled",
      detail:
        "Use /api/ppt-animations for code-driven presentation. This merge endpoint is paused until export is required.",
    },
    { status: 501, headers: { "Cache-Control": "no-store" } },
  )
}