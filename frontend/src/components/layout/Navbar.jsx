import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  User,
  Building2,
  Users,
  BarChart3,
  ClipboardList,
  FileBarChart,
  History,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';

/**
 * Role-aware Navbar + mobile drawer.
 * Renders role-specific navigation links and a logout action.
 */
const Navbar = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { role, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setOpen(false);
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const close = () => setOpen(false);

  const guestLinks = [
    { to: '/', label: 'Home', icon: LayoutDashboard },
    { to: '/jobs', label: 'Browse Jobs', icon: Briefcase },
  ];

  const studentLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/jobs', label: 'Browse Jobs', icon: Briefcase },
    { to: '/applications', label: 'My Applications', icon: FileText },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  const recruiterLinks = [
    { to: '/recruiter/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/recruiter/jobs', label: 'Manage Jobs', icon: Briefcase },
    { to: '/recruiter/jobs/new', label: 'Post Job', icon: FileBarChart },
    { to: '/recruiter/applications', label: 'Applications', icon: FileText },
    { to: '/recruiter/profile', label: 'Company Profile', icon: Building2 },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Manage Users', icon: Users },
    { to: '/admin/companies', label: 'Manage Companies', icon: Building2 },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/admin/reports', label: 'Reports', icon: FileBarChart },
    { to: '/admin/audit-logs', label: 'Audit Logs', icon: History },
  ];

  let links = [];
  if (role === 'STUDENT') links = studentLinks;
  else if (role === 'RECRUITER') links = recruiterLinks;
  else if (role === 'ADMIN') links = adminLinks;
  else links = guestLinks;

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-indigo-500/15 text-indigo-200'
        : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
    }`;

  const renderLinks = () =>
    links.map(({ to, label, icon: Icon }) => (
      <NavLink key={to} to={to} className={linkClass} onClick={close}>
        <Icon className="w-4 h-4" />
        <span>{label}</span>
      </NavLink>
    ));

  const brandHome =
    role === 'RECRUITER'
      ? '/recruiter/dashboard'
      : role === 'ADMIN'
      ? '/admin/dashboard'
      : role === 'STUDENT'
      ? '/dashboard'
      : '/';

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Brand */}
            <Link to={brandHome} className="flex items-center gap-2 text-slate-50" onClick={close}>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/20">
                <Briefcase className="h-5 w-5 text-white" />
              </span>
              <span className="text-lg font-bold tracking-tight">
                Campus <span className="text-indigo-400">Job</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden items-center gap-1 md:flex">{renderLinks()}</nav>

            {/* Right side: role badge + logout OR Sign In + Get Started */}
            <div className="hidden items-center gap-3 md:flex">
              {role ? (
                <>
                  <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-300">
                    {role}
                  </span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-red-500/15 hover:text-red-200"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-slate-100"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition-all hover:from-indigo-400 hover:to-violet-500"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile toggle */}
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg p-2 text-slate-300 hover:bg-slate-800 md:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle navigation menu"
            >
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={close} />
          <div className="absolute right-0 top-0 h-full w-72 border-l border-slate-800 bg-slate-950 p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                {role ?? 'Guest'}
              </span>
              <button
                type="button"
                onClick={close}
                className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1">{renderLinks()}</nav>
            {role ? (
              <button
                type="button"
                onClick={handleLogout}
                className="mt-4 flex w-full items-center justify-between rounded-lg bg-red-500/10 px-3 py-2.5 text-sm font-medium text-red-200 hover:bg-red-500/20"
              >
                <span className="flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  Logout
                </span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <div className="mt-4 flex flex-col gap-2 border-t border-slate-800 pt-4">
                <Link
                  to="/login"
                  onClick={close}
                  className="flex w-full items-center justify-center rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={close}
                  className="flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 px-3 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/20"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
