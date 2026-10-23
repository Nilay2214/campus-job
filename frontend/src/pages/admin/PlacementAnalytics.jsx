import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from 'recharts';
import { toast } from 'react-toastify';
import { BarChart3, TrendingUp } from 'lucide-react';
import adminService from '../../services/adminService';
import StatCard from '../../components/ui/StatCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import Button from '../../components/ui/Button';

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

const monthLabel = (m) => {
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return names[(m || 1) - 1] || String(m);
};

const PlacementAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getAdminAnalytics();
      setData(res);
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Failed to load analytics';
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
        <Skeleton className="mb-6 h-8 w-64" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-900 bg-red-950/40 p-8 text-center">
        <h2 className="text-lg font-semibold text-red-100">Error loading analytics</h2>
        <p className="mt-2 text-sm text-red-200">{error}</p>
        <Button variant="danger" className="mt-4" onClick={load}>
          Retry
        </Button>
      </div>
    );
  }

  const applicationsByStatus = data?.applicationsByStatus || {};
  const statusData = Object.entries(applicationsByStatus).map(([name, value]) => ({ name, value }));

  const applicationsByMonth = (data?.applicationsByMonth || []).map((m) => ({
    name: `${m.year}-${monthLabel(m.month)}`,
    applications: m.count,
  }));
  const placementsByMonth = (data?.placementsByMonth || []).map((m) => ({
    name: `${m.year}-${monthLabel(m.month)}`,
    placements: m.count,
  }));
  const userGrowth = (data?.userGrowth || []).map((m) => ({
    name: `${m.year}-${monthLabel(m.month)}`,
    users: m.count,
  }));
  const topCompanies = data?.topCompanies || [];
  const jobsByType = data?.jobsByType || {};
  const jobsTypeData = Object.entries(jobsByType).map(([name, value]) => ({ name, value }));

  const mergedMonthly = [...applicationsByMonth, ...placementsByMonth, ...userGrowth];
  const monthKeys = [...new Set(mergedMonthly.map((d) => d.name))].slice(0, 12);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Placement Analytics</h1>
        <p className="mt-1 text-slate-400">Platform-wide placement insights.</p>
      </header>

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Applications by Status" value={Object.keys(statusData).length} sub="status categories" />
        <StatCard title="Top Companies" value={topCompanies.length} sub="highest hiring" />
        <StatCard title="Job Types" value={Object.keys(jobsTypeData).length} sub="employment modes" />
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-300" />
              Applications by Month
            </CardTitle>
            <CardDescription>Monthly application volume</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={applicationsByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
                <Bar dataKey="applications" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-300" />
              Placements by Month
            </CardTitle>
            <CardDescription>Monthly placement trends</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={placementsByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
                <Bar dataKey="placements" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Applications by Status</CardTitle>
            <CardDescription>Distribution across statuses</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {statusData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Hiring Companies</CardTitle>
            <CardDescription>Companies with most job postings and applications</CardDescription>
          </CardHeader>
          <CardContent>
            {topCompanies.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-sm text-slate-500">No data</div>
            ) : (
              <div className="space-y-3">
                {topCompanies.map((c, index) => (
                  <div
                    key={c.companyId || `${c.companyName}-${index}`}
                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3"
                  >
                    <div className="font-medium text-slate-100">{c.companyName}</div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-slate-400">
                        <span className="font-semibold text-indigo-300">{c.jobCount}</span> jobs
                      </span>
                      <span className="text-slate-400">
                        <span className="font-semibold text-emerald-300">{c.applicationCount}</span> apps
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default React.memo(PlacementAnalytics);
