import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Building2, Search } from 'lucide-react';
import adminService from '../../services/adminService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import Button from '../../components/ui/Button';

const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const ManageCompanies = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminService.getAdminCompanies();
      setCompanies(Array.isArray(data) ? data : []);
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Failed to load companies';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter(
      (c) =>
        String(c.name ?? '').toLowerCase().includes(q) ||
        String(c.industry ?? '').toLowerCase().includes(q) ||
        String(c.location ?? '').toLowerCase().includes(q)
    );
  }, [companies, search]);

  if (loading) {
    return (
      <div>
        <Skeleton className="mb-6 h-8 w-64" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-900 bg-red-950/40 p-8 text-center">
        <h2 className="text-lg font-semibold text-red-100">Error loading companies</h2>
        <p className="mt-2 text-sm text-red-200">{error}</p>
        <Button variant="danger" className="mt-4" onClick={load}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Manage Companies</h1>
        <p className="mt-1 text-slate-400">All registered recruiting companies.</p>
      </header>

      <Card className="mb-5">
        <CardContent>
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, industry, or location..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950/60 py-2 pl-10 pr-3 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-300" />
            Companies ({filtered.length})
          </CardTitle>
          <CardDescription>Total registered companies: {companies.length}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Building2 className="h-10 w-10 text-slate-600" />
              <p className="mt-3 text-sm text-slate-400">No companies found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-sm text-slate-400">
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Industry</th>
                    <th className="px-5 py-3">Location</th>
                    <th className="px-5 py-3">Website</th>
                    <th className="px-5 py-3">Recruiter</th>
                    <th className="px-5 py-3">Jobs</th>
                    <th className="px-5 py-3">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} className="border-b border-slate-800/60 last:border-0">
                      <td className="px-5 py-3 font-medium text-slate-100">{c.name}</td>
                      <td className="px-5 py-3 text-slate-300">{c.industry || '—'}</td>
                      <td className="px-5 py-3 text-slate-300">{c.location || '—'}</td>
                      <td className="px-5 py-3">
                        {c.website ? (
                          <a
                            href={c.website}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-300 hover:text-indigo-200"
                          >
                            Visit
                          </a>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-300">{c.recruiterEmail || '—'}</td>
                      <td className="px-5 py-3">
                        <Badge variant="indigo">{c.jobCount}</Badge>
                      </td>
                      <td className="px-5 py-3 text-slate-300">{formatDate(c.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default React.memo(ManageCompanies);
