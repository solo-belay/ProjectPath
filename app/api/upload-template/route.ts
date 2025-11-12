import { mkdir, writeFile } from "fs/promises"
import path from "path"

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

    const uploadsDir = path.join(process.cwd(), "public", "uploads")
    await mkdir(uploadsDir, { recursive: true })

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const targetPath = path.join(uploadsDir, safeName)
    await writeFile(targetPath, buffer)

    return Response.json(
      {
        slug: safeName,
        url: `/uploads/${safeName}`,
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

