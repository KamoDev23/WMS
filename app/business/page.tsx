import { redirect } from "next/navigation";

export default function BusinessIndexPage() {
  redirect("/business/profile"); // Redirect to Profile page by default
  return null;
}
