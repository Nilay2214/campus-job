/**
 * test_oauth_end_to_end.js
 * Comprehensive end-to-end verification of Google OAuth2 / OIDC backend and role flows in Campus Job.
 */

const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: parsed, rawBody: body });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: null, rawBody: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

function post(path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return request({
    hostname: 'localhost',
    port: 8080,
    path,
    method: 'POST',
    headers,
  }, body);
}

function get(path, token) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return request({
    hostname: 'localhost',
    port: 8080,
    path,
    method: 'GET',
    headers,
  });
}

async function run() {
  console.log('============================================================');
  console.log('CAMPUS JOB — GOOGLE OAUTH2 / OIDC & AUTH VERIFICATION SUITE');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Backend Health
  console.log('1. Checking Backend Health...');
  const healthRes = await get('/actuator/health');
  assert(healthRes.status === 200 && healthRes.data.status === 'UP', 'Backend /actuator/health is UP');

  // 2. Email/Password Regression Tests
  console.log('\n2. Testing Existing Email/Password Authentication (Regression)...');
  const studentEmail = `std_reg_${Date.now()}@example.com`;
  const recruiterEmail = `rec_reg_${Date.now()}@example.com`;

  const regStudent = await post('/api/auth/register', {
    fullName: 'Email Student',
    email: studentEmail,
    password: 'Password@123',
    role: 'STUDENT',
  });
  assert(regStudent.status === 200 && regStudent.data.role === 'STUDENT', 'Student registration works');

  const regRecruiter = await post('/api/auth/register', {
    fullName: 'Email Recruiter',
    email: recruiterEmail,
    password: 'Password@123',
    role: 'RECRUITER',
  });
  assert(regRecruiter.status === 200 && regRecruiter.data.role === 'RECRUITER', 'Recruiter registration works');

  const loginAdmin = await post('/api/auth/login', {
    email: 'admin@placement.com',
    password: 'admin123',
  });
  assert(loginAdmin.status === 200 && loginAdmin.data.role === 'ADMIN', 'Admin email/password login works');

  // 3. Google OAuth: New User Auto-Registration (must default to STUDENT, never ADMIN)
  console.log('\n3. Testing Google Auth: New User Auto-Registration...');
  const newGoogleEmail = `google_new_${Date.now()}@gmail.com`;
  const googleNewRes = await post('/api/auth/google', {
    email: newGoogleEmail,
    fullName: 'New Google Student',
    googleId: 'g_sub_10001',
  });

  assert(googleNewRes.status === 200, 'New Google user login returns HTTP 200');
  assert(googleNewRes.data.role === 'STUDENT', 'New Google user role defaults strictly to STUDENT');
  assert(!!googleNewRes.data.token, 'Standard JWT token issued for new Google user');

  // Verify JWT works against Student endpoints
  const studentToken = googleNewRes.data.token;
  const profileRes = await get('/api/students/profile', studentToken);
  assert(profileRes.status === 200, 'New Google user can access Student profile endpoint (/api/students/profile)');

  // Verify Student cannot access Admin endpoint
  const rbacStudentAdmin = await get('/api/admin/users', studentToken);
  assert(rbacStudentAdmin.status === 403, 'New Google user (STUDENT) is rejected with 403 on /api/admin/users');

  // 4. Google OAuth: Existing Student Account Linking
  console.log('\n4. Testing Google Auth: Existing Student Account Linking...');
  const googleExistingStudentRes = await post('/api/auth/google', {
    email: studentEmail,
    fullName: 'Email Student OAuth Login',
    googleId: 'g_sub_10002',
  });
  assert(googleExistingStudentRes.status === 200, 'Existing student Google login returns HTTP 200');
  assert(googleExistingStudentRes.data.role === 'STUDENT', 'Existing student retains STUDENT role');

  // 5. Google OAuth: Existing Recruiter Account Linking (Role Preservation)
  console.log('\n5. Testing Google Auth: Existing Recruiter Account Linking (Role Preservation)...');
  const googleExistingRecruiterRes = await post('/api/auth/google', {
    email: recruiterEmail,
    fullName: 'Email Recruiter OAuth Login',
    googleId: 'g_sub_10003',
  });
  assert(googleExistingRecruiterRes.status === 200, 'Existing recruiter Google login returns HTTP 200');
  assert(googleExistingRecruiterRes.data.role === 'RECRUITER', 'Existing recruiter retains RECRUITER role (not downgraded to STUDENT)');
  
  const recruiterToken = googleExistingRecruiterRes.data.token;
  const recruiterJobsRes = await get('/api/recruiters/jobs', recruiterToken);
  assert(recruiterJobsRes.status === 200, 'Existing recruiter can access /api/recruiters/jobs with OAuth token');

  // 6. Google OAuth: Existing Admin Account Linking (Role Preservation)
  console.log('\n6. Testing Google Auth: Existing Admin Account Linking (Role Preservation)...');
  const googleExistingAdminRes = await post('/api/auth/google', {
    email: 'admin@placement.com',
    fullName: 'Admin OAuth Login',
    googleId: 'g_sub_10004',
  });
  assert(googleExistingAdminRes.status === 200, 'Existing admin Google login returns HTTP 200');
  assert(googleExistingAdminRes.data.role === 'ADMIN', 'Existing admin retains ADMIN role');

  const adminToken = googleExistingAdminRes.data.token;
  const adminUsersRes = await get('/api/admin/users', adminToken);
  assert(adminUsersRes.status === 200, 'Existing admin can access /api/admin/users with OAuth token');

  // 7. Google OAuth: Validation & Error Handling
  console.log('\n7. Testing Google Auth Validation & Edge Cases...');
  const invalidEmailRes = await post('/api/auth/google', {
    email: 'invalid-email-format',
    fullName: 'Bad Format',
    googleId: 'g_sub_99999',
  });
  assert(invalidEmailRes.status === 400, 'Invalid email format rejected with 400 Bad Request');

  const missingEmailRes = await post('/api/auth/google', {
    fullName: 'Missing Email',
    googleId: 'g_sub_99999',
  });
  assert(missingEmailRes.status === 400, 'Missing email rejected with 400 Bad Request');

  // Summary
  console.log('\n============================================================');
  console.log(`TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
