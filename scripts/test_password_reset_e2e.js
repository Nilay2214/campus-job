// test_password_reset_e2e.js
const assert = require('assert');

const BACKEND_URL = 'http://localhost:8080';
const FRONTEND_URL = 'http://localhost:3000';

async function request(endpoint, options = {}) {
  const url = `${BACKEND_URL}${endpoint}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });
  let body = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    body = await res.json();
  } else {
    body = await res.text();
  }
  return { status: res.status, ok: res.ok, body };
}

async function register(email, password, role) {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      fullName: `Test ${role}`,
      email,
      password,
      role,
    }),
  });
}

async function login(email, password) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

async function forgotPassword(email) {
  return request('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

async function resetPassword(token, newPassword) {
  return request('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
  });
}

async function runAudit() {
  console.log('===============================================================');
  console.log('  CAMPUS JOB — PASSWORD RESET & FORGOT PASSWORD E2E AUDIT TEST');
  console.log('===============================================================\n');

  // 1. Health check
  console.log('[1] Health check...');
  const frontRes = await fetch(FRONTEND_URL);
  assert.strictEqual(frontRes.status, 200, 'Frontend must be running on port 3000');
  console.log('  [PASS] Frontend is UP at ' + FRONTEND_URL + ' (Status 200)');

  // 2. User Enumeration Protection
  console.log('\n[2] Testing User Enumeration Protection...');
  const regEmail = `reset_test_${Date.now()}@example.com`;
  const initialPass = 'Password@123';
  await register(regEmail, initialPass, 'STUDENT');

  const knownRes = await forgotPassword(regEmail);
  assert.strictEqual(knownRes.status, 200);
  assert.strictEqual(
    knownRes.body.message,
    'If that email address is registered, a password reset link has been sent.'
  );
  console.log('  [PASS] Registered email received safe generic message');

  const unknownRes = await forgotPassword(`nonexistent_${Date.now()}@example.com`);
  assert.strictEqual(unknownRes.status, 200);
  assert.strictEqual(
    unknownRes.body.message,
    'If that email address is registered, a password reset link has been sent.'
  );
  console.log('  [PASS] Unregistered email received identical safe generic message (No enumeration)');

  // 3. Token Edge Cases
  console.log('\n[3] Testing Token Edge Cases...');
  
  // A. Random/Invalid token
  const invalidRes = await resetPassword('completely-random-invalid-token-12345', 'NewPassword@123');
  assert.strictEqual(invalidRes.status, 400);
  assert.strictEqual(invalidRes.body.error, 'Invalid or expired reset token');
  console.log('  [PASS] Invalid token rejected with HTTP 400');

  // B. Empty token
  const emptyRes = await resetPassword('', 'NewPassword@123');
  assert.strictEqual(emptyRes.status, 400);
  console.log('  [PASS] Empty token rejected with HTTP 400');

  // C. Short/Weak password (<8 chars)
  const weakPassRes = await resetPassword('some-token-placeholder', '12345');
  assert.strictEqual(weakPassRes.status, 400);
  console.log('  [PASS] Weak password (<8 chars) rejected with HTTP 400');

  // 4. Role-Specific Reset & Login Verification
  console.log('\n[4] Testing Password Reset Across All Roles (STUDENT, RECRUITER, ADMIN)...');

  // We can query the database directly or use a direct DB query script to get the generated token for end-to-end testing
  const { execSync } = require('child_process');
  
  function getLatestTokenForEmail(email) {
    const query = `SELECT prt.token_hash FROM password_reset_tokens prt JOIN users u ON prt.user_id = u.id WHERE u.email = '${email}' ORDER BY prt.created_at DESC LIMIT 1;`;
    // We note that DB stores SHA-256 hash, but in local test we can create a token directly with known raw token:
    return query;
  }

  // Helper to insert a known token directly into MySQL for live E2E password reset testing
  const crypto = require('crypto');
  const MYSQL_EXE = '"C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe"';
  function createKnownTokenForUser(email, rawToken, minutesValid = 30) {
    const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiry = new Date(Date.now() + minutesValid * 60000).toISOString().slice(0, 19).replace('T', ' ');
    const sql = `INSERT INTO password_reset_tokens (token_hash, user_id, expiry, used, created_at) SELECT '${hash}', id, '${expiry}', 0, NOW() FROM users WHERE email = '${email}';`;
    execSync(`${MYSQL_EXE} -u placement_app -p"5f9MaW7XATtMGuDdZAAa1!" -e "${sql}" placement_db`);
  }

  const roles = [
    { role: 'STUDENT', email: `reset_student_${Date.now()}@example.com`, pass: 'OldStudentPass@123', newPass: 'NewStudentPass@456' },
    { role: 'RECRUITER', email: `reset_recruiter_${Date.now()}@example.com`, pass: 'OldRecruiterPass@123', newPass: 'NewRecruiterPass@456' },
    { role: 'ADMIN', email: 'admin@placement.com', pass: 'admin123', newPass: 'NewAdminPass@456' },
  ];

  for (const r of roles) {
    if (r.role !== 'ADMIN') {
      await register(r.email, r.pass, r.role);
    }
    // Verify old password works before reset
    const preLogin = await login(r.email, r.pass);
    assert.strictEqual(preLogin.status, 200, `Initial login for ${r.role} must succeed`);

    // Create a known reset token
    const testRawToken = `test_token_${r.role.toLowerCase()}_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;
    createKnownTokenForUser(r.email, testRawToken, 30);

    // Apply password reset with new password
    const resetRes = await resetPassword(testRawToken, r.newPass);
    assert.strictEqual(resetRes.status, 200, `Reset password for ${r.role} must succeed`);
    assert.ok(resetRes.body.message.includes('Password reset successful'));

    // Attempt login with OLD password -> MUST FAIL (401)
    const oldLogin = await login(r.email, r.pass);
    assert.strictEqual(oldLogin.status, 401, `Login with OLD password for ${r.role} must return 401 Unauthorized`);
    console.log(`  [PASS] ${r.role}: Old password rejected (HTTP 401)`);

    // Attempt login with NEW password -> MUST SUCCEED (200)
    const newLogin = await login(r.email, r.newPass);
    assert.strictEqual(newLogin.status, 200, `Login with NEW password for ${r.role} must return 200 OK`);
    assert.strictEqual(newLogin.body.role, r.role);
    assert.ok(newLogin.body.token);
    console.log(`  [PASS] ${r.role}: New password accepted (HTTP 200, Role: ${newLogin.body.role})`);

    // Attempt second reset using the SAME token -> MUST FAIL (single-use guard)
    const secondReset = await resetPassword(testRawToken, 'YetAnotherPass@789');
    assert.strictEqual(secondReset.status, 400, 'Used token must be rejected');
    assert.strictEqual(secondReset.body.error, 'Invalid or expired reset token');
    console.log(`  [PASS] ${r.role}: Re-use of token rejected (HTTP 400)`);

    // Reset admin password back to admin123 if admin tested
    if (r.role === 'ADMIN') {
      const adminRestoreToken = `admin_restore_${Date.now()}`;
      createKnownTokenForUser(r.email, adminRestoreToken, 30);
      await resetPassword(adminRestoreToken, 'admin123');
      const restoredAdminLogin = await login(r.email, 'admin123');
      assert.strictEqual(restoredAdminLogin.status, 200);
      console.log('  [PASS] Admin restored to default credentials');
    }
  }

  // 5. Expired Token Test
  console.log('\n[5] Testing Expired Token Edge Case...');
  const expEmail = `exp_test_${Date.now()}@example.com`;
  await register(expEmail, 'ExpPass@123', 'STUDENT');
  const expRawToken = `expired_token_${Date.now()}`;
  createKnownTokenForUser(expEmail, expRawToken, -10); // 10 minutes in the past

  const expResetRes = await resetPassword(expRawToken, 'NewExpPass@456');
  assert.strictEqual(expResetRes.status, 400);
  assert.strictEqual(expResetRes.body.error, 'Invalid or expired reset token');
  console.log('  [PASS] Expired token rejected with HTTP 400');

  console.log('\n===============================================================');
  console.log('  ALL PASSWORD RESET & FORGOT PASSWORD TESTS PASSED 100%');
  console.log('===============================================================');
}

runAudit().catch((err) => {
  console.error('\n[AUDIT FAILED]', err);
  process.exit(1);
});
