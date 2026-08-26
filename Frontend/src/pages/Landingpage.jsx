import { useState, useEffect, useCallback } from 'react';
import {
  Code2, Menu, X, ArrowRight, Compass, Trophy, BookOpen, MessagesSquare,
  ChartColumn, Building2, Terminal, Zap, Cpu, Gauge, Users, Play, RotateCcw,
  Loader2, Sparkles, CheckCircle2,
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import { useNavigate } from 'react-router';
import toast, { Toaster } from 'react-hot-toast';
import '../assets/landingpage.css';

const BRAND = 'CodePeak';
const PISTON_URL = 'https://emkc.org/api/v2/piston/execute';

const NAV = [
  { label: 'Premium', type: 'premium' },
  { label: 'Explore', type: 'scroll', target: 'explore' },
  { label: 'Product', type: 'scroll', target: 'product' },
  { label: 'Developer', type: 'scroll', target: 'developer' },
];

const STATS = [
  { value: '3,000+', label: 'Problems' },
  { value: '50+', label: 'Languages' },
  { value: '1M+', label: 'Developers' },
  { value: '4.9/5', label: 'Avg. rating' },
];

const EXPLORE = [
  { icon: BookOpen, title: 'Problems', desc: '3,000+ hand-crafted challenges spanning 20 topics and 3 difficulty tiers.' },
  { icon: Trophy, title: 'Contests', desc: 'Compete in weekly rounds and climb a live global leaderboard.' },
  { icon: Compass, title: 'Study Plans', desc: 'Guided roadmaps that take you from fundamentals to expert-level.' },
  { icon: MessagesSquare, title: 'Discuss', desc: 'Learn from community solutions, editorials and curated hints.' },
  { icon: ChartColumn, title: 'Leaderboard', desc: 'Track your rank and rating against a million other developers.' },
  { icon: Building2, title: 'Interview Prep', desc: 'Company-tagged questions asked at top tech companies.' },
];

const PRODUCT = [
  { icon: Terminal, title: 'In-browser IDE', desc: 'A Monaco-powered editor with autocomplete, themes and vim-mode.' },
  { icon: Zap, title: 'Instant feedback', desc: 'Run against hidden test cases and get verdicts in milliseconds.' },
  { icon: Cpu, title: '50+ languages', desc: 'C++, Java, Python, Go, Rust and more — compiled in the cloud.' },
  { icon: Gauge, title: 'Progress tracking', desc: 'Visualize streaks, mastery and weak spots with rich analytics.' },
  { icon: Building2, title: 'Company questions', desc: 'Real interview problems, filtered by company and role.' },
  { icon: Users, title: 'Mock interviews', desc: 'Simulate the real thing with timed, peer-graded sessions.' },
];

const LANGUAGES = {
  cpp: {
    label: 'C++', monaco: 'cpp', piston: 'c++', file: 'main.cpp',
    snippet: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello from C++ 🚀" << endl;
    for (int i = 1; i <= 3; i++) cout << "i = " << i << endl;
    return 0;
}`,
  },
  java: {
    label: 'Java', monaco: 'java', piston: 'java', file: 'Main.java',
    snippet: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java ☕");
        for (int i = 1; i <= 3; i++) System.out.println("i = " + i);
    }
}`,
  },
  python: {
    label: 'Python', monaco: 'python', piston: 'python', file: 'main.py',
    snippet: `print("Hello from Python 🐍")
for i in range(1, 4):
    print(f"i = {i}")`,
  },
};

const HERO_LINES = [
  <span><span className="text-fuchsia-400">function</span> <span className="text-cyan-300">twoSum</span>(nums, target) {'{'}</span>,
  <span>{'  '}<span className="text-fuchsia-400">const</span> seen = <span className="text-fuchsia-400">new</span> <span className="text-cyan-300">Map</span>();</span>,
  <span>{'  '}<span className="text-fuchsia-400">for</span> (<span className="text-fuchsia-400">let</span> i = <span className="text-amber-300">0</span>; i {'<'} nums.length; i++) {'{'}</span>,
  <span>{'    '}<span className="text-fuchsia-400">const</span> need = target - nums[i];</span>,
  <span>{'    '}<span className="text-fuchsia-400">if</span> (seen.has(need)) <span className="text-fuchsia-400">return</span> [seen.get(need), i];</span>,
  <span>{'    '}seen.set(nums[i], i);</span>,
  <span>{'  '}{'}'}</span>,
  <span>{'}'}</span>,
];

function Eyebrow({ n, children }) {
  return (
    <div className="flex items-center gap-2 font-code text-xs uppercase tracking-[0.2em] text-emerald-400/90">
      <span className="text-slate-600">// {n}</span>
      {children}
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition duration-300 hover:-translate-y-1 hover:border-emerald-400/40 hover:bg-white/[0.05]">
      <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400/20 to-cyan-400/10 text-emerald-300 ring-1 ring-white/10">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{desc}</p>
      <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-emerald-400/0 blur-2xl transition group-hover:bg-emerald-400/10" />
    </div>
  );
}

export default function Landingpage() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [language, setLanguage] = useState('cpp');
  const [code, setCode] = useState(LANGUAGES.cpp.snippet);
  const [stdin, setStdin] = useState('');
  const [output, setOutput] = useState(null);
  const [running, setRunning] = useState(false);
  const [versions, setVersions] = useState({ cpp: '10.2.0', java: '15.0.2', python: '3.10.0' });

  // Grab the latest runtime versions Piston currently offers (falls back to defaults).
  useEffect(() => {
    axios
      .get('https://emkc.org/api/v2/piston/runtimes')
      .then(({ data }) => {
        const pick = (lang, prefer) => {
          const rs = data.filter((r) => r.language === lang);
          if (!rs.length) return null;
          const pref = prefer ? rs.filter((r) => r.version.startsWith(prefer)) : rs;
          return (pref.length ? pref : rs)
            .sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }))[0].version;
        };
        setVersions((v) => ({
          cpp: pick('c++') || v.cpp,
          java: pick('java') || v.java,
          python: pick('python', '3') || v.python,
        }));
      })
      .catch(() => {});
  }, []);

  const scrollTo = useCallback((id) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleNav = (item) => {
    if (item.type === 'scroll') scrollTo(item.target);
    else {
      setMobileOpen(false);
      toast('Premium is coming soon 🚀', { icon: '👑' });
      // navigate('/premium');  // ← swap in when the page exists
    }
  };

  const changeLanguage = (key) => {
    setLanguage(key);
    setCode(LANGUAGES[key].snippet);
    setOutput(null);
  };

  const resetCode = () => {
    setCode(LANGUAGES[language].snippet);
    setOutput(null);
  };

  const runCode = async () => {
    setRunning(true);
    setOutput(null);
    const lang = LANGUAGES[language];
    try {
      const { data } = await axios.post(PISTON_URL, {
        language: lang.piston,
        version: versions[language],
        files: [{ name: lang.file, content: code }],
        stdin,
      });
      const run = data.run || {};
      const text = [run.stdout, run.stderr].filter(Boolean).join('\n').trim();
      const isError = run.code !== 0 || !!run.stderr;
      setOutput({ text: text || '(no output)', isError });
      isError ? toast.error('Finished with errors') : toast.success('Ran successfully');
    } catch (e) {
      const msg =
        e?.response?.status === 429
          ? 'Rate limit reached — wait a few seconds and try again.'
          : 'Could not reach the compiler. Check your connection.';
      setOutput({ text: msg, isError: true });
      toast.error(msg);
    } finally {
      setRunning(false);
    }
  };

  const beforeEditorMount = (monaco) => {
    monaco.editor.defineTheme('codepeak', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: { 'editor.background': '#0a0f16', 'editorGutter.background': '#0a0f16' },
    });
  };

  return (
    <div className="lp-root relative min-h-screen bg-[#05070a] text-slate-200 antialiased">
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { background: '#0a0f16', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)' },
        }}
      />

      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="lp-blob left-[-10%] top-[-10%] h-[420px] w-[420px] bg-emerald-500/25" />
        <div className="lp-blob right-[-8%] top-[20%] h-[380px] w-[380px] bg-cyan-500/20" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 lp-grid" />
      </div>

      {/* ───────────────────────── Header ───────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-[#05070a]/70 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 text-slate-900">
              <Code2 className="h-5 w-5" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight text-white">{BRAND}</span>
          </button>

          <div className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <button
                key={item.label}
                onClick={() => handleNav(item)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <button
              onClick={() => navigate('/login')}
              className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
            >
              Sign in
            </button>
          </div>

          <button className="md:hidden text-slate-200" onClick={() => setMobileOpen((o) => !o)} aria-label="Menu">
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>

        {mobileOpen && (
          <div className="border-t border-white/5 bg-[#05070a]/95 px-4 py-4 md:hidden">
            <div className="flex flex-col gap-1">
              {NAV.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleNav(item)}
                  className="rounded-lg px-3 py-3 text-left text-sm font-medium text-slate-200 hover:bg-white/5"
                >
                  {item.label}
                </button>
              ))}
              <button
                onClick={() => navigate('/login')}
                className="mt-2 rounded-lg border border-white/15 px-3 py-3 text-sm font-semibold text-white hover:bg-white/5"
              >
                Sign in
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ───────────────────────── Hero ───────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pb-20 pt-32 sm:px-6 lg:px-8 lg:pt-40">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" /> Practice. Compete. Get hired.
            </span>

            <h1 className="mt-6 font-display text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Get sharp on the{' '}
              <span className="lp-gradient-text">problems that matter</span>.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-400">
              A modern arena to master data structures, ace technical interviews and
              write code that runs — all in your browser, no setup required.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={() => navigate('/signup')}
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-emerald-500/20 transition hover:shadow-emerald-500/40"
              >
                Create account
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </button>
              <button
                onClick={() => scrollTo('explore')}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
              >
                <Compass className="h-4 w-4" /> Explore problems
              </button>
            </div>

            <dl className="mt-12 grid max-w-lg grid-cols-2 gap-6 sm:grid-cols-4">
              {STATS.map((s) => (
                <div key={s.label}>
                  <dt className="font-display text-2xl font-bold text-white">{s.value}</dt>
                  <dd className="mt-1 text-xs uppercase tracking-wide text-slate-500">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Code card */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0f16] shadow-2xl">
              <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-rose-400/80" />
                <span className="h-3 w-3 rounded-full bg-amber-400/80" />
                <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
                <span className="ml-2 font-code text-xs text-slate-500">two-sum.js</span>
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                  <CheckCircle2 className="h-3 w-3" /> Accepted
                </span>
              </div>
              <div className="p-5 font-code text-[13px] leading-6">
                {HERO_LINES.map((ln, i) => (
                  <div key={i} className="flex">
                    <span className="w-8 shrink-0 select-none pr-4 text-right text-slate-600">{i + 1}</span>
                    <code className="whitespace-pre text-slate-300">{ln}</code>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────── Explore ───────────────────────── */}
      <section id="explore" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6 lg:px-8">
        <Eyebrow n="01">Explore</Eyebrow>
        <h2 className="mt-3 max-w-2xl font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Everything you need to keep learning
        </h2>
        <p className="mt-4 max-w-2xl text-slate-400">
          From your first array problem to your final on-site — dive into the parts of the
          platform that push you forward.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {EXPLORE.map((item) => (
            <FeatureCard key={item.title} {...item} />
          ))}
        </div>
      </section>

      {/* ───────────────────────── Product ───────────────────────── */}
      <section id="product" className="scroll-mt-20 border-y border-white/5 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <Eyebrow n="02">Product</Eyebrow>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            A platform built for people who ship
          </h2>
          <p className="mt-4 max-w-2xl text-slate-400">
            Powerful tooling that stays out of your way, so you can focus on the one thing
            that counts — solving the problem.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PRODUCT.map((item) => (
              <FeatureCard key={item.title} {...item} />
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── Developer (live compiler) ───────────────────────── */}
      <section id="developer" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6 lg:px-8">
        <Eyebrow n="03">Developer</Eyebrow>
        <h2 className="mt-3 max-w-2xl font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Try the editor right now
        </h2>
        <p className="mt-4 max-w-2xl text-slate-400">
          No sign-up, no setup. Pick a language, hit <span className="text-emerald-300">Run</span>, and
          watch it compile in the cloud.
        </p>

        <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-[#0a0f16]">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 border-b border-white/5 px-4 py-3">
            <div className="flex items-center gap-1 rounded-lg bg-white/5 p-1">
              {Object.entries(LANGUAGES).map(([key, l]) => (
                <button
                  key={key}
                  onClick={() => changeLanguage(key)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    language === key ? 'bg-emerald-400 text-slate-900' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={resetCode}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
              >
                <RotateCcw className="h-4 w-4" /> Reset
              </button>
              <button
                onClick={runCode}
                disabled={running}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-400 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:shadow-lg hover:shadow-emerald-500/30 disabled:opacity-60"
              >
                {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {running ? 'Running…' : 'Run'}
              </button>
            </div>
          </div>

          {/* Editor + Console */}
          <div className="grid gap-px bg-white/5 lg:grid-cols-2">
            <div className="h-[440px] bg-[#0a0f16]">
              <Editor
                height="100%"
                theme="codepeak"
                language={LANGUAGES[language].monaco}
                value={code}
                onChange={(v) => setCode(v ?? '')}
                beforeMount={beforeEditorMount}
                loading={<Loader2 className="h-6 w-6 animate-spin text-emerald-400" />}
                options={{
                  fontSize: 14,
                  fontFamily: "'JetBrains Mono', monospace",
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  padding: { top: 16 },
                  smoothScrolling: true,
                  tabSize: 4,
                }}
              />
            </div>

            <div className="flex h-[440px] flex-col bg-[#0a0f16]">
              <div className="flex items-center gap-2 border-b border-white/5 px-4 py-2 font-code text-xs uppercase tracking-widest text-slate-500">
                <Terminal className="h-3.5 w-3.5" /> Output
              </div>
              <div className="lp-console flex-1 overflow-auto p-4 font-code text-[13px] leading-relaxed">
                {running ? (
                  <div className="flex items-center gap-2 text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" /> Compiling &amp; running…
                  </div>
                ) : output ? (
                  <pre className={`whitespace-pre-wrap ${output.isError ? 'text-rose-300' : 'text-emerald-300'}`}>
                    {output.text}
                  </pre>
                ) : (
                  <span className="text-slate-600">// Output will appear here after you press Run.</span>
                )}
              </div>
            </div>
          </div>

          {/* Stdin */}
          <div className="border-t border-white/5 p-4">
            <label className="mb-2 block font-code text-xs uppercase tracking-widest text-slate-500">
              Standard input (stdin)
            </label>
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              rows={2}
              placeholder="Optional — passed to your program's stdin"
              className="w-full resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-code text-sm text-slate-200 placeholder:text-slate-600 focus:border-emerald-400/40 focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* ───────────────────────── Footer ───────────────────────── */}
      <footer className="border-t border-white/5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-10 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 text-slate-900">
              <Code2 className="h-5 w-5" />
            </span>
            <span className="font-display font-bold text-white">{BRAND}</span>
          </div>
          <p className="text-sm text-slate-500">© {new Date().getFullYear()} {BRAND}. Built for developers.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <a href="#" className="transition hover:text-white" aria-label="GitHub">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                </svg>
            </a>
            <a href="#" className="transition hover:text-white" aria-label="GitHub">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                </svg>
            </a>
            <a href="#" className="transition hover:text-white" aria-label="LinkedIn">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
