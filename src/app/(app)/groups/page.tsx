"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, LogIn, Copy, Check, Loader2 } from "lucide-react";

interface Group {
  id: string;
  name: string;
  description: string | null;
  joinCode: string;
  isActive: boolean;
  _count: { members: number };
  members: { role: string; user: { id: string; name: string | null } }[];
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="text-xs flex items-center gap-1 text-gray-400 hover:text-purple-600 transition-colors"
    >
      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
      <span className="font-mono font-bold tracking-wider">{text}</span>
    </button>
  );
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  // Create form
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [creating, setCreating] = useState(false);

  // Join form
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");

  const fetchGroups = useCallback(async () => {
    const res = await fetch("/api/groups");
    if (res.ok) setGroups(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: createName, description: createDesc }),
    });
    if (res.ok) {
      setShowCreate(false);
      setCreateName("");
      setCreateDesc("");
      fetchGroups();
    }
    setCreating(false);
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setJoinError("");
    setJoining(true);
    const res = await fetch("/api/groups/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ joinCode }),
    });
    const data = await res.json().catch(() => ({}));
    setJoining(false);
    if (!res.ok) {
      setJoinError((data as { error?: string }).error ?? "Failed to join");
    } else {
      setShowJoin(false);
      setJoinCode("");
      fetchGroups();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-800">Groups</h1>
          <p className="text-gray-500 text-sm mt-0.5">Compete with family and friends 🏆</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setShowJoin(true); setShowCreate(false); }}>
            <LogIn className="w-4 h-4" /> Join
          </Button>
          <Button size="sm" onClick={() => { setShowCreate(true); setShowJoin(false); }}>
            <Plus className="w-4 h-4" /> Create
          </Button>
        </div>
      </div>

      {/* Create form */}
      {showCreate && (
        <Card className="border-purple-200 bg-gradient-to-br from-violet-50 to-purple-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Create a New Group</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-3">
              <Input
                placeholder="e.g. Smith Family 2026 Challenge"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                required
                autoFocus
              />
              <Textarea
                placeholder="Description (optional)"
                value={createDesc}
                onChange={(e) => setCreateDesc(e.target.value)}
                rows={2}
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={creating}>
                  {creating && <Loader2 className="w-3 h-3 animate-spin" />}
                  Create Group
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Join form */}
      {showJoin && (
        <Card className="border-purple-200 bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Join a Group</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoin} className="space-y-3">
              {joinError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{joinError}</p>
              )}
              <Input
                placeholder="Enter join code (e.g. ABC12345)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                required
                autoFocus
                className="font-mono uppercase tracking-widest"
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={joining}>
                  {joining && <Loader2 className="w-3 h-3 animate-spin" />}
                  Join Group
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowJoin(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Groups list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
          <h2 className="text-xl font-bold text-gray-700 mb-2">No groups yet</h2>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Create a group and invite your family, or join one with a code.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4" /> Create Group
            </Button>
            <Button variant="outline" onClick={() => setShowJoin(true)}>
              <LogIn className="w-4 h-4" /> Join with Code
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {groups.map((group) => (
            <Link key={group.id} href={`/groups/${group.id}`}>
              <Card className="hover:shadow-md hover:border-purple-200 transition-all cursor-pointer h-full">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-black text-lg flex-shrink-0 shadow-lg shadow-purple-500/30">
                      {group.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-800 truncate">{group.name}</h3>
                      {group.description && (
                        <p className="text-sm text-gray-500 line-clamp-1">{group.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Users className="w-4 h-4" />
                      <span>{group._count.members} members</span>
                    </div>
                    <CopyButton text={group.joinCode} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
