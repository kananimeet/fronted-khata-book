import { redirect } from "next/navigation";

export default function ExpensesTotalsUsersPage() {
  redirect("/expenses?tab=totals");
}
