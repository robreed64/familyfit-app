"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getRankEmoji, getStreakEmoji, formatPoints } from "@/lib/utils";
import { Copy, Check, Users, ArrowLeft, Loader2, Send, Trophy, Trash2 } from "lucide-react";

interface LeaderboardEntry {
  userId: string;
  name: string | null;
  image: string | null;
  role: string;
  totalPoints: number;
  totalSteps: number;
  activityDays: number;
  streak: number;
}

interface Cheer {
  id: string;
  message: string;
  emoji: string | null;
  createdAt: string;
  sender: { id: string; name: string | null; image: string | null };
  receiver: { id: string; name: string | null; image: string | null };
}

interface GroupDetail {
  id: string;
  name: string;
  description: string | null;
  joinCode: string;
  myRole: string;
  members: { userId: string; role: string; user: { id: string; name: string | null; image: string | null } }[];
}

function AvatarFallbackText(name: string | null) {
  return (name ?? "?").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export default function GroupPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [cheers, setCheers] = useState<Cheer[]>([]);
  const [period, setPeriod] = useState("weekly");
  const [tab, setTab] = useState<"leaderboard" | "cheers">("leaderboard");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/groups/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/groups");
    } else {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  }

  // Cheer form
  const [cheerTo, setCheerTo] = useState("");
  const [cheerMsg, setCheerMsg] = useState("");
  const [cheerEmoji, setCheerEmoji] = useState("💪");
  const [sending, setSending] = useState(false);

  const fetchData = useCallback(async () => {
    const [groupRes, lbRes, cheerRes] = await Promise.all([
      fetch(`/api/groups/${id}`),
      fetch(`/api/groups/${id}/leaderboard?period=${period}`),
      fetch(`/api/groups/${id}/cheers`),
    ]);
    if (groupRes.ok) setGroup(await groupRes.json());
    if (lbRes.ok) setLeaderboard(await lbRes.json());
    if (cheerRes.ok) setCheers(await cheerRes.json());
    setLoading(false);
  }, [id, period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function sendCheer(e: React.FormEvent) {
    e.preventDefault();
    if (!cheerTo || !cheerMsg) return;
    setSending(true);
    const res = await fetch(`/api/groups/${id}/cheers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: cheerTo, message: cheerMsg, emoji: cheerEmoji }),
    });
    setSending(false);
    if (res.ok) {
      setCheerMsg("");
      fetchData();
    }
  }

  const top = leaderboard[0];
  const maxPoints = top?.totalPoints ?? 1;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Group not found.</p>
        <Link href="/groups">
          <Button variant="ghost" className="mt-4">Back to Groups</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <Link href="/groups" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-purple-600 mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> Groups
        </Link>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-purple-500/30 flex-shrink-0">
            {group.name.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-gray-800">{group.name}</h1>
              {group.myRole === "admin" && !deleteConfirm && (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete group"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            {deleteConfirm && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-red-600 font-medium">Delete this group?</span>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-xs px-2 py-0.5 rounded bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
                >
                  {deleting ? "Deleting…" : "Yes, delete"}
                </button>
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
            {group.description && <p className="text-gray-500 text-sm">{group.description}</p>}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <Users className="w-4 h-4" />
                {group.members.length} members
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(group.joinCode);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-purple-600 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="font-mono font-bold tracking-widest">{group.joinCode}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-purple-50 rounded-xl p-1">
        <button
          onClick={() => setTab("leaderboard")}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "leaderboard" ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-purple-600"}`}
        >
          🏆 Leaderboard
        </button>
        <button
          onClick={() => setTab("cheers")}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "cheers" ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-purple-600"}`}
        >
          💬 Cheers
        </button>
      </div>

      {tab === "leaderboard" && (
        <div className="space-y-4">
          {/* Period selector */}
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Today</SelectItem>
              <SelectItem value="weekly">This Week</SelectItem>
              <SelectItem value="monthly">This Month</SelectItem>
              <SelectItem value="alltime">All Time</SelectItem>
            </SelectContent>
          </Select>

          {/* Podium */}
          {leaderboard.length >= 3 && (
            <div className="flex items-end justify-center gap-3 py-4">
              {[leaderboard[1], leaderboard[0], leaderboard[2]].map((entry, i) => {
                const rank = i === 1 ? 1 : i === 0 ? 2 : 3;
                const heights = ["h-20", "h-28", "h-16"];
                const colors = ["from-slate-400 to-slate-500", "from-yellow-400 to-orange-500", "from-orange-300 to-amber-400"];
                return (
                  <div key={entry.userId} className="flex flex-col items-center gap-2">
                    <Avatar className="w-10 h-10 border-2 border-white shadow-md">
                      <AvatarImage src={entry.image ?? undefined} />
                      <AvatarFallback>{AvatarFallbackText(entry.name)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-semibold text-gray-600 max-w-16 truncate text-center">
                      {entry.name?.split(" ")[0]}
                    </span>
                    <div
                      className={`w-16 rounded-t-xl ${heights[i]} bg-gradient-to-t ${colors[i]} flex items-start justify-center pt-1`}
                    >
                      <span className="text-xl">{getRankEmoji(rank)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full list */}
          <div className="space-y-2">
            {leaderboard.map((entry, idx) => {
              const rank = idx + 1;
              const pct = maxPoints > 0 ? Math.round((entry.totalPoints / maxPoints) * 100) : 0;
              return (
                <Card key={entry.userId} className={rank <= 3 ? "border-purple-200" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xl w-8 text-center flex-shrink-0">{getRankEmoji(rank)}</span>
                      <Avatar className="w-9 h-9">
                        <AvatarImage src={entry.image ?? undefined} />
                        <AvatarFallback>{AvatarFallbackText(entry.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-gray-800 truncate">{entry.name ?? "Unknown"}</span>
                          {entry.streak > 0 && (
                            <span className="text-xs text-orange-500 font-semibold">
                              {getStreakEmoji(entry.streak)} {entry.streak}d
                            </span>
                          )}
                          {entry.role === "admin" && (
                            <Badge variant="gold" className="text-xs py-0">Admin</Badge>
                          )}
                        </div>
                        <Progress value={pct} className="h-1.5 mt-1.5" />
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-black text-purple-700">{formatPoints(entry.totalPoints)}</div>
                        <div className="text-xs text-gray-400">pts</div>
                      </div>
                    </div>
                    <div className="flex gap-4 text-xs text-gray-500 pl-11">
                      <span>👟 {entry.totalSteps.toLocaleString()} steps</span>
                      <span>📅 {entry.activityDays} active days</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {tab === "cheers" && (
        <div className="space-y-4">
          {/* Send cheer */}
          <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Send a Cheer 🎉</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={sendCheer} className="space-y-3">
                <Select value={cheerTo} onValueChange={setCheerTo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Who are you cheering?" />
                  </SelectTrigger>
                  <SelectContent>
                    {group.members.map((m) => (
                      <SelectItem key={m.user.id} value={m.user.id}>
                        {m.user.name ?? "Unknown"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <div className="flex gap-1">
                    {["💪", "🔥", "🎉", "⚡", "🏆", "👏"].map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => setCheerEmoji(e)}
                        className={`w-8 h-8 rounded-lg text-lg transition-all ${cheerEmoji === e ? "bg-purple-200 scale-110" : "hover:bg-purple-100"}`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Write an encouraging message..."
                    value={cheerMsg}
                    onChange={(e) => setCheerMsg(e.target.value)}
                    required
                  />
                  <Button type="submit" size="icon" disabled={sending}>
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Cheer feed */}
          <div className="space-y-3">
            {cheers.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-5xl mb-3">💬</div>
                <p className="text-gray-500 text-sm">No cheers yet — be the first to encourage someone!</p>
              </div>
            ) : (
              cheers.map((cheer) => (
                <Card key={cheer.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{cheer.emoji ?? "💪"}</span>
                      <div className="flex-1">
                        <p className="text-sm text-gray-700">
                          <span className="font-bold">{cheer.sender.name}</span>
                          <span className="text-gray-400"> cheered </span>
                          <span className="font-bold">{cheer.receiver.name}</span>
                        </p>
                        <p className="text-gray-600 mt-0.5 text-sm">&ldquo;{cheer.message}&rdquo;</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(cheer.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
