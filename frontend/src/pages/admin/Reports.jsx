import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { FileText, Briefcase, Building2, Users } from 'lucide-react';
import adminService from '../../services/adminService';
import StatCard from '../../components/ui/StatCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import Button from '../../components/ui/Button';

const ReportSection = ({ title, rows, columns }) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent className="p-0">
      {!rows || rows.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-sm text-slate-500">No data available.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 text-sm text-slate-400">
                {columns.map((c) => (
                  <th key={c.key} className="px-5 py-3">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-slate-800/60 last:border-0">
                  {columns.map((c) => (
                    <td key={c.key} className="px-5 py-3 text-slate-200">
                      {row[c.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CardContent>
  </Card>
);

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminService.getAdminReports();
      setReport(data);
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Failed to load reports';
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
        <Skeleton className="mb-6 h-8 w-56" />
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-900 bg-red-950/40 p-8 text-center">
        <h2 className="text-lg font-semibold text-red-100">Error loading reports</h2>
        <p className="mt-2 text-sm text-red-200">{error}</p>
        <Button variant="danger" className="mt-4" onClick={load}>
          Retry
        </Button>
      </div>
    );
  }

  const cards = [
    { title: 'Total Students', value: report?.totalStudents ?? 0, icon: <Users className="h-5 w-5 text-indigo-300" /> },
    { title: 'Total Recruiters', value: report?.totalRecruiters ?? 0, icon: <Users className="h-5 w-5 text-violet-300" /> },
    { title: 'Total Companies', value: report?.totalCompanies ?? 0, icon: <Building2 className="h-5 w-5 text-emerald-300" /> },
    { title: 'Total Jobs', value: report?.totalJobs ?? 0, icon: <Briefcase className="h-5 w-5 text-amber-300" /> },
    { title: 'Active Jobs', value: report?.activeJobs ?? 0, icon: <Briefcase className="h-5 w-5 text-sky-300" /> },
    { title: 'Applications', value: report?.totalApplications ?? 0, icon: <FileText className="h-5 w-5 text-rose-300" /> },
    { title: 'Pending', value: report?.pendingApplications ?? 0, icon: <FileText className="h-5 w-5 text-blue-300" /> },
    { title: 'Selected', value: report?.selectedPlacements ?? 0, icon: <FileText className="h-5 w-5 text-emerald-300" /> },
  ];

  const jobRows = (report?.topJobsByApplications || []).map((j) => ({
    title: j.title,
    company: j.companyName,
    applications: j.applicationCount,
    status: j.status,
  }));

  const companyRows = (report?.companiesByJobs || []).map((c) => ({
    company: c.companyName,
    jobs: c.jobCount,
  }));

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Reports</h1>
        <p className="mt-1 text-slate-400">Platform-wide summary and top performers.</p>
      </header>

      <section className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map((c) => (
          <StatCard key={c.title} title={c.title} value={c.value} icon={c.icon} />
        ))}
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ReportSection
          title="Top Jobs by Applications"
          rows={jobRows}
          columns={[
            { key: 'title', label: 'Job' },
            { key: 'company', label: 'Company' },
            { key: 'applications', label: 'Applications' },
            { key: 'status', label: 'Status' },
          ]}
        />
        <ReportSection
          title="Companies by Jobs"
          rows={companyRows}
          columns={[
            { key: 'company', label: 'Company' },
            { key: 'jobs', label: 'Jobs Posted' },
          ]}
        />
      </div>
    </div>
  );
};

export default React.memo(Reports);
