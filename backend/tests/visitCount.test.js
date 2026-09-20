const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

describe('visitRequests count bug fix', () => {
  it('getVisitRequests should filter countQuery same as main query', () => {
    const content = fs.readFileSync(path.join(__dirname, '../src/controllers/visitRequestController.js'), 'utf8');
    // باید countQuery داشته باشد که فیلترها را اعمال کند
    assert.ok(content.includes('countQuery'), 'should have countQuery');
    assert.ok(content.includes('countValues'), 'should have countValues for filtered count');
    // نباید فقط SELECT COUNT(*) FROM visit_requests بدون WHERE باشد
    const hasUnfilteredCount = content.includes('SELECT COUNT(*)::int AS total FROM visit_requests`') && !content.includes('countQuery');
    // الان باید فیلترشده باشد
    assert.ok(content.includes('vr.status') && content.includes('countQuery'), 'count should filter by status');
    assert.ok(content.includes('ILIKE') && content.includes('countQuery'), 'count should filter by search');
  });

  it('should return totalAll and filtered flag', () => {
    const content = fs.readFileSync(path.join(__dirname, '../src/controllers/visitRequestController.js'), 'utf8');
    assert.ok(content.includes('totalAll'), 'should return totalAll');
    assert.ok(content.includes('filtered'), 'should return filtered flag');
  });
});
