import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <Navbar />
      <main className="pt-16 pb-20 md:pb-8 md:pl-56">
        <div className="max-w-screen-lg mx-auto px-4 py-6">{children}</div>
      </main>
    </div>
  );
}
