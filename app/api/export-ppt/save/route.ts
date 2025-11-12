export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  return Response.json(
    {
      error: "PPT save temporarily disabled",
      detail: "PPT templating dependency not installed. We disabled this route to allow the app to run.",
    },
    { status: 501 },
  )
}

