import Navbar from './Navbar';

/**
 * Shared layout wrapper for authenticated pages.
 * Renders the role-aware Navbar and the page content.
 */
const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
};

export default Layout;
