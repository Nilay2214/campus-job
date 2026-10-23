import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const DashboardPage = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  if (!token) {
    navigate('/login');
    return null;
  }

  return (
    <div className="dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1>Campus Job Dashboard</h1>
          <p>Role: <strong>{role}</strong></p>
        </div>
        <button onClick={handleLogout} style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Logout
        </button>
      </div>
      <p>Welcome to the Campus Job platform.</p>
      <div className="stats-grid">
        <div className="stat-card">Total Students</div>
        <div className="stat-card">Placed Students</div>
        <div className="stat-card">Placement Percentage</div>
      </div>
    </div>
  );
};

export default DashboardPage;
