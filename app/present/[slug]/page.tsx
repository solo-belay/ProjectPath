import { redirect } from "next/navigation"

export default function PresentPage() {
  // This route has been retired. Keep for backward-compat but redirect to home.
  redirect("/")
  return null
}


