const { describe, it } = require('node:test');
const assert = require('node:assert');

// تست منطق adminGuard بدون نیاز به سرور کامل
describe('adminGuard', () => {
  it('should allow when ADMIN_API_KEY not set (guard disabled)', () => {
    const original = process.env.ADMIN_API_KEY;
    delete process.env.ADMIN_API_KEY;
    delete process.env.ADMIN_PASSWORD;
    
    // پاک کردن کش ماژول
    delete require.cache[require.resolve('../src/middleware/adminGuard')];
    const guard = require('../src/middleware/adminGuard');
    
    assert.strictEqual(guard.isGuardEnabled(), false);
    
    if (original) process.env.ADMIN_API_KEY = original;
  });

  it('should be enabled when ADMIN_API_KEY set', () => {
    process.env.ADMIN_API_KEY = 'test-key-123';
    delete require.cache[require.resolve('../src/middleware/adminGuard')];
    const guard = require('../src/middleware/adminGuard');
    
    assert.strictEqual(guard.isGuardEnabled(), true);
    
    delete process.env.ADMIN_API_KEY;
  });

  it('should have guardStatus endpoint', () => {
    process.env.ADMIN_API_KEY = 'test-key';
    delete require.cache[require.resolve('../src/middleware/adminGuard')];
    const guard = require('../src/middleware/adminGuard');
    
    assert.strictEqual(typeof guard.guardStatus, 'function');
    assert.strictEqual(guard.ADMIN_KEY_HEADER, 'x-admin-key');
    
    delete process.env.ADMIN_API_KEY;
  });
});
