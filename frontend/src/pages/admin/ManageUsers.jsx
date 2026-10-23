import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Search, UserX, Users as UsersIcon, ShieldAlert } from 'lucide-react';
import adminService from '../../services/adminService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import Button from '../../components/ui/Button';

const roleVariant = (role) => {
  const r = String(role ?? '').toUpperCase();
  if (r === 'STUDENT') return 'indigo';
  if (r === 'RECRUITER') return 'violet';
  if (r === 'ADMIN') return 'emerald';
  return 'default';
};

const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const ManageUsers = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [confirmTarget, setConfirmTarget] = useState(null); // { user, enabled }
  const [toggling, setToggling] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminService.getAdminUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Failed to load users';
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
    return users.filter((u) => {
      const matchesRole = !roleFilter || String(u.role).toUpperCase() === roleFilter;
      const matchesSearch =
        !q ||
        String(u.email ?? '').toLowerCase().includes(q) ||
        String(u.id ?? '').includes(q);
      return matchesRole && matchesSearch;
    });
  }, [users, search, roleFilter]);

  const confirmToggle = (u, enabled) => {
    setConfirmTarget({ user: u, enabled });
  };

  const applyToggle = async () => {
    if (!confirmTarget) return;
    const { user, enabled } = confirmTarget;
    setToggling(true);
    setError('');
    try {
      await adminService.updateUserStatus(user.id, enabled);
      toast.success(`${user.email} ${enabled ? 'enabled' : 'disabled'}`);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, enabled } : u))
      );
      setConfirmTarget(null);
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Failed to update user status';
      setError(msg);
      toast.error(msg);
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Skeleton className="mb-6 h-8 w-56" />
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
        <h2 className="text-lg font-semibold text-red-100">Error loading users</h2>
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
        <h1 className="text-2xl font-bold sm:text-3xl">Manage Users</h1>
        <p className="mt-1 text-slate-400">All registered platform users.</p>
      </header>

      <Card className="mb-5">
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by email or ID..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 py-2 pl-10 pr-3 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>
            <div className="flex items-center gap-2">
              {['STUDENT', 'RECRUITER', 'ADMIN'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRoleFilter((prev) => (prev === r ? '' : r))}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    roleFilter === r
                      ? 'border-indigo-500 bg-indigo-500/15 text-indigo-200'
                      : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5 text-indigo-300" />
            Users ({filtered.length})
          </CardTitle>
          <CardDescription>Total registered: {users.length}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <UserX className="h-10 w-10 text-slate-600" />
              <p className="mt-3 text-sm text-slate-400">No users found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-sm text-slate-400">
<th className="px-5 py-3">ID</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Registered</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.id} className="border-b border-slate-800/60 last:border-0">
                      <td className="px-5 py-3 text-slate-400">{u.id}</td>
                      <td className="px-5 py-3 font-medium text-slate-100">{u.email}</td>
                      <td className="px-5 py-3">
                        <Badge variant={roleVariant(u.role)}>{u.role}</Badge>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={u.enabled ? 'emerald' : 'red'}>
                          {u.enabled ? 'Active' : 'Disabled'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-slate-300">{formatDate(u.createdAt)}</td>
                      <td className="px-5 py-3">
                        <Button
                          variant={u.enabled ? 'danger' : 'primary'}
                          size="sm"
                          onClick={() => confirmToggle(u, !u.enabled)}
                          disabled={String(u.role).toUpperCase() === 'ADMIN' && u.enabled}
                          title={
                            String(u.role).toUpperCase() === 'ADMIN' && u.enabled
                              ? 'Cannot disable the last/active ADMIN account'
                              : u.enabled
                                ? 'Disable this user'
                                : 'Enable this user'
                          }
                        >
                          {u.enabled ? 'Disable' : 'Enable'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
</CardContent>
      </Card>

      {confirmTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-6 w-6 text-amber-300" />
              <h2 id="confirm-title" className="text-lg font-semibold text-slate-50">
                {confirmTarget.enabled ? 'Enable user' : 'Disable user'}
              </h2>
            </div>
            <p className="mt-3 text-sm text-slate-300">
              Are you sure you want to <strong>{confirmTarget.enabled ? 'enable' : 'disable'}</strong>{' '}
              <span className="font-medium text-slate-100">{confirmTarget.user.email}</span>?
            </p>
            {!confirmTarget.enabled ? (
              <p className="mt-2 text-xs text-amber-200/80">
                A disabled user will not be able to log in. Jobs and data they created are preserved.
              </p>
            ) : null}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                variant="ghost"
                onClick={() => setConfirmTarget(null)}
                disabled={toggling}
              >
                Cancel
              </Button>
              <Button
                variant={confirmTarget.enabled ? 'primary' : 'danger'}
                onClick={applyToggle}
                disabled={toggling}
                aria-busy={toggling}
              >
                {toggling ? 'Saving...' : confirmTarget.enabled ? 'Enable' : 'Disable'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default React.memo(ManageUsers);
