import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { ScrollText } from 'lucide-react';
import adminService from '../../services/adminService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import Button from '../../components/ui/Button';

const formatDateTime = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const auditVariant = (action) => {
  const a = String(action ?? '').toUpperCase();
  if (a.includes('DELETE')) return 'red';
  if (a.includes('CREATE')) return 'emerald';
  if (a.includes('UPDATE')) return 'indigo';
  if (a.includes('LOGIN')) return 'violet';
  return 'default';
};

const AuditLogs = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminService.getAdminAuditLogs();
      setLogs(Array.isArray(data) ? data : []);
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Failed to load audit logs';
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
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-900 bg-red-950/40 p-8 text-center">
        <h2 className="text-lg font-semibold text-red-100">Error loading audit logs</h2>
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
        <h1 className="text-2xl font-bold sm:text-3xl">Audit Logs</h1>
        <p className="mt-1 text-slate-400">Platform activity trail.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-indigo-300" />
            Activity Log ({logs.length})
          </CardTitle>
          <CardDescription>Derived from user, company, job, and application records.</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ScrollText className="h-10 w-10 text-slate-600" />
              <p className="mt-3 text-sm text-slate-400">No activity recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log, i) => (
                <div
                  key={`${log.timestamp}-${i}`}
                  className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-950/50 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={auditVariant(log.action)}>{log.action}</Badge>
                      <span className="text-sm font-medium text-slate-100">{log.actor || '—'}</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      {log.subject || '—'} · {log.details || ''}
                    </div>
                  </div>
                  <div className="shrink-0 text-xs text-slate-500">{formatDateTime(log.timestamp)}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default React.memo(AuditLogs);
