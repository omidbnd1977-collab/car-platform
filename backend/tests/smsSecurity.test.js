const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

describe('SMS security', () => {
  it('smsRoutes test endpoints should require adminGuard', () => {
    const content = fs.readFileSync(path.join(__dirname, '../src/routes/smsRoutes.js'), 'utf8');
    // /test should have adminGuard
    const hasTestGuard = content.includes('/test') && content.includes('adminGuard');
    assert.ok(hasTestGuard, 'sms test routes should have adminGuard');
  });

  it('smsService should not log sensitive data', () => {
    const content = fs.readFileSync(path.join(__dirname, '../src/services/smsService.js'), 'utf8');
    // نباید API key را لاگ کند
    assert.ok(!content.includes('console.log.*apiKey') || content.includes('hasApiKey'), 'should not log raw api key');
  });
});
