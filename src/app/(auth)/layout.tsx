import { Dumbbell } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-pink-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur mb-4">
            <Dumbbell className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">FamilyFit</h1>
          <p className="text-purple-200 mt-2 font-medium">Challenge your family. Move together.</p>
        </div>
        <div className="bg-white rounded-3xl shadow-2xl shadow-purple-900/30 p-8">{children}</div>
      </div>
    </div>
  );
}
