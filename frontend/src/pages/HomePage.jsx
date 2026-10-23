import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  GraduationCap,
  Building2,
  ShieldCheck,
  Zap,
  Users,
  CheckCircle2,
  ArrowRight,
  Lock,
  Smartphone,
  Mail,
  FileText,
  KeyRound,
  FileCheck,
  Server,
  Layers,
  Database,
  BarChart3,
  Cpu,
  Code2,
  UserCheck,
  Search,
  Sparkles,
  Terminal,
  Activity,
  GitBranch,
  ArrowDown,
  ExternalLink,
} from 'lucide-react';

import Navbar from '../components/layout/Navbar';

/**
 * Public Landing Page for CAMPUS JOB.
 * Recruiter-focused presentation highlighting personal developer branding,
 * full-stack architecture, verified bug fixes, defensive security, and system metrics.
 */
const HomePage = () => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Navigation */}
      <Navbar />

      <main>
        {/* ========================================================================= */}
        {/* 1. HERO SECTION                                                           */}
        {/* ========================================================================= */}
        <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
          {/* Ambient lighting glows */}
          <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-gradient-to-tr from-indigo-600/20 via-purple-600/15 to-pink-600/10 blur-[130px]" />
          <div className="pointer-events-none absolute top-1/2 right-10 h-72 w-72 rounded-full bg-violet-600/10 blur-[100px]" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center max-w-3xl mx-auto">
              {/* Product Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-300 shadow-sm backdrop-blur-md mb-6">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                <span>Full-Stack Campus Recruitment Platform</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-slate-50 leading-tight">
                From campus applications to{' '}
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  complete recruitment workflows.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
                A unified, role-governed platform connecting <strong className="text-slate-100 font-semibold">Students</strong>, <strong className="text-slate-100 font-semibold">Recruiters</strong>, and <strong className="text-slate-100 font-semibold">Administrators</strong> with automated application pipelines, verified PDF resume evaluation, and centralized placement intelligence.
              </p>

              {/* Primary Call to Actions */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link
                  to="/jobs"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:scale-[1.02] hover:from-indigo-400 hover:to-violet-500 active:scale-[0.98]"
                >
                  <Search className="h-4 w-4" />
                  Explore Jobs
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <a
                  href="#what-i-engineered"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/90 px-6 py-3.5 text-sm font-semibold text-slate-200 shadow-md backdrop-blur-md transition-all hover:border-indigo-500/40 hover:bg-slate-800 hover:text-white"
                >
                  <Code2 className="h-4 w-4 text-indigo-400" />
                  View Project
                </a>

                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-medium text-slate-400 transition-colors hover:text-slate-200"
                >
                  Get Started
                </Link>
              </div>

              {/* Quick Feature Badges */}
              <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>148 Passing Automated Tests</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-indigo-400" />
                  <span>Stateless JWT & RBAC</span>
                </div>
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-purple-400" />
                  <span>Multi-Method Authentication</span>
                </div>
              </div>
            </div>

            {/* Visual SaaS Mockup / Preview Card */}
            <div className="mt-14 relative mx-auto max-w-5xl rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-xs font-mono text-slate-400">campus-job.app / placement-ecosystem</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-md font-mono">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Production Ready
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span>Student Experience</span>
                    <GraduationCap className="h-4 w-4 text-indigo-400" />
                  </div>
                  <div className="text-base font-bold text-slate-100">Live Placement Feed</div>
                  <p className="text-xs text-slate-400 mt-1">Multi-filter job discovery, CGPA match criteria, and verified 1-click applications.</p>
                </div>

                <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span>Recruiter Workspace</span>
                    <Building2 className="h-4 w-4 text-purple-400" />
                  </div>
                  <div className="text-base font-bold text-slate-100">Candidate Pipeline</div>
                  <p className="text-xs text-slate-400 mt-1">Review submissions, evaluate protected PDF resumes, and progress candidate hiring stages.</p>
                </div>

                <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span>Admin Governance</span>
                    <BarChart3 className="h-4 w-4 text-pink-400" />
                  </div>
                  <div className="text-base font-bold text-slate-100">Placement Intelligence</div>
                  <p className="text-xs text-slate-400 mt-1">Institutional hiring statistics, partner company validation, user management, and audit logs.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. DEVELOPER INTRO (HI, I'M NILAY BHAMARE)                                */}
        {/* ========================================================================= */}
        <section id="about-developer" className="py-20 bg-slate-900/30 border-y border-slate-800/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="max-w-4xl mx-auto rounded-3xl border border-slate-800 bg-slate-900/60 p-8 sm:p-10 shadow-2xl backdrop-blur-xl">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                {/* Developer Portrait / Avatar Placeholder Card */}
                <div className="shrink-0 text-center">
                  <div className="relative inline-block">
                    <div 
                      className="grid h-32 w-32 sm:h-36 sm:w-36 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 p-1 shadow-xl shadow-indigo-500/20 overflow-hidden"
                      role="img"
                      aria-label="Developer portrait for Nilay Bhamare"
                    >
                      {!imgError ? (
                        <img
                          src="/images/nilay-profile.jpg"
                          alt="Nilay Bhamare"
                          className="h-full w-full rounded-[14px] object-cover bg-slate-950"
                          onError={() => setImgError(true)}
                        />
                      ) : (
                        <div className="h-full w-full rounded-[14px] bg-slate-950 flex flex-col items-center justify-center">
                          <span className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-tr from-indigo-400 to-purple-300 bg-clip-text text-transparent">
                            NB
                          </span>
                          <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-400 mt-1">Lead Dev</span>
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 rounded-full border border-slate-800 bg-slate-900 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400 shadow-md">
                      Active
                    </div>
                  </div>
                </div>

                {/* Developer Bio & Narrative */}
                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-50">Hi, I'm Nilay Bhamare.</h2>
                  </div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-4">
                    Full-Stack Developer & Project Lead
                  </div>

                  <p className="text-sm text-slate-300 leading-relaxed mb-4">
                    I build production-grade web applications with a strong focus on modern Java/Spring Boot backends, React frontends, and robust system security. I engineered Campus Job to address the real-world operational friction of college placement drives—designing a secure, layered architecture spanning relational database models to responsive, role-governed user interfaces.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-800/80 text-left">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-1.5 flex items-center gap-1.5">
                        <Code2 className="h-3.5 w-3.5" />
                        <span>Development Focus</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Clean layered architectures (Controller–Service–Repository), JPA Specifications, stateless JWT security, and responsive React interfaces.
                      </p>
                    </div>

                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-purple-400 mb-1.5 flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>Engineering Mindset</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Test-driven reliability (148 automated tests), defensive security posture, type safety, and reproducible containerized deployments.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. WHY I BUILT CAMPUS JOB (PERSONAL MOTIVATION)                            */}
        {/* ========================================================================= */}
        <section id="why-i-built-it" className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="max-w-3xl mx-auto text-center mb-14">
              <div className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-2">Project Motivation</div>
              <h2 className="text-3xl font-bold text-slate-50">Why I Built Campus Job</h2>
              <p className="mt-3 text-slate-400 text-sm sm:text-base leading-relaxed">
                I built Campus Job because traditional campus recruitment in colleges and universities is plagued by manual, fragmented workflows.
              </p>
            </div>

            <div className="max-w-4xl mx-auto rounded-3xl border border-slate-800 bg-slate-900/40 p-8 sm:p-10 mb-10">
              <div className="flex items-start gap-4 mb-6">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Terminal className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">Solving the Campus Recruitment Bottleneck</h3>
                  <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                    Placement cells traditionally manage drives through scattered spreadsheets, email chains, and paper forms. Students miss deadlines because notifications get buried, recruiters struggle to track candidates across multiple drives, and administrators lack a centralized view of placement metrics.
                  </p>
                  <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                    I engineered Campus Job as a production-grade full-stack solution to replace these manual processes with a unified, role-governed web application where every interaction is fast, secure, and verifiable.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-800/80">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-1" />
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Ending Fragmented Spreadsheets</div>
                    <div className="text-xs text-slate-400 mt-0.5">Unified web database replacing unorganized sheets and scattered email chains.</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-1" />
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Zero Missed Deadlines</div>
                    <div className="text-xs text-slate-400 mt-0.5">Real-time drive visibility with deadline filtering and 1-click submissions.</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-1" />
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Recruiter Pipeline Desk</div>
                    <div className="text-xs text-slate-400 mt-0.5">Streamlined candidate review with status progression and verified PDF resumes.</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-1" />
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Administrative Governance</div>
                    <div className="text-xs text-slate-400 mt-0.5">Placement KPI analytics, company validation, and complete system audit trails.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. WHAT I ENGINEERED (4 ENGINEERING PILLARS)                              */}
        {/* ========================================================================= */}
        <section id="what-i-engineered" className="py-20 bg-slate-900/20 border-t border-slate-800/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <div className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-2">Technical Implementation</div>
              <h2 className="text-3xl font-bold text-slate-50">What I Engineered</h2>
              <p className="mt-3 text-slate-400 text-sm sm:text-base">
                A structured overview of the four core technical pillars implemented across the full application lifecycle.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Pillar 1: Frontend Engineering */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-4">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                    <Layers className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-100">Frontend Engineering</h3>
                    <p className="text-xs text-slate-400">React 18 · Vite · Tailwind CSS · React Router 6</p>
                  </div>
                </div>

                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">•</span>
                    <span>Role-aware client routing guards (<code className="text-indigo-300">RequireAuth</code>, <code className="text-indigo-300">RequireRole</code>, and <code className="text-indigo-300">PublicOnlyRoute</code>)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">•</span>
                    <span>Global authentication context with custom unauthorized event interceptors</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">•</span>
                    <span>Dedicated Student, Recruiter, and Admin dashboards with live KPI metric cards</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">•</span>
                    <span>Dynamic multi-field job filter sidebar with salary sliders and search queries</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">•</span>
                    <span>Responsive mobile drawer navigation and code-split lazy routes for instant first-paint</span>
                  </li>
                </ul>
              </div>

              {/* Pillar 2: Backend Engineering */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-4">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
                    <Server className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-100">Backend Engineering</h3>
                    <p className="text-xs text-slate-400">Java 17 · Spring Boot 3.2.5 · Spring Security 6</p>
                  </div>
                </div>

                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 font-bold">•</span>
                    <span>Controller–Service–Repository layered architecture with decoupled DTO mappers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 font-bold">•</span>
                    <span>Stateless JWT filter chain and method-level <code className="text-purple-300">@PreAuthorize</code> RBAC</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 font-bold">•</span>
                    <span>Recruiter tenant ownership isolation preventing cross-company tampering</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 font-bold">•</span>
                    <span>Student application lifecycle (duplicate prevention and ownership-safe withdrawal)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 font-bold">•</span>
                    <span>Firebase OAuth verification and SHA-256 mobile OTP token issuance</span>
                  </li>
                </ul>
              </div>

              {/* Pillar 3: Security Engineering */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-4">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-100">Security Engineering</h3>
                    <p className="text-xs text-slate-400">BCrypt · JWT · Path Traversal Guard · Rate Limiting</p>
                  </div>
                </div>

                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>BCrypt salted password hashing with write-only serialization to prevent leaks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>Custom <code className="text-emerald-300">AuthenticationEntryPoint</code> returning standard 401 JSON</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>Protected resume controller streaming with static <code className="text-emerald-300">/uploads/** denyAll</code></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>Path traversal sanitization with strict filename normalization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>Single-use password reset tokens and 60-second OTP request rate limits</span>
                  </li>
                </ul>
              </div>

              {/* Pillar 4: Data & Performance */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-4">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-pink-500/15 text-pink-400 border border-pink-500/30">
                    <Database className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-100">Data & Performance</h3>
                    <p className="text-xs text-slate-400">MySQL 8 · Spring Data JPA · Hibernate · HikariCP</p>
                  </div>
                </div>

                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-pink-400 font-bold">•</span>
                    <span>Relational schema design with foreign key constraints and cascade rules</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-pink-400 font-bold">•</span>
                    <span>Dynamic search queries using type-safe JPA Specifications</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-pink-400 font-bold">•</span>
                    <span>Server-side pagination and safe sorting with column whitelisting</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-pink-400 font-bold">•</span>
                    <span>Optimized aggregation queries eliminating N+1 database roundtrips</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-pink-400 font-bold">•</span>
                    <span>Lazy relationship fetching avoiding unwanted query overhead</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. SYSTEM ARCHITECTURE VISUAL                                             */}
        {/* ========================================================================= */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <div className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-2">System Design</div>
              <h2 className="text-3xl font-bold text-slate-50">System Architecture</h2>
              <p className="mt-3 text-slate-400 text-sm sm:text-base">
                A clean, decoupled 3-tier architecture with unified token-based authentication.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Application Tier Flow */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 mb-4 flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Application Layer Stack
                  </h3>
                  <div className="space-y-2.5 font-mono text-xs">
                    <div className="p-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-200 flex items-center justify-between">
                      <span className="font-semibold">React 18</span>
                      <span className="text-[11px] text-indigo-300/70 font-sans">Single Page App (Vite UI)</span>
                    </div>

                    <div className="flex justify-center text-slate-500 text-xs">
                      ↓ Axios / REST API
                    </div>

                    <div className="p-3 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-200 flex items-center justify-between">
                      <span className="font-semibold">Spring Boot</span>
                      <span className="text-[11px] text-purple-300/70 font-sans">REST Controllers & DTOs</span>
                    </div>

                    <div className="flex justify-center text-slate-500 text-xs">
                      ↓ SecurityFilterChain
                    </div>

                    <div className="p-3 rounded-xl border border-pink-500/30 bg-pink-500/10 text-pink-200 flex items-center justify-between">
                      <span className="font-semibold">Spring Security / JWT</span>
                      <span className="text-[11px] text-pink-300/70 font-sans">Stateless Request Context</span>
                    </div>

                    <div className="flex justify-center text-slate-500 text-xs">
                      ↓ JPA Specifications & Repositories
                    </div>

                    <div className="p-3 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-200 flex items-center justify-between">
                      <span className="font-semibold">JPA / Hibernate</span>
                      <span className="text-[11px] text-blue-300/70 font-sans">ORM & Query Optimization</span>
                    </div>

                    <div className="flex justify-center text-slate-500 text-xs">
                      ↓ Connection Pool (HikariCP)
                    </div>

                    <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 flex items-center justify-between">
                      <span className="font-semibold">MySQL 8</span>
                      <span className="text-[11px] text-emerald-300/70 font-sans">Relational Persistence</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Authentication Convergence Flow */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400 mb-4 flex items-center gap-2">
                    <KeyRound className="h-4 w-4" />
                    Auth Convergence Model
                  </h3>
                  <div className="space-y-3 font-mono text-xs">
                    {/* Three Auth Methods */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300">
                        <div className="font-semibold">Email/Password</div>
                        <div className="text-[10px] text-slate-500 font-sans mt-0.5">BCrypt Hashed</div>
                      </div>
                      <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300">
                        <div className="font-semibold">Google/Firebase</div>
                        <div className="text-[10px] text-slate-500 font-sans mt-0.5">OAuth Token</div>
                      </div>
                      <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300">
                        <div className="font-semibold">Mobile OTP</div>
                        <div className="text-[10px] text-slate-500 font-sans mt-0.5">SHA-256 Hashed</div>
                      </div>
                    </div>

                    <div className="flex justify-center text-slate-500 text-xs">
                      ↓ Token Exchange & Verification
                    </div>

                    {/* Campus Job JWT */}
                    <div className="p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-500/15 text-indigo-200 text-center">
                      <div className="font-bold text-sm">Campus Job JWT</div>
                      <div className="text-[11px] text-indigo-300/80 font-sans mt-0.5">Stateless HMAC-SHA256 · 24h Expiry · Claims: email, role, userId</div>
                    </div>

                    <div className="flex justify-center text-slate-500 text-xs">
                      ↓ Role-Based Authorization
                    </div>

                    {/* RBAC Engine */}
                    <div className="p-3 rounded-xl border border-purple-500/30 bg-purple-500/15 text-purple-200 text-center">
                      <div className="font-bold">RBAC Engine</div>
                      <div className="text-[11px] text-purple-300/80 font-sans mt-0.5">Method-Level @PreAuthorize & URL Matchers</div>
                    </div>

                    <div className="flex justify-center text-slate-500 text-xs">
                      ↓ Role-Specific Dashboards
                    </div>

                    {/* Portals */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2 rounded-lg border border-indigo-500/30 bg-indigo-950/40 text-center text-indigo-300 font-bold">
                        STUDENT
                      </div>
                      <div className="p-2 rounded-lg border border-purple-500/30 bg-purple-950/40 text-center text-purple-300 font-bold">
                        RECRUITER
                      </div>
                      <div className="p-2 rounded-lg border border-pink-500/30 bg-pink-950/40 text-center text-pink-300 font-bold">
                        ADMIN
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. ENGINEERING CHALLENGES I SOLVED                                        */}
        {/* ========================================================================= */}
        <section id="engineering-challenges" className="py-20 bg-slate-900/20 border-t border-slate-800/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <div className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-2">Defensive Engineering</div>
              <h2 className="text-3xl font-bold text-slate-50">Engineering Challenges I Solved</h2>
              <p className="mt-3 text-slate-400 text-sm sm:text-base">
                Real-world architectural, performance, and security problems resolved during platform engineering.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {/* Challenge 1: N+1 Query Elimination */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
                <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 mb-2">
                  <Activity className="h-4 w-4" />
                  <span>Performance Optimization</span>
                </div>
                <h3 className="text-base font-bold text-slate-100 mb-2">N+1 Query Elimination in Company Analytics</h3>
                <div className="space-y-1.5 text-xs sm:text-sm text-slate-400 leading-relaxed">
                  <p><strong className="text-slate-300">Problem:</strong> Loading company listings executed an iterative job count query for each row (<code className="text-indigo-300">O(N)</code> database roundtrips).</p>
                  <p><strong className="text-slate-300">Engineering Solution:</strong> Engineered a single grouped JPQL aggregation query (<code className="text-indigo-300">SELECT j.company.id, COUNT(j) FROM Job j GROUP BY j.company.id</code>) with an in-memory map lookup.</p>
                  <p><strong className="text-slate-300">Outcome:</strong> Reduced database roundtrips from <code className="text-indigo-300">O(N)</code> to <code className="text-indigo-300">O(1)</code>, ensuring constant-time rendering on company management dashboards.</p>
                </div>
              </div>

              {/* Challenge 2: Multi-Method Auth Convergence */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
                <div className="flex items-center gap-2 text-xs font-mono text-purple-400 mb-2">
                  <KeyRound className="h-4 w-4" />
                  <span>Authentication Convergence</span>
                </div>
                <h3 className="text-base font-bold text-slate-100 mb-2">Unified Multi-Method Auth Integration</h3>
                <div className="space-y-1.5 text-xs sm:text-sm text-slate-400 leading-relaxed">
                  <p><strong className="text-slate-300">Problem:</strong> Integrating Email/Password, Firebase Google OAuth, and Mobile OTP without fragmenting the session or authorization model.</p>
                  <p><strong className="text-slate-300">Engineering Solution:</strong> Designed an auth pipeline where verified Firebase tokens and OTP codes exchange directly for stateless Campus Job JWTs carrying identical user claims.</p>
                  <p><strong className="text-slate-300">Outcome:</strong> Unified 3 distinct sign-in mechanisms into a single Spring Security principal and RBAC context without session drift.</p>
                </div>
              </div>

              {/* Challenge 3: Path Traversal & Resume Security */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 mb-2">
                  <Lock className="h-4 w-4" />
                  <span>Access Control & File Security</span>
                </div>
                <h3 className="text-base font-bold text-slate-100 mb-2">Protected Resume Access & Traversal Defense</h3>
                <div className="space-y-1.5 text-xs sm:text-sm text-slate-400 leading-relaxed">
                  <p><strong className="text-slate-300">Problem:</strong> Direct static file directories expose candidate resumes to unauthenticated enumeration and path traversal vectors.</p>
                  <p><strong className="text-slate-300">Engineering Solution:</strong> Enforced Spring Security <code className="text-emerald-300">/uploads/** denyAll</code>, routed resume requests through authorized controller streaming, and sanitized file paths with <code className="text-emerald-300">Path.normalize()</code>.</p>
                  <p><strong className="text-slate-300">Outcome:</strong> Eliminated static file exposure while guaranteeing that only authorized recruiters and owners can access PDF resumes.</p>
                </div>
              </div>

              {/* Challenge 4: Expired Job Discovery Filtering */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
                <div className="flex items-center gap-2 text-xs font-mono text-pink-400 mb-2">
                  <GitBranch className="h-4 w-4" />
                  <span>JPA Specification Queries</span>
                </div>
                <h3 className="text-base font-bold text-slate-100 mb-2">Dynamic Multi-Field Search & Deadline Filters</h3>
                <div className="space-y-1.5 text-xs sm:text-sm text-slate-400 leading-relaxed">
                  <p><strong className="text-slate-300">Problem:</strong> Expired job postings remained visible to students when filtering strictly by status = ACTIVE.</p>
                  <p><strong className="text-slate-300">Engineering Solution:</strong> Extended JPA Specifications to dynamically chain <code className="text-pink-300">(deadline IS NULL OR deadline &gt;= CURRENT_TIMESTAMP)</code> for student feeds while preserving recruiter management views.</p>
                  <p><strong className="text-slate-300">Outcome:</strong> Prevented student applications to expired drives while maintaining full historical management records for recruiters.</p>
                </div>
              </div>

              {/* Challenge 5: Duplicate Application & IDOR Guard */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
                <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-2">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Data Integrity & IDOR Guard</span>
                </div>
                <h3 className="text-base font-bold text-slate-100 mb-2">Duplicate Prevention & Ownership-Safe Withdrawal</h3>
                <div className="space-y-1.5 text-xs sm:text-sm text-slate-400 leading-relaxed">
                  <p><strong className="text-slate-300">Problem:</strong> Concurrent clicks could trigger duplicate applications, and parameter tampering could delete other students' applications.</p>
                  <p><strong className="text-slate-300">Engineering Solution:</strong> Enforced composite database uniqueness constraints and server-side owner-matching validation on application withdrawals.</p>
                  <p><strong className="text-slate-300">Outcome:</strong> Guaranteed application uniqueness and prevented unauthorized cross-student data modification.</p>
                </div>
              </div>

              {/* Challenge 6: Password Hash Exposure Guard */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
                <div className="flex items-center gap-2 text-xs font-mono text-blue-400 mb-2">
                  <FileCheck className="h-4 w-4" />
                  <span>Sensitive Data Protection</span>
                </div>
                <h3 className="text-base font-bold text-slate-100 mb-2">Password Serialization Guard</h3>
                <div className="space-y-1.5 text-xs sm:text-sm text-slate-400 leading-relaxed">
                  <p><strong className="text-slate-300">Problem:</strong> Entity-to-JSON serialization risks leaking BCrypt password hashes in user API responses.</p>
                  <p><strong className="text-slate-300">Engineering Solution:</strong> Enforced DTO mapping layers across all endpoints and annotated <code className="text-blue-300">User.password</code> with Jackson <code className="text-blue-300">@JsonProperty(WRITE_ONLY)</code>.</p>
                  <p><strong className="text-slate-300">Outcome:</strong> Permanently prevented password hash leakage in REST responses across all authentication and profile endpoints.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 7. AUTHENTICATION (3 METHODS, 1 AUTHORIZATION MODEL)                      */}
        {/* ========================================================================= */}
        <section id="auth-model" className="py-20 border-t border-slate-800/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <div className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-2">Authentication Architecture</div>
              <h2 className="text-3xl font-bold text-slate-50">Three Authentication Methods, One Authorization Model</h2>
              <p className="mt-3 text-slate-400 text-sm sm:text-base">
                All sign-in modes converge seamlessly onto the same stateless Campus Job JWT and Spring Security RBAC authorization context.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 mb-4">
                  <Mail className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-100 mb-2">Email & Password</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Standard credential authentication backed by BCrypt cryptographic hashing, strict input validation, and single-use password reset tokens.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 mb-4">
                  <UserCheck className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-100 mb-2">Google Authentication</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  One-click Google Sign-In powered by Firebase OAuth integration, securely exchanging verified Firebase tokens for stateless Campus Job JWTs.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-pink-500/15 border border-pink-500/30 text-pink-400 mb-4">
                  <Smartphone className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-100 mb-2">Mobile Phone + OTP</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Passwordless phone authentication with SHA-256 OTP hashing, 60-second rate limiting cooldowns, and seamless token issuance.
                </p>
              </div>
            </div>

            <div className="mt-10 text-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] hover:from-indigo-400 hover:to-violet-500"
              >
                Create Your Account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 8. SECURITY (SECURITY WASN'T AN AFTERTHOUGHT)                             */}
        {/* ========================================================================= */}
        <section id="security-architecture" className="py-20 bg-slate-900/30 border-y border-slate-800/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2">Defensive Engineering</div>
              <h2 className="text-3xl font-bold text-slate-50">Security Wasn't an Afterthought</h2>
              <p className="mt-3 text-slate-400 text-sm sm:text-base">
                Architected with rigorous security controls across authentication, authorization, and data persistence layers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4">
                  <KeyRound className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-100 mb-2">Stateless JWT Auth</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  HMAC-SHA token signing with 24-hour expiration, stateless request validation, and custom 401 unauthenticated JSON entry points.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-4">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-100 mb-2">Granular RBAC</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Enforced via URL security matchers and method-level <code className="text-indigo-300">@PreAuthorize</code> annotations across all Spring controllers.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 mb-4">
                  <Lock className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-100 mb-2">BCrypt Password Hashing</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Industry-standard salt generation and cryptographic password hashing preventing plaintext credential exposure.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 mb-4">
                  <FileCheck className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-100 mb-2">Protected Resume Access</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Direct static file serving is disabled (<code className="text-pink-300">/uploads/** denyAll</code>); resumes are served strictly via authorized controller endpoints.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-4">
                  <FileText className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-100 mb-2">Strict PDF Validation</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Multi-tier resume validation enforcing genuine PDF MIME types, magic-byte inspection, filename sanitization, and 5MB size limits.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-4">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-100 mb-2">Anti-Enumeration & Rate Limiting</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Uniform response timing on password resets, 60s cooldown timers for OTP requests, and disabled database error leaks in production.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 9. VERIFIED ENGINEERING METRICS                                           */}
        {/* ========================================================================= */}
        <section className="py-12 border-b border-slate-800/80 bg-slate-900/20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="p-4 rounded-xl border border-slate-800/60 bg-slate-950/40">
                <div className="text-3xl font-extrabold text-indigo-400">148</div>
                <div className="text-xs sm:text-sm font-medium text-slate-300 mt-1">Automated Backend Tests</div>
                <div className="text-[11px] text-slate-500 mt-0.5">JUnit 5 + Mockito (100% Green)</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-800/60 bg-slate-950/40">
                <div className="text-3xl font-extrabold text-purple-400">3 Roles</div>
                <div className="text-xs sm:text-sm font-medium text-slate-300 mt-1">Granular RBAC Portals</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Student, Recruiter & Admin</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-800/60 bg-slate-950/40">
                <div className="text-3xl font-extrabold text-pink-400">3 Modes</div>
                <div className="text-xs sm:text-sm font-medium text-slate-300 mt-1">Authentication Modes</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Password, Google & Mobile OTP</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-800/60 bg-slate-950/40">
                <div className="text-3xl font-extrabold text-emerald-400">22 Routes</div>
                <div className="text-xs sm:text-sm font-medium text-slate-300 mt-1">Frontend Application Pages</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Clean Production Bundle</div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 10. EXPLORE CAMPUS JOB (ROLE EXPERIENCES)                                 */}
        {/* ========================================================================= */}
        <section id="explore-roles" className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <div className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-2">Live Experiences</div>
              <h2 className="text-3xl font-bold text-slate-50">Explore Campus Job</h2>
              <p className="mt-3 text-slate-400 text-sm sm:text-base">
                Discover the three tailored experiences engineered for every campus recruitment participant.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-2">
                    <GraduationCap className="h-4 w-4" />
                    <span>Student Experience</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-100 mb-2">Find Opportunities</h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
                    Filter placement drives, upload validated PDF resumes, and track live application status updates in real time.
                  </p>
                </div>
                <Link
                  to="/jobs"
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 px-4 py-2.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-600/30 transition-colors"
                >
                  <span>Explore Student Features</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 text-purple-400 font-bold text-xs uppercase tracking-wider mb-2">
                    <Building2 className="h-4 w-4" />
                    <span>Recruiter Experience</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-100 mb-2">Manage Candidates</h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
                    Post openings, evaluate applicant submissions, stream protected PDF resumes, and update recruitment decisions.
                  </p>
                </div>
                <Link
                  to="/login"
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-purple-600/20 border border-purple-500/30 px-4 py-2.5 text-xs font-semibold text-purple-300 hover:bg-purple-600/30 transition-colors"
                >
                  <span>Recruiter Sign In</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 text-pink-400 font-bold text-xs uppercase tracking-wider mb-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>Admin Experience</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-100 mb-2">Placement Intelligence</h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
                    Monitor institutional hiring statistics, verify visiting partners, manage user accounts, and review audit logs.
                  </p>
                </div>
                <Link
                  to="/login"
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-pink-600/20 border border-pink-500/30 px-4 py-2.5 text-xs font-semibold text-pink-300 hover:bg-pink-600/30 transition-colors"
                >
                  <span>Admin Sign In</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 11. BUILT WITH (TECH STACK)                                               */}
        {/* ========================================================================= */}
        <section id="tech-stack" className="py-20 bg-slate-900/20 border-t border-slate-800/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <div className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-2">Repository Stack</div>
              <h2 className="text-3xl font-bold text-slate-50">Built With</h2>
              <p className="mt-3 text-slate-400 text-sm sm:text-base">
                Engineered with industry-standard, production-proven frameworks and tools across every layer.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm mb-3">
                  <Layers className="h-4 w-4" />
                  <span>Frontend</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['React 18', 'Vite 5', 'Tailwind CSS', 'Axios', 'React Router 6', 'Lucide Icons', 'Recharts'].map((tech) => (
                    <span key={tech} className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-slate-300">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm mb-3">
                  <Server className="h-4 w-4" />
                  <span>Backend</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Java 17', 'Spring Boot 3.2.5', 'Spring Security 6', 'Spring Data JPA', 'Hibernate', 'Jakarta Validation', 'Swagger OpenAPI'].map((tech) => (
                    <span key={tech} className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-slate-300">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                <div className="flex items-center gap-2 text-pink-400 font-semibold text-sm mb-3">
                  <Database className="h-4 w-4" />
                  <span>Database & Persistence</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['MySQL 8', 'HikariCP Pool', 'Stateless JWT (JJWT)', 'Firebase Client SDK', 'SHA-256 OTP', 'BCrypt'].map((tech) => (
                    <span key={tech} className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-slate-300">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-3">
                  <Cpu className="h-4 w-4" />
                  <span>Testing & Quality</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['JUnit 5', 'Mockito', 'Spring Security Test', 'H2 Database', '148 Unit/Integration Tests'].map((tech) => (
                    <span key={tech} className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-slate-300">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm mb-3">
                  <Zap className="h-4 w-4" />
                  <span>DevOps & Deployment</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Docker', 'Docker Compose', 'Multi-Stage Build', 'Nginx Reverse Proxy', 'Maven'].map((tech) => (
                    <span key={tech} className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-slate-300">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm mb-3">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Security & Auth</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Stateless JWT', 'RBAC Matchers', 'Protected File Access', 'Path Traversal Defense', 'Write-Only Password'].map((tech) => (
                    <span key={tech} className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-slate-300">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 12. FINAL CALL TO ACTION                                                  */}
        {/* ========================================================================= */}
        <section className="relative py-20 overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-indigo-950/20 to-slate-950" />
          <div className="relative mx-auto max-w-5xl px-4 sm:px-6 text-center">
            <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-b from-slate-900/90 to-slate-950 p-10 sm:p-14 shadow-2xl backdrop-blur-xl">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-50 tracking-tight">
                Ready to build your next opportunity?
              </h2>
              <p className="mt-4 text-slate-300 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
                Join students and hiring partners on Campus Job. Experience a streamlined, secure, and data-driven recruitment platform.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link
                  to="/jobs"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] hover:from-indigo-400 hover:to-violet-500"
                >
                  <Search className="h-4 w-4" />
                  Explore Jobs
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-6 py-3.5 text-sm font-semibold text-slate-200 shadow-md transition-all hover:bg-slate-800 hover:text-white"
                >
                  <Users className="h-4 w-4 text-indigo-400" />
                  Create Account
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ========================================================================= */}
      {/* 13. FOOTER                                                                */}
      {/* ========================================================================= */}
      <footer className="border-t border-slate-800 bg-slate-950 py-12 text-slate-400 text-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand column */}
            <div className="md:col-span-2">
              <Link to="/" className="flex items-center gap-2 text-slate-50 mb-3">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/20">
                  <Briefcase className="h-4 w-4 text-white" />
                </span>
                <span className="text-base font-bold tracking-tight">
                  Campus <span className="text-indigo-400">Job</span>
                </span>
              </Link>
              <p className="text-slate-400 max-w-sm leading-relaxed">
                Built by Nilay Bhamare as a full-stack campus recruitment platform connecting students, recruiters, and placement officers.
              </p>
              <div className="mt-4 text-[11px] text-slate-500">
                Spring Boot 3 · React 18 · MySQL 8 · Layered Architecture · 148 Automated Tests
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">Platform</div>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="hover:text-indigo-400 transition-colors">Home</Link>
                </li>
                <li>
                  <Link to="/jobs" className="hover:text-indigo-400 transition-colors">Browse Jobs</Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-indigo-400 transition-colors">Sign In</Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-indigo-400 transition-colors">Register</Link>
                </li>
              </ul>
            </div>

            {/* Project Details */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">Project & Engineering</div>
              <ul className="space-y-2">
                <li className="text-slate-400">
                  <span>Project Lead: </span>
                  <span className="text-slate-200 font-medium">Nilay Bhamare</span>
                </li>
                <li className="text-slate-400">
                  <span>Architecture: </span>
                  <span className="text-slate-300">Layered REST (3-Tier)</span>
                </li>
                <li className="text-slate-400">
                  <span>Security: </span>
                  <span className="text-slate-300">Stateless JWT + RBAC</span>
                </li>
                <li className="text-slate-400">
                  <span>License: </span>
                  <span className="text-slate-300">MIT Open Source</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div>
              © {new Date().getFullYear()} Campus Job. All rights reserved.
            </div>
            <div>
              Built by <span className="text-slate-300 font-medium">Nilay Bhamare</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
