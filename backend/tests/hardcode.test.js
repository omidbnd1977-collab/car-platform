const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

describe('no hardcoded production URLs', () => {
  it('apiBase.js should not have hardcoded car-platform-db.onrender.com in code', () => {
    const content = fs.readFileSync(path.join(__dirname, '../../frontend/src/utils/apiBase.js'), 'utf8');
    // نباید در کد (نه کامنت) hard-code باشد - چک می‌کنیم که DEFAULT_API_URL assignment شامل دامنه نباشد
    const lines = content.split('\n').filter(l => !l.trim().startsWith('//') && !l.trim().startsWith('*'));
    const codeOnly = lines.join('\n');
    assert.ok(!codeOnly.includes('car-platform-db.onrender.com'), 'apiBase.js code should not hardcode production URL - use VITE_API_URL or dynamic origin');
    assert.ok(content.includes('VITE_API_URL'), 'should use VITE_API_URL env');
    assert.ok(content.includes('window.location.origin') || content.includes('getDefaultApiUrl'), 'should have dynamic fallback');
  });

  it('smsRoutes.js should not hardcode car-platform-db URL in responses', () => {
    const content = fs.readFileSync(path.join(__dirname, '../src/routes/smsRoutes.js'), 'utf8');
    // نباید آدرس ثابت در پیام‌های JSON باشد - باید از getBaseUrl استفاده کند
    assert.ok(content.includes('getBaseUrl'), 'should have getBaseUrl helper for dynamic URLs');
    assert.ok(content.includes('PUBLIC_API_URL') || content.includes('BASE_URL'), 'should allow env override');
    // چک اینکه دیگر hard-code ثابت در webhook message نیست
    const hasOldHardcoded = content.includes('https://car-platform-db.onrender.com/api/sms/webhook') && content.includes('Use POST https://car-platform-db');
    assert.ok(!hasOldHardcoded, 'should not have old hardcoded webhook URL');
  });

  it('frontend should use apiBase for API calls', () => {
    const apiBasePath = path.join(__dirname, '../../frontend/src/utils/apiBase.js');
    const exists = fs.existsSync(apiBasePath);
    assert.strictEqual(exists, true, 'apiBase.js should exist');
  });
});
