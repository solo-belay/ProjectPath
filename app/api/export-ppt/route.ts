export const dynamic = "force-dynamic"

export async function POST() {
  return Response.json(
    {
      error: "PPT export temporarily disabled",
      detail: "PPT templating dependency not installed. We disabled this route to allow the app to run.",
    },
    { status: 501 },
  )
}

