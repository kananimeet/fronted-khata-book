import { redirect } from "next/navigation";

export default function AdminExpensesPage() {
  redirect("/expenses?tab=requests");
}
