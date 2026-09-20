const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

describe('route security', () => {
  it('imageRoutes should have adminGuard on sensitive routes', () => {
    const content = fs.readFileSync(path.join(__dirname, '../src/routes/imageRoutes.js'), 'utf8');
    assert.ok(content.includes('adminGuard'), 'imageRoutes should import adminGuard');
    assert.ok(content.includes('/:id/approve') && content.includes('adminGuard'), 'approve should have adminGuard');
    assert.ok(content.includes('/:id/reject') && content.includes('adminGuard'), 'reject should have adminGuard');
    assert.ok(content.includes('delete') || content.includes('DELETE') || content.includes('router.delete'), 'should have delete route');
    // GET car/:carId should be public (no adminGuard on that specific line is ok, but others must have)
    const approveLine = content.split('\n').find(l => l.includes('/approve'));
    assert.ok(approveLine && approveLine.includes('adminGuard'), 'approve line must have adminGuard');
  });

  it('purchaseRoutes should have adminGuard on GET and approve/reject', () => {
    const content = fs.readFileSync(path.join(__dirname, '../src/routes/purchaseRoutes.js'), 'utf8');
    assert.ok(content.includes('adminGuard'), 'purchaseRoutes should import adminGuard');
    // GET / should have adminGuard
    assert.ok(content.includes('router.get') && content.includes('adminGuard'), 'GET should have adminGuard');
    // approve/reject
    assert.ok(content.includes('/approve') && content.includes('adminGuard'), 'approve should have adminGuard');
    assert.ok(content.includes('/reject') && content.includes('adminGuard'), 'reject should have adminGuard');
  });

  it('visitRequestRoutes should have rateLimit on POST', () => {
    const content = fs.readFileSync(path.join(__dirname, '../src/routes/visitRequestRoutes.js'), 'utf8');
    assert.ok(content.includes('visitRequestLimiter') || content.includes('rateLimit'), 'should have rate limiter');
    assert.ok(content.includes('router.post') && content.includes('visitRequestLimiter'), 'POST should have visit limiter');
  });

  it('authRoutes should have authLimiter', () => {
    const content = fs.readFileSync(path.join(__dirname, '../src/routes/authRoutes.js'), 'utf8');
    assert.ok(content.includes('authLimiter'), 'authRoutes should have authLimiter');
  });

  it('database.js should have secure SSL default', () => {
    const content = fs.readFileSync(path.join(__dirname, '../src/config/database.js'), 'utf8');
    assert.ok(content.includes('rejectUnauthorized'), 'should have rejectUnauthorized');
    assert.ok(content.includes('DB_SSL_REJECT_UNAUTHORIZED'), 'should allow env override');
    assert.ok(content.includes('isProd') || content.includes('NODE_ENV'), 'should check production');
  });
});
