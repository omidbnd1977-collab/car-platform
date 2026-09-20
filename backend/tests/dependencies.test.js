const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

describe('dependencies cleanup', () => {
  it('backend should not have react-beautiful-dnd (deprecated frontend lib)', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
    assert.ok(!pkg.dependencies['react-beautiful-dnd'], 'backend should not have react-beautiful-dnd - it is deprecated and frontend-only');
  });

  it('backend should not have react or react-dom', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
    assert.ok(!pkg.dependencies['react'], 'backend should not have react');
    assert.ok(!pkg.dependencies['react-dom'], 'backend should not have react-dom');
    assert.ok(!pkg.dependencies['react-router-dom'], 'backend should not have react-router-dom');
  });

  it('frontend App.jsx should use react-router-dom', () => {
    const content = fs.readFileSync(path.join(__dirname, '../../frontend/src/App.jsx'), 'utf8');
    assert.ok(content.includes('react-router-dom'), 'App.jsx should import from react-router-dom');
    assert.ok(content.includes('BrowserRouter'), 'should use BrowserRouter');
    assert.ok(content.includes('Routes'), 'should use Routes');
    assert.ok(content.includes('Route'), 'should use Route');
    // نباید window.location دستی برای روتینگ اصلی استفاده کند
    assert.ok(!content.includes('window.addEventListener("hashchange"') || content.includes('LegacyRouteHandler'), 'should not have manual hashchange listener for main routing - use router');
  });

  it('frontend should have react-router-dom dependency', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../../frontend/package.json'), 'utf8'));
    assert.ok(pkg.dependencies['react-router-dom'], 'frontend should have react-router-dom');
  });

  it('backend package.json should have only backend deps', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
    const allowedBackendDeps = ['axios', 'bcrypt', 'cheerio', 'cors', 'dotenv', 'express', 'jsonwebtoken', 'multer', 'pg'];
    for (const dep of Object.keys(pkg.dependencies)) {
      assert.ok(allowedBackendDeps.includes(dep), `Unexpected backend dep: ${dep} - should be backend-only`);
    }
  });
});
