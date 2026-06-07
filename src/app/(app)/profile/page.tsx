"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatPoints, getActivityEmoji } from "@/lib/utils";
import { Loader2, Edit2, Save, X, Watch } from "lucide-react";
import Link from "next/link";

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  bio: string | null;
  createdAt: string;
  totalPoints: number;
  totalSteps: number;
  _count: { activities: number; groupMembers: number };
  badges: { earnedAt: string; badge: { name: string; icon: string; description: string } }[];
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((d) => {
        setProfile(d);
        setName(d.name ?? "");
        setBio(d.bio ?? "");
      });
  }, []);

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, bio }),
    });
    if (res.ok) {
      const updated = await res.json();
      setProfile((p) => p ? { ...p, ...updated } : p);
      setEditing(false);
    }
    setSaving(false);
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
      </div>
    );
  }

  const initials = (profile.name ?? "?").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  const statsItems = [
    { label: "Total Points", value: formatPoints(profile.totalPoints), emoji: "⚡" },
    { label: "Total Steps", value: profile.totalSteps.toLocaleString(), emoji: "👟" },
    { label: "Activities", value: profile._count.activities.toString(), emoji: "🏅" },
    { label: "Groups", value: profile._count.groupMembers.toString(), emoji: "👥" },
  ];

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-3xl font-black text-gray-800">Profile</h1>

      {/* Profile card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="w-20 h-20 border-4 border-purple-100">
              <AvatarImage src={profile.image ?? undefined} />
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              {editing ? (
                <div className="space-y-2">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    autoFocus
                  />
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell the family about your fitness goals..."
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSave} disabled={saving}>
                      {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                      <X className="w-3 h-3" /> Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">{profile.name ?? "Add your name"}</h2>
                      <p className="text-sm text-gray-500">{profile.email}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  {profile.bio && <p className="text-sm text-gray-600 mt-2">{profile.bio}</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    Member since {new Date(profile.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                  </p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connected devices shortcut */}
      <Link href="/profile/connections">
        <Card className="hover:border-purple-200 hover:shadow-sm transition-all cursor-pointer">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
              <Watch className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm text-gray-800">Connected Devices</div>
              <div className="text-xs text-gray-400">Fitbit · Apple Health via Shortcut</div>
            </div>
            <span className="text-gray-300">›</span>
          </CardContent>
        </Card>
      </Link>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {statsItems.map(({ label, value, emoji }) => (
          <Card key={label}>
            <CardContent className="p-4 text-center">
              <div className="text-3xl mb-1">{emoji}</div>
              <div className="text-2xl font-black text-gray-800">{value}</div>
              <div className="text-xs text-gray-500 font-medium">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Badges */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Badges & Achievements 🏆</CardTitle>
        </CardHeader>
        <CardContent>
          {profile.badges.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-2">🥇</div>
              <p className="text-sm text-gray-500">Keep going — badges are on their way!</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {profile.badges.map(({ badge, earnedAt }) => (
                <div key={badge.name} className="flex flex-col items-center text-center p-3 rounded-xl bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200">
                  <span className="text-3xl">{badge.icon}</span>
                  <span className="text-xs font-bold text-gray-700 mt-1">{badge.name}</span>
                  <span className="text-xs text-gray-400">{new Date(earnedAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
