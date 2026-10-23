import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Layout from './components/layout/Layout';
import Spinner from './components/ui/Spinner';

// Auth pages are loaded eagerly for instant first-paint.
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import NotFound from './pages/NotFound';

// Route-based code splitting (React.lazy). Each group is a separate chunk.
// Jobs
const JobList = lazy(() => import('./pages/jobs/JobList'));
const JobDetails = lazy(() => import('./pages/jobs/JobDetails'));

// Student
const StudentDashboard = lazy(() => import('./pages/dashboard/StudentDashboard'));
const MyApplications = lazy(() => import('./pages/applications/MyApplications'));
const StudentProfile = lazy(() => import('./pages/profile/StudentProfile'));
const ResumeUpload = lazy(() => import('./pages/profile/ResumeUpload'));

// Recruiter
const RecruiterDashboard = lazy(() => import('./pages/recruiter/RecruiterDashboard'));
const PostJob = lazy(() => import('./pages/recruiter/PostJob'));
const ManageJobs = lazy(() => import('./pages/recruiter/ManageJobs'));
const EditJob = lazy(() => import('./pages/recruiter/EditJob'));
const RecruiterApplications = lazy(() => import('./pages/recruiter/RecruiterApplications'));
const CandidateDetails = lazy(() => import('./pages/recruiter/CandidateDetails'));
const CompanyProfile = lazy(() => import('./pages/recruiter/CompanyProfile'));

// Admin
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const ManageUsers = lazy(() => import('./pages/admin/ManageUsers'));
const ManageCompanies = lazy(() => import('./pages/admin/ManageCompanies'));
const PlacementAnalytics = lazy(() => import('./pages/admin/PlacementAnalytics'));
const Reports = lazy(() => import('./pages/admin/Reports'));
const AuditLogs = lazy(() => import('./pages/admin/AuditLogs'));

import { useAuth } from './context/AuthContext';

// Suspense fallback shown while a lazy route chunk loads.
const RouteFallback = () => (
  <div
    className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-300"
    role="status"
    aria-live="polite"
  >
    <Spinner />
    <span className="text-sm">Loading...</span>
  </div>
);

const withSuspense = (element) => <Suspense fallback={<RouteFallback />}>{element}</Suspense>;

const App = () => {
  const { isAuthenticated, role } = useAuth();

  // Route guard helpers (children wrapped in shared Layout + Suspense)
  const RequireAuth = ({ children }) =>
    isAuthenticated ? withSuspense(<Layout>{children}</Layout>) : <Navigate to="/login" replace />;

  const RequireRole = ({ role: requiredRole, children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    if (role !== requiredRole) {
      if (role === 'RECRUITER') return <Navigate to="/recruiter/dashboard" replace />;
      if (role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
      return <Navigate to="/dashboard" replace />;
    }
    return withSuspense(<Layout>{children}</Layout>);
  };

  const PublicOnlyRoute = ({ children }) => {
    if (isAuthenticated) {
      if (role === 'RECRUITER') return <Navigate to="/recruiter/dashboard" replace />;
      if (role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
      return <Navigate to="/dashboard" replace />;
    }
    return children;
  };

  return (
    <>
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<HomePage />} />

        {/* Auth (outside Layout, eager for first paint) */}
        <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Any authenticated user (role-aware dashboard) */}
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              role === 'STUDENT' ? (
                withSuspense(
                  <Layout>
                    <StudentDashboard />
                  </Layout>
                )
              ) : role === 'RECRUITER' ? (
                <Navigate to="/recruiter/dashboard" replace />
              ) : role === 'ADMIN' ? (
                <Navigate to="/admin/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Jobs (STUDENT, RECRUITER, ADMIN) */}
        <Route path="/jobs" element={<RequireAuth><JobList /></RequireAuth>} />
        <Route path="/jobs/:jobId" element={<RequireAuth><JobDetails /></RequireAuth>} />

        {/* ===== STUDENT ROUTES ===== */}
        <Route
          path="/applications"
          element={<RequireRole role="STUDENT"><MyApplications /></RequireRole>}
        />
        <Route
          path="/profile"
          element={<RequireRole role="STUDENT"><StudentProfile /></RequireRole>}
        />
        <Route
          path="/profile/resume"
          element={<RequireRole role="STUDENT"><ResumeUpload /></RequireRole>}
        />
        <Route
          path="/resume"
          element={<RequireRole role="STUDENT"><ResumeUpload /></RequireRole>}
        />

        {/* ===== RECRUITER ROUTES ===== */}
        <Route
          path="/recruiter/dashboard"
          element={<RequireRole role="RECRUITER"><RecruiterDashboard /></RequireRole>}
        />
        <Route
          path="/recruiter"
          element={<RequireRole role="RECRUITER"><RecruiterDashboard /></RequireRole>}
        />
        <Route
          path="/recruiter/jobs"
          element={<RequireRole role="RECRUITER"><ManageJobs /></RequireRole>}
        />
        <Route
          path="/recruiter/manage-jobs"
          element={<RequireRole role="RECRUITER"><ManageJobs /></RequireRole>}
        />
        <Route
          path="/recruiter/jobs/new"
          element={<RequireRole role="RECRUITER"><PostJob /></RequireRole>}
        />
        <Route
          path="/recruiter/jobs/edit/:jobId"
          element={<RequireRole role="RECRUITER"><EditJob /></RequireRole>}
        />
        <Route
          path="/recruiter/jobs/:jobId/edit"
          element={<RequireRole role="RECRUITER"><EditJob /></RequireRole>}
        />
        <Route
          path="/recruiter/applications"
          element={<RequireRole role="RECRUITER"><RecruiterApplications /></RequireRole>}
        />
        <Route
          path="/recruiter/jobs/:jobId/applications"
          element={<RequireRole role="RECRUITER"><RecruiterApplications /></RequireRole>}
        />
        <Route
          path="/recruiter/candidates/:studentId"
          element={<RequireRole role="RECRUITER"><CandidateDetails /></RequireRole>}
        />
        <Route
          path="/recruiter/profile"
          element={<RequireRole role="RECRUITER"><CompanyProfile /></RequireRole>}
        />

        {/* ===== ADMIN ROUTES ===== */}
        <Route
          path="/admin/dashboard"
          element={<RequireRole role="ADMIN"><AdminDashboard /></RequireRole>}
        />
        <Route
          path="/admin"
          element={<RequireRole role="ADMIN"><AdminDashboard /></RequireRole>}
        />
        <Route
          path="/admin/users"
          element={<RequireRole role="ADMIN"><ManageUsers /></RequireRole>}
        />
        <Route
          path="/admin/companies"
          element={<RequireRole role="ADMIN"><ManageCompanies /></RequireRole>}
        />
        <Route
          path="/admin/reports"
          element={<RequireRole role="ADMIN"><Reports /></RequireRole>}
        />
        <Route
          path="/admin/analytics"
          element={<RequireRole role="ADMIN"><PlacementAnalytics /></RequireRole>}
        />
        <Route
          path="/admin/audit-logs"
          element={<RequireRole role="ADMIN"><AuditLogs /></RequireRole>}
        />

        {/* Unknown routes -> NotFound */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <ToastContainer />
    </>
  );
};

export default App;

