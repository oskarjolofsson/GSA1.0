import { redirect } from "next/navigation";

/** Business has no landing page of its own — send it to its first sub-page. */
export default function BusinessPage() {
  redirect("/business/subscriptions");
}
