import { redirect } from "next/navigation";

export default function AdminExpensesUserTotalsPage() {
  redirect("/expenses?tab=totals");
}
