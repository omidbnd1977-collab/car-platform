const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

describe('API base consistency', () => {
  it('api.js should use apiBase.js not hardcoded localhost', () => {
    const content = fs.readFileSync(path.join(__dirname, '../../frontend/src/services/api.js'), 'utf8');
    // نباید localhost:5000 در کد باشد (حتی به عنوان fallback)
    const hasLocalhostFallback = content.includes('localhost:5000') && content.includes('baseURL');
    // اگر فقط در کامنت باشد ایرادی ندارد ولی الان ما کلاً حذف کردیم
    const codeLines = content.split('\n').filter(l => !l.trim().startsWith('//') && !l.trim().startsWith('/*') && !l.trim().startsWith('*'));
    const codeOnly = codeLines.join('\n');
    assert.ok(!codeOnly.includes('localhost:5000'), 'api.js code should not hardcode localhost:5000 - use apiBase');
    assert.ok(content.includes('apiBase') || content.includes('API_BASE'), 'should import from apiBase.js');
  });

  it('apiBase.js and api.js should be consistent', () => {
    const apiBaseContent = fs.readFileSync(path.join(__dirname, '../../frontend/src/utils/apiBase.js'), 'utf8');
    const apiContent = fs.readFileSync(path.join(__dirname, '../../frontend/src/services/api.js'), 'utf8');
    assert.ok(apiBaseContent.includes('VITE_API_URL'), 'apiBase should use VITE_API_URL');
    assert.ok(apiContent.includes('API_BASE') || apiContent.includes('VITE_API_URL'), 'api.js should use API_BASE or VITE_API_URL');
  });

  it('api.js should import API_BASE from utils/apiBase', () => {
    const content = fs.readFileSync(path.join(__dirname, '../../frontend/src/services/api.js'), 'utf8');
    assert.ok(content.includes('from "../utils/apiBase'), 'should import from utils/apiBase');
    assert.ok(content.includes('API_BASE'), 'should use API_BASE');
  });
});
