import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Building2,
  Briefcase,
  FileText,
  GraduationCap,
  UserCheck,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'react-toastify';
import adminService from '../../services/adminService';
import StatCard from '../../components/ui/StatCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminService.getDashboardStats();
      setStats(data);
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Failed to load admin dashboard';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-80" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-900 bg-red-950/40 p-8 text-center">
        <h2 className="text-lg font-semibold text-red-100">Error loading dashboard</h2>
        <p className="mt-2 text-sm text-red-200">{error}</p>
        <button
          type="button"
          onClick={load}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
        >
          Retry
        </button>
      </div>
    );
  }

  const cards = [
    { title: 'Total Students', value: stats?.totalStudents ?? 0, icon: <GraduationCap className="h-5 w-5 text-indigo-300" /> },
    { title: 'Total Recruiters', value: stats?.totalRecruiters ?? 0, icon: <UserCheck className="h-5 w-5 text-violet-300" /> },
    { title: 'Total Admins', value: stats?.totalAdmins ?? 0, icon: <Shield className="h-5 w-5 text-sky-300" /> },
    { title: 'Total Companies', value: stats?.totalCompanies ?? 0, icon: <Building2 className="h-5 w-5 text-emerald-300" /> },
    { title: 'Total Jobs', value: stats?.totalJobs ?? 0, icon: <Briefcase className="h-5 w-5 text-amber-300" /> },
    { title: 'Applications', value: stats?.totalApplications ?? 0, icon: <FileText className="h-5 w-5 text-rose-300" /> },
  ];

  const actions = [
    { to: '/admin/users', label: 'Manage Users', icon: Users },
    { to: '/admin/companies', label: 'Manage Companies', icon: Building2 },
    { to: '/admin/analytics', label: 'Analytics', icon: Briefcase },
    { to: '/admin/reports', label: 'Reports', icon: FileText },
  ];

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Admin Dashboard</h1>
        <p className="mt-1 text-slate-400">Platform overview and operational insights.</p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => (
          <StatCard key={c.title} title={c.title} value={c.value} icon={c.icon} />
        ))}
      </section>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Navigate to key admin management areas.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {actions.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="group flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-indigo-500/50 hover:bg-indigo-500/5"
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-indigo-300" />
                  {label}
                </span>
                <ArrowRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-indigo-300" />
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default React.memo(AdminDashboard);
