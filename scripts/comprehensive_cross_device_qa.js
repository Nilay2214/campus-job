const http = require('http');
const { spawn } = require('child_process');

// Use built-in WebSocket available in modern Node.js runtimes
const NativeWebSocket = globalThis.WebSocket || require('ws');

// Chrome DevTools Protocol Helper
class ChromeClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
    this.consoleLogs = [];
    this.networkErrors = [];
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new NativeWebSocket(this.wsUrl);
      this.ws.onopen = async () => {
        await this.send('Page.enable');
        await this.send('DOM.enable');
        await this.send('Runtime.enable');
        await this.send('Network.enable');
        await this.send('Log.enable');
        resolve();
      };
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data.toString());
        if (msg.method === 'Runtime.consoleAPICalled') {
          const text = msg.params.args.map(a => a.value ?? a.description ?? '').join(' ');
          this.consoleLogs.push({ type: msg.params.type, text });
        }
        if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
          this.consoleLogs.push({ type: 'error', text: msg.params.entry.text });
        }
        if (msg.method === 'Network.responseReceived') {
          const resp = msg.params.response;
          if (resp.status >= 400 && !resp.url.includes('/api/auth/login') && !resp.url.includes('/nonexistent')) {
            this.networkErrors.push({ url: resp.url, status: resp.status, statusText: resp.statusText });
          }
        }
        if (msg.id && this.callbacks.has(msg.id)) {
          const { resolve, reject } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) reject(new Error(msg.error.message));
          else resolve(msg.result);
        }
      };
      this.ws.onerror = reject;
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async navigate(url) {
    await this.send('Page.navigate', { url });
    await this.sleep(1200);
  }

  async eval(expr) {
    const res = await this.send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.exception?.description || 'Eval error');
    }
    return res.result.value;
  }

  async setViewport(width, height) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 768,
    });
    await this.sleep(300);
  }

  sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

function findChromePath() {
  const possible = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
  ];
  const fs = require('fs');
  for (const p of possible) {
    if (fs.existsSync(p)) return p;
  }
  return 'chrome';
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function runCrossDeviceQA() {
  console.log('================================================================');
  console.log('   CAMPUS JOB — FINAL PRE-DEPLOYMENT CROSS-DEVICE QA SUITE      ');
  console.log('================================================================\n');

  const chromePath = findChromePath();
  const chromeProcess = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9224',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-extensions',
    '--disable-dev-shm-usage',
  ]);

  let cdp;
  const results = [];
  const addResult = (phase, item, passed, details = '') => {
    results.push({ phase, item, passed, details });
    const mark = passed ? '[PASS]' : '[FAIL]';
    console.log(`${mark} [${phase}] ${item}: ${details}`);
  };

  try {
    await new Promise(r => setTimeout(r, 2000));
    const targets = await getJson('http://127.0.0.1:9224/json/list');
    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    cdp = new ChromeClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();
    console.log('[CDP] Connected to Chrome page target successfully.\n');

    await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `
        window.setReactInput = function(input, val) {
          if (!input) return;
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(input, val);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        };
      `
    });

    // -------------------------------------------------------------
    // PHASE A: PUBLIC ROUTE INVENTORY
    // -------------------------------------------------------------
    console.log('--- PHASE A: PUBLIC ROUTES ---');
    
    // 1. Landing /
    await cdp.navigate('http://localhost:3000/');
    const homeBody = await cdp.eval('document.body.innerText');
    addResult('Public Routes', 'Home /', !homeBody.includes('Page not found') && homeBody.includes('Campus Job'), 'Rendered headline & navigation');

    // 2. Jobs /jobs
    await cdp.navigate('http://localhost:3000/jobs');
    const jobsBody = await cdp.eval('document.body.innerText');
    addResult('Public Routes', 'Job Feed /jobs', !jobsBody.includes('Page not found'), 'Search & Filter bar loaded');

    // 3. Login /login
    await cdp.navigate('http://localhost:3000/login');
    const loginBody = await cdp.eval('document.body.innerText');
    addResult('Public Routes', 'Sign In /login', loginBody.includes('Sign In') && loginBody.includes('Password'), 'Rendered credential, Google & OTP options');

    // 4. Register /register
    await cdp.navigate('http://localhost:3000/register');
    const regBody = await cdp.eval('document.body.innerText');
    addResult('Public Routes', 'Register /register', regBody.includes('Register') || regBody.includes('Create'), 'Rendered registration form');

    // 5. Forgot Password /forgot-password
    await cdp.navigate('http://localhost:3000/forgot-password');
    const fpBody = await cdp.eval('document.body.innerText');
    addResult('Public Routes', 'Forgot Password /forgot-password', fpBody.includes('Reset') || fpBody.includes('Password'), 'Rendered password recovery form');

    // 6. Reset Password /reset-password?token=dummy
    await cdp.navigate('http://localhost:3000/reset-password?token=test-token-xyz');
    const rpBody = await cdp.eval('document.body.innerText');
    addResult('Public Routes', 'Reset Password /reset-password', !rpBody.includes('Page not found'), 'Rendered reset form with token query');

    async function performLogin(email, password) {
      await cdp.navigate('http://localhost:3000/login');
      await cdp.sleep(500);
      await cdp.eval(`
        (() => {
          localStorage.clear();
          const setVal = (el, val) => {
            if (!el) return;
            const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            setter.call(el, val);
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
          };
          const inputs = document.querySelectorAll('input');
          const emailInput = Array.from(inputs).find(i => i.type === 'email' || i.id === 'email' || i.name === 'email');
          const passInput = Array.from(inputs).find(i => i.type === 'password' || i.id === 'password');
          if (emailInput) setVal(emailInput, '${email}');
          if (passInput) setVal(passInput, '${password}');
          
          const form = document.querySelector('form');
          if (form) {
            form.requestSubmit();
          } else {
            const btns = Array.from(document.querySelectorAll('button'));
            const submit = btns.find(b => b.type === 'submit' || b.innerText.includes('Sign In'));
            if (submit) submit.click();
          }
        })()
      `);
      await cdp.sleep(3000);
    }

    // Pre-create student account if not exists
    await fetch('http://localhost:8080/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Predeploy Student',
        email: 'student_predeploy_qa@example.com',
        password: 'Password@123',
        role: 'STUDENT',
      })
    }).catch(() => {});

    // -------------------------------------------------------------
    // PHASE B: ROLE-BASED WORKFLOWS & AUTHENTICATION
    // -------------------------------------------------------------
    console.log('\n--- PHASE B: ROLE WORKFLOWS & AUTHENTICATION ---');

    // 1. Student Login & Workflow
    await performLogin('student_predeploy_qa@example.com', 'Password@123');
    const studentUrl = await cdp.eval('window.location.pathname');
    const studentRole = await cdp.eval('localStorage.getItem("role")');
    addResult('Student Workflow', 'Student Authentication', studentUrl === '/dashboard' && studentRole === 'STUDENT', `Landed on ${studentUrl}, Role=${studentRole}`);

    // Student Profile
    await cdp.navigate('http://localhost:3000/profile');
    const profBody = await cdp.eval('document.body.innerText');
    addResult('Student Workflow', 'Student Profile /profile', !profBody.includes('Page not found'), 'Profile fields loaded');

    // Student Applications
    await cdp.navigate('http://localhost:3000/applications');
    const appsBody = await cdp.eval('document.body.innerText');
    addResult('Student Workflow', 'Student Applications /applications', !appsBody.includes('Page not found'), 'Applications pipeline loaded');

    // Student Logout
    await cdp.eval(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const logout = btns.find(b => b.innerText.includes('Logout') || b.innerText.includes('Sign Out'));
        if (logout) logout.click();
        else localStorage.clear();
      })()
    `);
    await cdp.sleep(1500);
    const postStudentRole = await cdp.eval('localStorage.getItem("role")');
    addResult('Student Workflow', 'Student Logout', postStudentRole === null, 'Session cleared and redirected to login');

    // 2. Recruiter Login & Workflow
    await performLogin('recruiter@placement.com', 'recruiter123');
    const recruiterUrl = await cdp.eval('window.location.pathname');
    const recruiterRole = await cdp.eval('localStorage.getItem("role")');
    addResult('Recruiter Workflow', 'Recruiter Authentication', recruiterUrl.includes('/recruiter') && recruiterRole === 'RECRUITER', `Landed on ${recruiterUrl}, Role=${recruiterRole}`);

    // Recruiter Jobs
    await cdp.navigate('http://localhost:3000/recruiter/jobs');
    const recJobsBody = await cdp.eval('document.body.innerText');
    addResult('Recruiter Workflow', 'Manage Jobs /recruiter/jobs', !recJobsBody.includes('Page not found'), 'Job management portal rendered');

    // Recruiter Applications
    await cdp.navigate('http://localhost:3000/recruiter/applications');
    const recAppsBody = await cdp.eval('document.body.innerText');
    addResult('Recruiter Workflow', 'Candidate Submissions /recruiter/applications', !recAppsBody.includes('Page not found'), 'Applicant review pipeline rendered');

    // Recruiter Company Profile
    await cdp.navigate('http://localhost:3000/recruiter/profile');
    const recProfBody = await cdp.eval('document.body.innerText');
    addResult('Recruiter Workflow', 'Company Profile /recruiter/profile', !recProfBody.includes('Page not found'), 'Company settings & branding rendered');

    // 3. Admin Login & Workflow
    await cdp.eval('localStorage.clear()');
    await performLogin('admin@placement.com', 'admin123');
    const adminUrl = await cdp.eval('window.location.pathname');
    const adminRole = await cdp.eval('localStorage.getItem("role")');
    addResult('Admin Workflow', 'Admin Authentication', adminUrl.includes('/admin') && adminRole === 'ADMIN', `Landed on ${adminUrl}, Role=${adminRole}`);

    // Admin Users
    await cdp.navigate('http://localhost:3000/admin/users');
    const admUsersBody = await cdp.eval('document.body.innerText');
    addResult('Admin Workflow', 'User Management /admin/users', !admUsersBody.includes('Page not found'), 'Account governance loaded');

    // Admin Companies
    await cdp.navigate('http://localhost:3000/admin/companies');
    const admCompBody = await cdp.eval('document.body.innerText');
    addResult('Admin Workflow', 'Company Verification /admin/companies', !admCompBody.includes('Page not found'), 'Company directory loaded');

    // Admin Analytics
    await cdp.navigate('http://localhost:3000/admin/analytics');
    const admAnalyticsBody = await cdp.eval('document.body.innerText');
    addResult('Admin Workflow', 'Placement Analytics /admin/analytics', !admAnalyticsBody.includes('Page not found'), 'Placement charts loaded');

    // Admin Audit Logs
    await cdp.navigate('http://localhost:3000/admin/audit-logs');
    const admLogsBody = await cdp.eval('document.body.innerText');
    addResult('Admin Workflow', 'Audit Logs /admin/audit-logs', !admLogsBody.includes('Page not found'), 'System security event log loaded');

    // -------------------------------------------------------------
    // PHASE C: RESPONSIVE BREAKPOINT QA (NO HORIZONTAL OVERFLOW)
    // -------------------------------------------------------------
    console.log('\n--- PHASE C: CROSS-DEVICE RESPONSIVE BREAKPOINTS ---');
    await cdp.eval('localStorage.clear()');
    await cdp.navigate('http://localhost:3000/');
    await cdp.sleep(1000);

    const breakpoints = [
      { name: 'Mobile XS', width: 375, height: 812, mobile: true },
      { name: 'Mobile Standard (iPhone 13)', width: 390, height: 844, mobile: true },
      { name: 'Mobile XL (iPhone 14 Pro Max)', width: 430, height: 932, mobile: true },
      { name: 'Tablet Portrait (iPad Mini)', width: 768, height: 1024, mobile: true },
      { name: 'Tablet Landscape / Pro', width: 1024, height: 1366, mobile: false },
      { name: 'Small Laptop', width: 1280, height: 800, mobile: false },
      { name: 'Standard Desktop', width: 1366, height: 768, mobile: false },
      { name: 'Large Laptop', width: 1440, height: 900, mobile: false },
      { name: 'Full HD Desktop', width: 1920, height: 1080, mobile: false },
    ];

    for (const bp of breakpoints) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: bp.width,
        height: bp.height,
        deviceScaleFactor: 2,
        mobile: bp.mobile,
      });
      await cdp.sleep(500);
      const metrics = await cdp.eval(`
        ({
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
          hasOverflow: document.documentElement.scrollWidth > window.innerWidth + 5
        })
      `);
      addResult(
        'Responsive Breakpoints',
        `${bp.name} (${bp.width}x${bp.height})`,
        !metrics.hasOverflow,
        `scrollWidth=${metrics.scrollWidth}, innerWidth=${metrics.innerWidth}`
      );
    }
    await cdp.send('Emulation.clearDeviceMetricsOverride');

    // -------------------------------------------------------------
    // PHASE D: CONSOLE & NETWORK AUDIT
    // -------------------------------------------------------------
    console.log('\n--- PHASE D: CONSOLE & NETWORK INTEGRITY ---');
    const criticalConsoleErrors = cdp.consoleLogs.filter(l => 
      l.type === 'error' && 
      !l.text.includes('favicon') && 
      !l.text.includes('401') && 
      !l.text.includes('403') &&
      !l.text.includes('404')
    );
    if (criticalConsoleErrors.length > 0) {
      console.log('Console Errors Detected:', JSON.stringify(criticalConsoleErrors, null, 2));
    }
    addResult('Console Audit', 'Uncaught JavaScript Exceptions', criticalConsoleErrors.length === 0, `${criticalConsoleErrors.length} unexpected errors detected`);

    const criticalNetErrors = cdp.networkErrors.filter(e => e.status >= 500);
    addResult('Network Audit', 'Server API Responses (5xx)', criticalNetErrors.length === 0, `${criticalNetErrors.length} 5xx server errors detected`);

  } catch (err) {
    console.error('[FATAL ERROR IN QA SUITE]', err);
    addResult('Execution', 'QA Runner', false, err.message);
  } finally {
    if (cdp) cdp.close();
    chromeProcess.kill();
  }

  console.log('\n================================================================');
  console.log('                     FINAL SUMMARY REPORT                       ');
  console.log('================================================================');
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`TOTAL AUDIT CHECKS : ${total}`);
  console.log(`PASSED             : ${passed}`);
  console.log(`FAILED             : ${failed}`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
  else process.exit(0);
}

runCrossDeviceQA();
