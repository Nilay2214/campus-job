import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { toast } from 'react-toastify';

import recruiterApplicationService from '../../services/recruiterApplicationService';
import { getResumeBlobUrl } from '../../services/resumeService';

import LoadingSkeleton from '../../components/jobs/LoadingSkeleton';
import ErrorState from '../../components/jobs/ErrorState';
import EmptyState from '../../components/jobs/EmptyState';

const CandidateDetails = () => {
  const navigate = useNavigate();
  const { studentId } = useParams();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [applications, setApplications] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchCandidate = useCallback(async () => {
    if (!studentId) return;

    setLoading(true);
    setError('');

    try {
      // Fetch all recruiter applications then filter by studentId.
      const data = await recruiterApplicationService.getRecruiterApplications({
        page: 0,
        size: 100,
        sortBy: 'appliedAt',
        direction: 'desc',
      });
      const list = data?.content ?? [];
      setApplications(list.filter((a) => String(a?.studentId) === String(studentId)));
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        'Failed to load candidate details';
      setError(msg);
      setApplications([]);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchCandidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchCandidate]);

  const candidate = useMemo(() => {
    if (!applications.length) return null;
    const first = applications[0];
    return {
      fullName: first?.studentName,
      email: first?.studentEmail,
      phone: first?.studentPhone,
      branch: first?.studentBranch,
      cgpa: first?.studentCgpa,
      skills: first?.studentSkills,
      resumeUrl: first?.studentResumeUrl,
    };
  }, [applications]);

  const hasCandidate = !!candidate;

  const candidateSkills = useMemo(() => {
    const raw = candidate?.skills;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.filter(Boolean);
    return String(raw)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }, [candidate]);

const resumeUrl = candidate?.resumeUrl ?? '';

  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeError, setResumeError] = useState('');

  const onDownloadResume = async () => {
    if (!studentId) return;
    setResumeLoading(true);
    setResumeError('');
    try {
      const blobUrl = await getResumeBlobUrl(studentId);
      if (!blobUrl) {
        setResumeError('Resume is not available or you do not have permission to view it.');
        return;
      }
      window.open(blobUrl, '_blank', 'noreferrer');
      // Revoke after a short delay so the browser can open the blob.
      setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
    } catch {
      setResumeError('Failed to load resume.');
    } finally {
      setResumeLoading(false);
    }
  };

  const onUpdateApplicationStatus = async (applicationId, nextStatus) => {
    if (!applicationId) return;
    const ok = window.confirm(`Change status to ${nextStatus}?`);
    if (!ok) return;

    setUpdatingId(applicationId);
    setError('');
    try {
      await recruiterApplicationService.updateApplicationStatus(applicationId, nextStatus);
      toast.success(`Status updated to ${nextStatus}`);
      await fetchCandidate();
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        'Failed to update status';
      setError(msg);
      toast.error(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (value) => {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const statusBadgeClass = (status) => {
    const s = String(status ?? '').trim().toUpperCase();
    if (s === 'PENDING') return 'bg-blue-900/40 text-blue-200 border-blue-800/60';
    if (s === 'SHORTLISTED') return 'bg-emerald-900/40 text-emerald-200 border-emerald-800/60';
    if (s === 'REJECTED') return 'bg-red-900/40 text-red-200 border-red-800/60';
    if (s === 'SELECTED') return 'bg-emerald-900/40 text-emerald-200 border-emerald-800/60';
    return 'bg-slate-800 text-slate-200 border-slate-700';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400"
            aria-label="Back"
          >
            <span aria-hidden="true">←</span>
            Back
          </button>
        </div>

        {loading ? (
          <LoadingSkeleton count={7} />
        ) : error ? (
          <ErrorState title="Error loading candidate" message={error} loading={loading} onRetry={fetchCandidate} />
        ) : !hasCandidate ? (
          <EmptyState
            title="Candidate Not Found"
            message="The requested candidate does not exist or has not applied to any of your jobs."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_20rem] gap-6">
            <div>
              <section className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm p-6" aria-label="Candidate profile">
                <div>
                  <h1 className="text-2xl font-bold text-slate-50">{candidate?.fullName ?? '—'}</h1>
                  <p className="mt-1 text-sm text-slate-300">Student ID: {studentId ?? '—'}</p>
                </div>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-200">Personal Information</h2>
                    <div className="mt-3 text-sm text-slate-300 space-y-2">
                      <div>
                        <span className="text-slate-400">Email:</span> {candidate?.email ?? '—'}
                      </div>
                      <div>
                        <span className="text-slate-400">Phone:</span> {candidate?.phone ?? '—'}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-sm font-semibold text-slate-200">Academic Information</h2>
                    <div className="mt-3 text-sm text-slate-300 space-y-2">
                      <div>
                        <span className="text-slate-400">Branch:</span> {candidate?.branch ?? '—'}
                      </div>
                      <div>
                        <span className="text-slate-400">CGPA:</span> {candidate?.cgpa ?? '—'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h2 className="text-lg font-semibold text-slate-50">Professional Information</h2>
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-slate-200">Skills</h3>
                    <div className="mt-3 flex flex-wrap gap-2" aria-label="Skills">
                      {candidateSkills.length > 0 ? (
                        candidateSkills.map((s) => (
                          <span
                            key={s}
                            className="inline-flex rounded-full bg-slate-800 border border-slate-700 px-3 py-1 text-xs text-slate-200"
                          >
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h2 className="text-lg font-semibold text-slate-50">Resume</h2>
                  <div className="mt-3">
                    {resumeUrl ? (
                      <>
                        <button
                          type="button"
                          onClick={onDownloadResume}
                          disabled={resumeLoading}
                          aria-busy={resumeLoading}
                          className="inline-flex items-center justify-center rounded-lg px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60"
                          aria-label="Download resume"
                        >
                          {resumeLoading ? 'Loading...' : 'Download Resume'}
                        </button>
                        {resumeError ? (
                          <p className="mt-2 text-sm text-red-200" role="alert">{resumeError}</p>
                        ) : null}
                      </>
                    ) : (
                      <div className="text-sm text-slate-400">No Resume Uploaded</div>
                    )}
                  </div>
                </div>
              </section>

              <section className="mt-6 bg-slate-900 border border-slate-800 rounded-xl shadow-sm p-6" aria-label="Application history">
                <h2 className="text-lg font-semibold text-slate-50">Application History</h2>
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-[900px] w-full text-left">
                    <thead>
                      <tr className="text-slate-300 text-sm">
                        <th className="px-4 py-3">Applied Job</th>
                        <th className="px-4 py-3">Applied Date</th>
                        <th className="px-4 py-3">Application Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map((app) => {
                        const status = String(app?.status ?? 'PENDING').trim().toUpperCase();
                        return (
                          <tr key={app?.id} className="border-t border-slate-800">
                            <td className="px-4 py-3 text-sm text-slate-300">{app?.jobTitle ?? '—'}</td>
                            <td className="px-4 py-3 text-sm text-slate-300">{formatDate(app?.appliedAt)}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(status)}`}
                                aria-label={`Status: ${status}`}
                              >
                                {status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            <div className="hidden md:block">
              <div className="w-80 border border-slate-800 bg-slate-900 rounded-xl p-4 sticky top-6">
                <h2 className="text-sm text-slate-300">Recruiter Actions</h2>
                <div className="mt-4 flex flex-col gap-2">
                  {applications.map((app) => {
                    const status = String(app?.status ?? '').trim().toUpperCase();
                    const isUpdating = updatingId === app?.id;
                    return (
                      <div key={app?.id} className="rounded-lg border border-slate-800 p-2">
                        <div className="text-xs text-slate-400 truncate">{app?.jobTitle}</div>
                        <div className="mt-2 flex flex-col gap-1">
                          {status !== 'SHORTLISTED' ? (
                            <button
                              type="button"
                              onClick={() => onUpdateApplicationStatus(app?.id, 'SHORTLISTED')}
                              className="w-full rounded-lg px-4 py-2 bg-emerald-900/40 hover:bg-emerald-900/55 text-emerald-100 border border-emerald-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                              aria-label="Shortlist"
                              disabled={!app?.id || isUpdating}
                            >
                              Shortlist
                            </button>
                          ) : null}
                          {status !== 'REJECTED' ? (
                            <button
                              type="button"
                              onClick={() => onUpdateApplicationStatus(app?.id, 'REJECTED')}
                              className="w-full rounded-lg px-4 py-2 bg-red-900/30 hover:bg-red-900/40 text-red-100 border border-red-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                              aria-label="Reject"
                              disabled={!app?.id || isUpdating}
                            >
                              Reject
                            </button>
                          ) : null}
                          {status !== 'SELECTED' ? (
                            <button
                              type="button"
                              onClick={() => onUpdateApplicationStatus(app?.id, 'SELECTED')}
                              className="w-full rounded-lg px-4 py-2 bg-emerald-900/40 hover:bg-emerald-900/55 text-emerald-100 border border-emerald-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                              aria-label="Select"
                              disabled={!app?.id || isUpdating}
                            >
                              Select
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(CandidateDetails);
