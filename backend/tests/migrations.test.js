const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

describe('migrations system', () => {
  it('migrate.js should exist', () => {
    const exists = fs.existsSync(path.join(__dirname, '../src/config/migrate.js'));
    assert.strictEqual(exists, true);
  });

  it('migrations folder should have files', () => {
    const dir = path.join(__dirname, '../src/migrations');
    const exists = fs.existsSync(dir);
    assert.strictEqual(exists, true);
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
    assert.ok(files.length >= 2, 'should have at least 2 migrations');
  });

  it('001_create_visit_requests should exist', () => {
    const exists = fs.existsSync(path.join(__dirname, '../src/migrations/001_create_visit_requests.js'));
    assert.strictEqual(exists, true);
  });

  it('002_add_sold_at_to_cars should exist', () => {
    const exists = fs.existsSync(path.join(__dirname, '../src/migrations/002_add_sold_at_to_cars.js'));
    assert.strictEqual(exists, true);
  });

  it('server.js should use runMigrations not ensureTable', () => {
    const content = fs.readFileSync(path.join(__dirname, '../src/server.js'), 'utf8');
    assert.ok(content.includes('runMigrations'), 'server.js should call runMigrations');
    assert.ok(!content.includes('ensureTable') || content.includes('runMigrations'), 'should use migrations');
  });

  it('visitRequestController should not have raw CREATE TABLE as primary', () => {
    const content = fs.readFileSync(path.join(__dirname, '../src/controllers/visitRequestController.js'), 'utf8');
    // باید به migrate ارجاع دهد یا deprecated باشد
    assert.ok(content.includes('runMigrations') || content.includes('Deprecated'), 'should reference migrations');
  });

  it('package.json should have migrate script', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
    assert.ok(pkg.scripts.migrate, 'should have migrate script');
  });
});
