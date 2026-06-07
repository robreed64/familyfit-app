"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, RefreshCw, Unlink, Copy, Check,
  RotateCcw, ExternalLink, Loader2, AlertCircle, CheckCircle2,
} from "lucide-react";

interface Connection {
  provider: string;
  lastSynced: string | null;
}

const SHORTCUT_STEPS = [
  'Open the "Shortcuts" app on your iPhone.',
  'Tap "+" to create a new shortcut.',
  'Tap "Add Action" and search for "Health". Add "Find Health Samples".',
  'Set Type to "Steps", set Sort by "Start Date", Limit to 1 (most recent).',
  'Add another action: "Get Numbers from" → select the Health Samples variable.',
  'Add "Get Variable" and name a new variable "steps" = the number.',
  'Add a "URL" action and paste your API endpoint URL (shown below).',
  'Add a "Get Contents of URL" action. Method: POST. Headers: Authorization = Bearer YOUR_TOKEN. Body: JSON with key "steps" = steps variable, "date" = Shortcut Input or current date.',
  'Add a second "Find Health Samples" for Workouts (optional). Repeat for each workout type you want.',
  'Name the shortcut "FamilyFit Sync" and add it to your Home Screen or set as an Automation (runs daily).',
];

function TokenSection() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/user/token")
      .then((r) => r.json())
      .then((d) => { setToken(d.token ?? null); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function generate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/user/token", { method: "POST" });
      if (res.ok) {
        const d = await res.json();
        setToken(d.token ?? null);
      }
    } catch {
      // network error or non-JSON response — leave token unchanged
    } finally {
      setGenerating(false);
    }
  }

  async function revoke() {
    if (!confirm("Revoke token? Your iOS Shortcut will stop syncing until you update it with a new token.")) return;
    setRevoking(true);
    await fetch("/api/user/token", { method: "DELETE" });
    setToken(null);
    setRevoking(false);
  }

  function copy() {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-purple-400" /></div>;

  return (
    <div className="space-y-3">
      {token ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
            <code className="flex-1 text-xs font-mono text-gray-700 break-all">{token}</code>
            <button onClick={copy} className="shrink-0 text-gray-400 hover:text-purple-600 transition-colors">
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={generate} disabled={generating}>
              {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
              Regenerate
            </Button>
            <Button size="sm" variant="destructive" onClick={revoke} disabled={revoking}>
              Revoke
            </Button>
          </div>
          <p className="text-xs text-gray-400">Keep this token private — it grants write access to your activity data.</p>
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-500 mb-3">Generate a token to authenticate your iOS Shortcut.</p>
          <Button size="sm" onClick={generate} disabled={generating}>
            {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            Generate Token
          </Button>
        </div>
      )}
    </div>
  );
}

export default function ConnectionsPage() {
  const [successParam, setSuccessParam] = useState<string | null>(null);
  const [errorParam, setErrorParam] = useState<string | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loadingConns, setLoadingConns] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [apiBase, setApiBase] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSuccessParam(params.get("success"));
    setErrorParam(params.get("error"));
    setApiBase(window.location.origin);
  }, []);

  const fetchConnections = useCallback(async () => {
    const res = await fetch("/api/user/connections");
    if (res.ok) setConnections(await res.json());
    setLoadingConns(false);
  }, []);

  useEffect(() => { fetchConnections(); }, [fetchConnections]);

  const fitbitConnected = connections.some((c) => c.provider === "fitbit");
  const fitbitConn = connections.find((c) => c.provider === "fitbit");

  async function syncFitbit() {
    setSyncing(true);
    setSyncResult(null);
    const res = await fetch("/api/fitbit/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ daysBack: 7 }) });
    const d = await res.json();
    setSyncResult(res.ok ? `Synced ${d.imported} activities` : d.error ?? "Sync failed");
    setSyncing(false);
    fetchConnections();
  }

  async function disconnectFitbit() {
    if (!confirm("Disconnect Fitbit? Your synced activities will remain but no new data will sync.")) return;
    setDisconnecting(true);
    await fetch("/api/fitbit/disconnect", { method: "POST" });
    setDisconnecting(false);
    fetchConnections();
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <Link href="/profile" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-purple-600 mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> Profile
        </Link>
        <h1 className="text-3xl font-black text-gray-800">Connected Devices</h1>
        <p className="text-gray-500 text-sm mt-0.5">Sync your wearable data automatically</p>
      </div>

      {/* Status banners */}
      {successParam === "fitbit" && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Fitbit connected! Last 7 days of activity have been synced.
        </div>
      )}
      {errorParam && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {errorParam === "fitbit_denied" ? "Fitbit connection was cancelled." : "Connection failed — please try again."}
        </div>
      )}

      {/* ── Fitbit ─────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00B0B9] flex items-center justify-center text-white font-black text-sm">
                fit
              </div>
              <div>
                <CardTitle className="text-base">Fitbit</CardTitle>
                <p className="text-xs text-gray-400">Steps, workouts, heart rate</p>
              </div>
            </div>
            {loadingConns ? (
              <Loader2 className="w-4 h-4 animate-spin text-gray-300" />
            ) : fitbitConnected ? (
              <Badge variant="success">Connected</Badge>
            ) : (
              <Badge variant="outline">Not connected</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {!process.env.NEXT_PUBLIC_FITBIT_CONFIGURED && !fitbitConnected && (
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1">
              <p className="font-semibold">Setup required before connecting:</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Go to <a href="https://dev.fitbit.com/apps/new" target="_blank" rel="noreferrer" className="underline inline-flex items-center gap-0.5">dev.fitbit.com/apps/new <ExternalLink className="w-3 h-3" /></a></li>
                <li>Set callback URL to: <code className="bg-amber-100 px-1 rounded">{apiBase}/api/fitbit/callback</code></li>
                <li>Add <code className="bg-amber-100 px-1 rounded">FITBIT_CLIENT_ID</code> and <code className="bg-amber-100 px-1 rounded">FITBIT_CLIENT_SECRET</code> to your <code className="bg-amber-100 px-1 rounded">.env</code> file</li>
                <li>Restart the dev server</li>
              </ol>
            </div>
          )}

          {fitbitConnected ? (
            <div className="space-y-2">
              {fitbitConn?.lastSynced && (
                <p className="text-xs text-gray-500">
                  Last synced: {new Date(fitbitConn.lastSynced).toLocaleString()}
                </p>
              )}
              {syncResult && (
                <p className="text-xs text-purple-600 font-medium">{syncResult}</p>
              )}
              <div className="flex gap-2">
                <Button size="sm" onClick={syncFitbit} disabled={syncing}>
                  {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  Sync now
                </Button>
                <Button size="sm" variant="outline" onClick={disconnectFitbit} disabled={disconnecting}>
                  {disconnecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unlink className="w-3 h-3" />}
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <a href="/api/fitbit">
              <Button size="sm">Connect Fitbit</Button>
            </a>
          )}
        </CardContent>
      </Card>

      {/* ── Apple Health (iOS Shortcut) ─────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center text-white text-lg">
                ♥
              </div>
              <div>
                <CardTitle className="text-base">Apple Health</CardTitle>
                <p className="text-xs text-gray-400">Via iOS Shortcut — auto-syncs daily</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step 1: Token */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-2">Step 1 — Get your API token</h3>
            <TokenSection />
          </div>

          {/* Step 2: Endpoint */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-2">Step 2 — Your sync endpoint</h3>
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl border border-gray-200">
              <code className="flex-1 text-xs font-mono text-gray-700 break-all">
                {apiBase}/api/health/apple
              </code>
            </div>
          </div>

          {/* Step 3: Shortcut instructions */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-2">Step 3 — Build the iOS Shortcut</h3>
            <div className="space-y-1">
              {SHORTCUT_STEPS.map((step, i) => (
                <div key={i} className="flex gap-2.5 text-sm text-gray-600">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payload reference */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-2">JSON payload reference</h3>
            <pre className="text-xs bg-gray-900 text-green-400 rounded-xl p-4 overflow-x-auto">
{`POST ${apiBase}/api/health/apple
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "date": "2026-06-07",
  "steps": 8432,
  "workouts": [
    {
      "type": "Running",
      "duration": 35,
      "distance": 5.2,
      "calories": 310,
      "startDate": "2026-06-07"
    }
  ]
}`}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* ── Android Health Connect ──────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-sm font-black">
              HC
            </div>
            <div>
              <CardTitle className="text-base">Android Health Connect</CardTitle>
              <p className="text-xs text-gray-400">Via Tasker or Automate — auto-syncs daily</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-3">
            Health Connect has no web API — it is Android-local only. The approaches below use an automation app to read your data and securely POST it to FamilyFit.
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-2">Step 1 — Get your API token</h3>
            <p className="text-xs text-gray-500 mb-2">Same token as Apple Health — generate one above if you haven&apos;t already.</p>
            <TokenSection />
          </div>

          <AndroidInstructions apiBase={apiBase} />
        </CardContent>
      </Card>

      {/* ── Samsung Smart Watch ────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-xs font-black">
              SAM
            </div>
            <div>
              <CardTitle className="text-base">Samsung Galaxy Watch</CardTitle>
              <p className="text-xs text-gray-400">Works automatically via Health Connect</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3 font-medium">
            ✅ Galaxy Watch 4, 5, 6, 7, FE, and Ultra already sync through Android Health Connect — no extra setup needed.
          </div>
          <div className="space-y-1.5">
            {[
              "Make sure Samsung Health is installed and your Galaxy Watch is paired.",
              "Open Samsung Health → Profile → Connected Services → enable Health Connect.",
              "Follow the Android Health Connect steps above (Tasker or Automate).",
              "Your Galaxy Watch workouts and steps will arrive automatically.",
            ].map((step, i) => (
              <div key={i} className="flex gap-2.5 text-sm text-gray-600">
                <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span>{step}</span>
              </div>
            ))}
          </div>
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
            <strong>Older watches (Watch 3 / Active / Active 2):</strong> Tizen-based watches don&apos;t write to Health Connect. Use the Garmin-style FIT export below as a fallback, or export CSV from Samsung Health.
          </div>
        </CardContent>
      </Card>

      {/* ── Garmin ─────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-xs font-black">
              GRM
            </div>
            <div>
              <CardTitle className="text-base">Garmin</CardTitle>
              <p className="text-xs text-gray-400">Import .fit files exported from Garmin Connect</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
            Garmin&apos;s Connect API requires enterprise partnership approval. The most reliable path for individual users is exporting .fit files from Garmin Connect and uploading them here.
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-2">How to export from Garmin Connect</h3>
            <div className="space-y-1.5">
              {[
                "Open garmin.com and sign in to Garmin Connect.",
                "Go to Activities → All Activities.",
                "Click any activity to open it.",
                'Click the ••• menu (top right) → "Export Original" — this downloads a .fit file.',
                "Repeat for each activity you want to import, then upload all files below.",
              ].map((step, i) => (
                <div key={i} className="flex gap-2.5 text-sm text-gray-600">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          <GarminUpload />
        </CardContent>
      </Card>
    </div>
  );
}

function AndroidInstructions({ apiBase }: { apiBase: string }) {
  const [tab, setTab] = useState<"tasker" | "automate">("tasker");
  const endpoint = `${apiBase}/api/health/android`;

  const taskerSteps = [
    "Install Tasker from the Play Store (paid, ~$3.49 — free 7-day trial available).",
    "Install the free \"Health Connect Tasker Plugin\" from the Play Store.",
    "In Tasker, create a new Task named \"FamilyFit Sync\".",
    "Add action: Plugin → Health Connect → Query Steps Total. Set date range to Today. Store result in variable %hc_steps.",
    "Add action: Variable → Variable Set. Name: %today. To: %DATE (Tasker built-in — format it YYYY-MM-DD using Variable Process if needed).",
    `Add action: Net → HTTP Request. Method: POST. URL: ${endpoint}`,
    "In HTTP Request add Header: Authorization = Bearer YOUR_TOKEN and Content-Type = application/json.",
    'Set Body to: {"date":"%today","steps":%hc_steps}',
    "Add action: Plugin → Health Connect → Query Exercise Sessions. Date range: Today. Loop through results to append workouts to the body JSON if desired.",
    "Create a Profile: Time → Every day at your preferred sync time (e.g. 23:00). Link to the FamilyFit Sync task.",
    "Grant Health Connect read permissions to Tasker: Android Settings → Apps → Tasker → Health Connect permissions.",
  ];

  const automateSteps = [
    "Install Automate from the Play Store (free for up to 30 blocks).",
    "Create a new Flow named \"FamilyFit Sync\".",
    "Add a \"Flow beginning\" block, set trigger to Periodic (every 24 hours).",
    "Add a \"Content resolver query\" block. Use URI: content://androidx.health.connect.client.provider for Health Connect data.",
    "Add an \"HTTP request\" block. Method: POST.",
    `URL: ${endpoint}`,
    "Headers: Authorization → Bearer YOUR_TOKEN, Content-Type → application/json.",
    "Body: build a JSON string with today's date and step count from the query result.",
    "Connect: Flow beginning → query → HTTP request → End.",
    "Run once manually to confirm a 200 response, then enable background execution in Automate settings.",
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-gray-700">Step 2 — Choose your automation app</h3>
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setTab("tasker")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === "tasker" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          Tasker (recommended)
        </button>
        <button
          onClick={() => setTab("automate")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === "automate" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          Automate (free)
        </button>
      </div>

      <div className="space-y-1.5">
        {(tab === "tasker" ? taskerSteps : automateSteps).map((step, i) => (
          <div key={i} className="flex gap-2.5 text-sm text-gray-600">
            <span className="shrink-0 w-5 h-5 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center mt-0.5">
              {i + 1}
            </span>
            <span>{step}</span>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-2 mt-2">JSON payload reference</h3>
        <pre className="text-xs bg-gray-900 text-green-400 rounded-xl p-4 overflow-x-auto whitespace-pre-wrap">
{`POST ${endpoint}
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "date": "2026-06-07",
  "steps": 9241,
  "distance": 6.8,
  "calories": 420,
  "workouts": [
    {
      "type": "RUNNING",
      "duration": 42,
      "distance": 6.8,
      "calories": 380,
      "startDate": "2026-06-07"
    }
  ]
}

Supported workout types:
RUNNING, WALKING, HIKING, BIKING,
SWIMMING_OPEN_WATER, SWIMMING_POOL,
YOGA, STRENGTH_TRAINING, WEIGHT_LIFTING,
HIIT, CALISTHENICS, CROSSFIT`}
        </pre>
      </div>
    </div>
  );
}

function GarminUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFiles(Array.from(e.target.files ?? []));
    setResult(null);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files).filter((f) =>
      f.name.toLowerCase().endsWith(".fit")
    );
    setFiles(dropped);
    setResult(null);
  }

  async function upload() {
    if (files.length === 0) return;
    setUploading(true);
    setResult(null);

    const formData = new FormData();
    files.forEach((f) => formData.append("file", f));

    const res = await fetch("/api/health/garmin", { method: "POST", body: formData });
    const data = await res.json();
    setResult(data);
    if (res.ok) setFiles([]);
    setUploading(false);
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-gray-700">Upload .fit files</h3>

      {/* Drop zone */}
      <label
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-6 cursor-pointer transition-colors ${
          dragOver
            ? "border-blue-400 bg-blue-50"
            : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
        }`}
      >
        <span className="text-2xl">📁</span>
        <span className="text-sm font-medium text-gray-600">
          {files.length > 0
            ? `${files.length} file${files.length > 1 ? "s" : ""} selected`
            : "Drop .fit files here or click to browse"}
        </span>
        <span className="text-xs text-gray-400">Supports multiple files at once</span>
        <input
          type="file"
          accept=".fit"
          multiple
          className="hidden"
          onChange={onFileChange}
        />
      </label>

      {files.length > 0 && (
        <div className="space-y-1">
          {files.map((f) => (
            <div key={f.name} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-1.5">
              <span>📄</span>
              <span className="flex-1 truncate">{f.name}</span>
              <span className="text-gray-400">{(f.size / 1024).toFixed(0)} KB</span>
            </div>
          ))}
        </div>
      )}

      {result && (
        <div className={`rounded-xl p-3 text-sm ${result.imported > 0 ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {result.imported > 0 && <p className="font-semibold">✅ Imported {result.imported} activit{result.imported === 1 ? "y" : "ies"}</p>}
          {result.errors?.map((e, i) => <p key={i} className="text-xs mt-1">⚠ {e}</p>)}
        </div>
      )}

      <Button
        size="sm"
        onClick={upload}
        disabled={files.length === 0 || uploading}
        className="w-full"
      >
        {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
        {uploading ? "Importing..." : `Import ${files.length > 0 ? files.length + " file" + (files.length > 1 ? "s" : "") : "files"}`}
      </Button>
    </div>
  );
}
