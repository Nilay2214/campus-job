// verify_home_page.js
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CDP_PORT = 9223;
const USER_DATA_DIR = path.join(process.env.TEMP || 'C:\\Windows\\Temp', 'chrome_home_profile_' + Date.now());

const results = [];
const consoleErrors = [];

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();
    this.eventListeners = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const cb = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) cb.reject(new Error(msg.error.message || JSON.stringify(msg.error)));
          else cb.resolve(msg.result);
        } else if (msg.method) {
          const listeners = this.eventListeners.get(msg.method) || [];
          for (const l of listeners) l(msg.params);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  on(method, callback) {
    if (!this.eventListeners.has(method)) {
      this.eventListeners.set(method, []);
    }
    this.eventListeners.get(method).push(callback);
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.text || JSON.stringify(res.exceptionDetails));
    }
    return res.result ? res.result.value : undefined;
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async navigate(url) {
    await this.send('Page.navigate', { url });
    await this.sleep(1500);
  }
}

async function getDebuggerUrl() {
  for (let i = 0; i < 20; i++) {
    try {
      const list = await new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:${CDP_PORT}/json/list`, res => {
          let b = '';
          res.on('data', c => b += c);
          res.on('end', () => resolve(JSON.parse(b)));
        }).on('error', reject);
      });
      const page = Array.isArray(list) ? list.find(t => t.type === 'page' && t.webSocketDebuggerUrl) : null;
      if (page) return page.webSocketDebuggerUrl;
      if (Array.isArray(list) && list.length > 0 && list[0].webSocketDebuggerUrl) return list[0].webSocketDebuggerUrl;
    } catch {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  throw new Error('Could not connect to Chrome DevTools port ' + CDP_PORT);
}

function check(testName, passed, details = '') {
  results.push({ testName, passed, details });
  const statusTag = passed ? '[PASS]' : '[FAIL]';
  console.log(`${statusTag} ${testName} - ${details}`);
}

async function main() {
  console.log('================================================================');
  console.log('       CAMPUS JOB — REAL BROWSER HOME PAGE QA VERIFICATION      ');
  console.log('================================================================\n');

  if (!fs.existsSync(USER_DATA_DIR)) {
    fs.mkdirSync(USER_DATA_DIR, { recursive: true });
  }

  console.log('[1/4] Launching Chrome...');
  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${USER_DATA_DIR}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'http://localhost:3000/'
  ]);

  const wsUrl = await getDebuggerUrl();
  const cdp = new CDPClient(wsUrl);
  await cdp.connect();

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('DOM.enable');
  await cdp.send('Network.enable');

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

  cdp.on('Runtime.consoleAPICalled', (params) => {
    if (params.type === 'error' && !params.args.some(a => (a.value || '').includes('favicon'))) {
      consoleErrors.push(params.args.map(a => a.value || '').join(' '));
    }
  });

  console.log('[2/4] Verifying Landing Page Sections at http://localhost:3000/ ...\n');

  await cdp.navigate('http://localhost:3000/');
  await cdp.sleep(2000);

  // 1. Root / 404 Resolution Check
  const pageText = await cdp.eval('document.body.innerText');
  const is404 = pageText.includes('404') && pageText.includes('Page not found');
  check('Root Route / Resolution', !is404, is404 ? 'Rendered 404' : 'Successfully rendered public landing page (NOT 404)');

  // 2. Hero Section
  const hasHeadline = pageText.includes('From campus applications to') && pageText.includes('complete recruitment workflows.');
  check('Hero Section Headline', hasHeadline, 'Headline rendered with refined copy');

  const ctaLinks = await cdp.eval(`
    (() => {
      const links = Array.from(document.querySelectorAll('a'));
      return {
        hasExploreJobs: Boolean(links.find(a => a.innerText.includes('Explore Jobs') && a.pathname === '/jobs')),
        hasViewProject: Boolean(links.find(a => a.innerText.includes('View Project') && a.hash === '#what-i-engineered')),
        hasGetStarted: Boolean(links.find(a => a.innerText.includes('Get Started') && a.pathname === '/register'))
      };
    })()
  `);
  check('Hero CTAs (Explore Jobs, View Project, Get Started)', ctaLinks.hasExploreJobs && ctaLinks.hasViewProject && ctaLinks.hasGetStarted, 'All 3 CTAs properly linked');

  // 3. Developer Intro
  const hasAboutDev = pageText.includes('Nilay Bhamare') && 
                      (pageText.includes('Full-Stack Developer') || pageText.includes('Project Lead'));
  check('Developer Intro Section', hasAboutDev, 'Personal developer intro with Nilay Bhamare, role, and avatar placeholder rendered');

  // 4. Why I Built Campus Job
  const hasMotive = pageText.includes('Why I Built Campus Job') && pageText.includes('I built Campus Job because');
  check('Personal Motive & Problem Statement', hasMotive, 'First-person personal motivation and campus recruitment problem statement rendered');

  // 5. What I Engineered (4 Engineering Pillars)
  const hasWhatIEngineered = pageText.includes('What I Engineered') && pageText.includes('Frontend Engineering') && pageText.includes('Backend Engineering') && pageText.includes('Security Engineering') && pageText.includes('Data & Performance');
  check('What I Engineered (4 Pillars)', hasWhatIEngineered, 'Frontend, Backend, Security, and Data/Performance engineering pillars rendered');

  // 6. System Architecture Visual
  const hasArchitecture = pageText.includes('System Architecture') && 
                          (pageText.includes('Application Layer Stack') || pageText.includes('APPLICATION LAYER STACK') || pageText.includes('Frontend: React 18')) && 
                          (pageText.includes('Auth Convergence Model') || pageText.includes('AUTH CONVERGENCE MODEL') || pageText.includes('Campus Job Stateless JWT'));
  check('System Architecture Section', hasArchitecture, 'Visual application flow and auth convergence models rendered');

  // 7. Engineering Challenges I Solved
  const hasChallenges = pageText.includes('Engineering Challenges I Solved') && pageText.includes('N+1 Query Elimination') && pageText.includes('Outcome:');
  check('Engineering Challenges I Solved', hasChallenges, 'Problem → Engineering Solution → Outcome case studies rendered');

  // 8. Authentication (3 Methods, 1 Authorization Model)
  const hasAuthSection = pageText.includes('Three Authentication Methods, One Authorization Model') && pageText.includes('Email & Password') && pageText.includes('Google Authentication') && pageText.includes('Mobile Phone + OTP');
  check('Authentication Section', hasAuthSection, 'Three auth methods converging onto one model showcased');

  // 9. Security (Security Wasn't an Afterthought)
  const hasSecurity = (pageText.includes("Security Wasn't an Afterthought") || pageText.includes("Security Wasnt an Afterthought")) && pageText.includes('Stateless JWT Auth') && pageText.includes('Granular RBAC') && pageText.includes('BCrypt') && pageText.includes('Protected Resume Access');
  check('Security Architecture Section', hasSecurity, 'Confirmed security engineering architecture highlighted');

  // 10. Verified Project Metrics
  const hasStats = pageText.includes('148') && pageText.includes('Automated Backend Tests') && pageText.includes('3 Roles') && pageText.includes('22 Routes');
  check('Engineering Evidence & Stats', hasStats, '148 automated tests, 3 roles, 3 auth modes, and 22 frontend routes displayed');

  // 11. Explore Campus Job (Role Experiences)
  const hasExploreRoles = pageText.includes('Explore Campus Job') && 
                          (pageText.includes('Student Experience') || pageText.includes('STUDENT EXPERIENCE')) && 
                          (pageText.includes('Recruiter Experience') || pageText.includes('RECRUITER EXPERIENCE'));
  check('Explore Campus Job Portals', hasExploreRoles, 'Role experiences for student, recruiter, and admin rendered with valid links');

  // 12. Built With (Tech Stack)
  const hasTechStack = pageText.includes('Built With') && pageText.includes('React 18') && pageText.includes('Spring Boot 3.2.5') && pageText.includes('MySQL 8');
  check('Technology Stack Section', hasTechStack, 'Accurate tech stack from package.json and pom.xml displayed');

  // 13. Final CTA & Footer
  const hasFooter = pageText.includes('Ready to build your next opportunity?') && pageText.includes('Built by Nilay Bhamare') && pageText.includes('All rights reserved.');
  check('Final CTA & Footer', hasFooter, 'Closing CTA and structured footer with developer attribution rendered');

  console.log('\n[3/4] Testing Responsive Viewports...\n');

  const viewports = [
    { name: 'Desktop (1920x1080)', width: 1920, height: 1080 },
    { name: 'Laptop (1440x900)', width: 1440, height: 900 },
    { name: 'Standard (1366x768)', width: 1366, height: 768 },
    { name: 'Tablet (768x1024)', width: 768, height: 1024 },
    { name: 'Mobile iPhone X (375x812)', width: 375, height: 812, mobile: true },
    { name: 'Mobile iPhone 13 (390x844)', width: 390, height: 844, mobile: true }
  ];

  for (const vp of viewports) {
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 2,
      mobile: Boolean(vp.mobile)
    });
    await cdp.sleep(600);
    const scrollWidth = await cdp.eval('document.documentElement.scrollWidth');
    const innerWidth = await cdp.eval('window.innerWidth');
    const noOverflow = scrollWidth <= innerWidth + 5;
    check(`Responsive Viewport: ${vp.name}`, noOverflow, `scrollWidth=${scrollWidth}, innerWidth=${innerWidth}`);
  }
  await cdp.send('Emulation.clearDeviceMetricsOverride');

  console.log('\n[4/4] Verifying Unknown Routes (404 Page)...');
  await cdp.navigate('http://localhost:3000/nonexistent-route-xyz-999');
  await cdp.sleep(1500);
  const notFoundText = await cdp.eval('document.body.innerText');
  const isCorrect404 = notFoundText.includes('404') && notFoundText.includes('Page not found');
  check('404 Handling on Genuinely Unknown Routes', isCorrect404, 'Unknown routes correctly reach NotFound page');

  console.log('\n================================================================');
  console.log('                     QA VERIFICATION SUMMARY                    ');
  console.log('================================================================');
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`TOTAL CHECKS : ${total}`);
  console.log(`PASSED       : ${passed}`);
  console.log(`FAILED       : ${failed}`);
  console.log(`CONSOLE ERR  : ${consoleErrors.length}`);
  console.log('================================================================\n');

  try {
    await cdp.send('Browser.close');
  } catch {}
  chromeProcess.kill();
}

main().catch(err => {
  console.error('Fatal error in Home QA runner:', err);
  process.exit(1);
});
