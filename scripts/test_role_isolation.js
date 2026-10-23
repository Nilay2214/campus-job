// test_role_isolation.js
const assert = require('assert');

const BACKEND_URL = 'http://localhost:8080';
const FRONTEND_URL = 'http://localhost:3000';

const STUDENT_EMAIL = 'student_login_test_605121@example.com';
const STUDENT_PASS = 'Password@123';

const RECRUITER_EMAIL = 'recruiter_login_test_436831@example.com';
const RECRUITER_PASS = 'Password@123';

const ADMIN_EMAIL = 'admin@placement.com';
const ADMIN_PASS = 'admin123';

async function login(email, password) {
  const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(`Login failed for ${email} with status ${res.status}`);
  }
  return res.json();
}

async function apiGet(endpoint, token) {
  const res = await fetch(`${BACKEND_URL}${endpoint}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  return res;
}

async function runTests() {
  console.log('========================================================');
  console.log('  CAMPUS JOB - E2E ROLE ISOLATION & SESSION AUDIT TEST');
  console.log('========================================================\n');

  // 1. Health check
  console.log('[1] Checking Server Health...');
  const frontRes = await fetch(FRONTEND_URL);
  assert.strictEqual(frontRes.status, 200, 'Frontend must return 200 OK');
  console.log('  [PASS] Frontend is UP at ' + FRONTEND_URL + ' (Status 200)');

  // 2. Individual Logins & Scopes
  console.log('\n[2] Testing Individual Role Logins & Dedicated API Scopes...');
  
  // A. Student
  const sAuth = await login(STUDENT_EMAIL, STUDENT_PASS);
  assert.strictEqual(sAuth.role, 'STUDENT', 'Role must be STUDENT');
  assert.ok(sAuth.token, 'Token must exist');
  console.log(`  [PASS] Student authenticated. Role: ${sAuth.role}`);
  
  const sProfileRes = await apiGet('/api/students/profile', sAuth.token);
  assert.strictEqual(sProfileRes.status, 200, 'Student profile must return 200');
  const sProfile = await sProfileRes.json();
  console.log(`  [PASS] Student profile retrieved: ${sProfile.fullName}`);

  // B. Recruiter
  const rAuth = await login(RECRUITER_EMAIL, RECRUITER_PASS);
  assert.strictEqual(rAuth.role, 'RECRUITER', 'Role must be RECRUITER');
  assert.ok(rAuth.token, 'Token must exist');
  console.log(`  [PASS] Recruiter authenticated. Role: ${rAuth.role}`);
  
  const rJobsRes = await apiGet('/api/recruiters/jobs', rAuth.token);
  assert.strictEqual(rJobsRes.status, 200, 'Recruiter jobs must return 200');
  const rJobs = await rJobsRes.json();
  console.log(`  [PASS] Recruiter jobs retrieved: ${rJobs.content?.length ?? 0} jobs`);

  // C. Admin
  const aAuth = await login(ADMIN_EMAIL, ADMIN_PASS);
  assert.strictEqual(aAuth.role, 'ADMIN', 'Role must be ADMIN');
  assert.ok(aAuth.token, 'Token must exist');
  console.log(`  [PASS] Admin authenticated. Role: ${aAuth.role}`);

  const aDashRes = await apiGet('/api/admin/dashboard', aAuth.token);
  assert.strictEqual(aDashRes.status, 200, 'Admin dashboard must return 200');
  const aDash = await aDashRes.json();
  console.log(`  [PASS] Admin stats: ${aDash.totalStudents} students, ${aDash.totalJobs} jobs`);

  // 3. Cross-Role RBAC
  console.log('\n[3] Testing Cross-Role RBAC Authorization Isolation...');
  
  const sBlockRecruiter = await apiGet('/api/recruiters/jobs', sAuth.token);
  assert.strictEqual(sBlockRecruiter.status, 403, 'Student must get 403 on recruiter jobs');
  console.log('  [PASS] Student blocked from Recruiter API (HTTP 403)');

  const sBlockAdmin = await apiGet('/api/admin/users', sAuth.token);
  assert.strictEqual(sBlockAdmin.status, 403, 'Student must get 403 on admin users');
  console.log('  [PASS] Student blocked from Admin API (HTTP 403)');

  const rBlockStudent = await apiGet('/api/students/profile', rAuth.token);
  assert.strictEqual(rBlockStudent.status, 403, 'Recruiter must get 403 on student profile');
  console.log('  [PASS] Recruiter blocked from Student Profile API (HTTP 403)');

  const rBlockAdmin = await apiGet('/api/admin/users', rAuth.token);
  assert.strictEqual(rBlockAdmin.status, 403, 'Recruiter must get 403 on admin users');
  console.log('  [PASS] Recruiter blocked from Admin API (HTTP 403)');

  // 4. Multi-Cycle Role Switching
  console.log('\n[4] Testing Multi-Cycle Role Switching (Student -> Recruiter -> Admin)...');
  for (let cycle = 1; cycle <= 3; cycle++) {
    const s = await login(STUDENT_EMAIL, STUDENT_PASS);
    const sp = await (await apiGet('/api/students/profile', s.token)).json();
    assert.strictEqual(s.role, 'STUDENT');
    assert.ok(sp !== null && typeof sp === 'object');

    const r = await login(RECRUITER_EMAIL, RECRUITER_PASS);
    const rj = await (await apiGet('/api/recruiters/jobs', r.token)).json();
    assert.strictEqual(r.role, 'RECRUITER');
    assert.ok(Array.isArray(rj.content));

    const a = await login(ADMIN_EMAIL, ADMIN_PASS);
    const ad = await (await apiGet('/api/admin/dashboard', a.token)).json();
    assert.strictEqual(a.role, 'ADMIN');
    assert.ok(typeof ad.totalStudents === 'number');

    console.log(`  [PASS] Cycle ${cycle}: Student -> Recruiter -> Admin 100% isolated`);
  }

  // 5. Reverse Cycle Switching (Admin -> Student -> Recruiter)
  console.log('\n[5] Testing Reverse Multi-Cycle Role Switching (Admin -> Student -> Recruiter)...');
  for (let cycle = 1; cycle <= 3; cycle++) {
    const a = await login(ADMIN_EMAIL, ADMIN_PASS);
    const ad = await (await apiGet('/api/admin/dashboard', a.token)).json();
    assert.strictEqual(a.role, 'ADMIN');

    const s = await login(STUDENT_EMAIL, STUDENT_PASS);
    const sp = await (await apiGet('/api/students/profile', s.token)).json();
    assert.strictEqual(s.role, 'STUDENT');
    assert.ok(sp !== null && typeof sp === 'object');

    const r = await login(RECRUITER_EMAIL, RECRUITER_PASS);
    const rj = await (await apiGet('/api/recruiters/jobs', r.token)).json();
    assert.strictEqual(r.role, 'RECRUITER');

    console.log(`  [PASS] Reverse Cycle ${cycle}: Admin -> Student -> Recruiter 100% isolated`);
  }

  console.log('\n========================================================');
  console.log('  ALL ROLE ISOLATION & VERIFICATION TESTS PASSED 100%');
  console.log('========================================================');
}

runTests().catch((err) => {
  console.error('\n[TEST FAILURE]', err);
  process.exit(1);
});
