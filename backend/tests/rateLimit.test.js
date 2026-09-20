const { describe, it } = require('node:test');
const assert = require('node:assert');

describe('rateLimit middleware', () => {
  it('should create limiter function', () => {
    const { createRateLimiter } = require('../src/middleware/rateLimit');
    const limiter = createRateLimiter({ name: 'test', windowMs: 60000, max: 5 });
    assert.strictEqual(typeof limiter, 'function');
  });

  it('should export predefined limiters', () => {
    const rl = require('../src/middleware/rateLimit');
    assert.strictEqual(typeof rl.globalLimiter, 'function');
    assert.strictEqual(typeof rl.authLimiter, 'function');
    assert.strictEqual(typeof rl.visitRequestLimiter, 'function');
    assert.strictEqual(typeof rl.smsLimiter, 'function');
  });

  it('should block after max requests', () => {
    const { createRateLimiter } = require('../src/middleware/rateLimit');
    const limiter = createRateLimiter({ name: 'test-block', windowMs: 60000, max: 2, message: 'too many' });
    
    let blocked = false;
    const mockRes = {
      status: (code) => ({ json: (data) => { if (code === 429) blocked = true; } }),
      setHeader: () => {}
    };
    const mockReq = { ip: '1.2.3.4', headers: {} };
    
    // 2 request allowed
    limiter(mockReq, mockRes, () => {});
    limiter(mockReq, mockRes, () => {});
    // 3rd should block
    limiter(mockReq, mockRes, () => {});
    
    assert.strictEqual(blocked, true);
  });
});
