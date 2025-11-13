import { put } from "@vercel/blob"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 30

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("template")

    if (!(file instanceof File) || file.size === 0) {
      return Response.json({ error: "No file provided" }, { status: 400 })
    }

    // 25MB safety limit for uploads
    if (file.size > 25 * 1024 * 1024) {
      return Response.json({ error: "File too large. Limit is 25MB." }, { status: 413 })
    }

    const originalName = file.name || "template.pptx"
    const extension = getExtension(originalName)
    if (!isSupportedExtension(extension)) {
      return Response.json({ error: "Only .ppt or .pptx files are supported." }, { status: 400 })
    }

    const baseName = slugify(originalName.replace(extension, "")) || "template"
    const safeName = `${baseName}-${Date.now()}${extension}`
    const key = `uploads/${safeName}`

    // Optional token for local dev / previews if automatic credentials are not present.
    const token = process.env.BLOB_READ_WRITE_TOKEN

    // Store in Vercel Blob as public file. In Vercel prod, credentials are auto-injected.
    // In local dev or some preview deployments, set BLOB_READ_WRITE_TOKEN in env, or pass via the token option.
    const uploaded = await put(key, file, {
      access: "public",
      addRandomSuffix: false,
      contentType:
        file.type ||
        (extension === ".ppt"
          ? "application/vnd.ms-powerpoint"
          : "application/vnd.openxmlformats-officedocument.presentationml.presentation"),
      ...(token ? { token } : {}),
    })

    // Prefer the SDK's returned public URL. If it contains query params, provide a clean variant too.
    const sdkUrl = uploaded.url
    let cleanUrl = sdkUrl
    try {
      const u = new URL(sdkUrl)
      u.search = ""
      cleanUrl = u.toString()
    } catch {
      // keep sdkUrl as-is
    }

    return Response.json(
      {
        slug: safeName,
        url: sdkUrl,      // primary public HTTPS URL suitable for Office Web Viewer
        altUrl: cleanUrl, // same URL without query params (fallback)
        message: "Template uploaded",
      },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    )
  } catch (error: any) {
    console.error("Template upload error:", error)
    return Response.json(
      { error: error?.message || "Failed to upload template" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    )
  }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 80)
}

function getExtension(name: string) {
  const match = name.toLowerCase().match(/\.[a-z0-9]+$/)
  if (!match) return ".pptx"
  return match[0]
}

function isSupportedExtension(ext: string) {
  return ext === ".pptx" || ext === ".ppt"
}

