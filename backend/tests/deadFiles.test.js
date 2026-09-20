const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

describe('dead duplicate files cleanup', () => {
  it('backend/services/ folder should not exist (duplicate of src/services)', () => {
    const exists = fs.existsSync(path.join(__dirname, '../services'));
    assert.strictEqual(exists, false, 'backend/services/ should be removed - use src/services/');
  });

  it('backend/src/components/admin/AdminCarImages.jsx should not exist (React file in backend)', () => {
    const exists = fs.existsSync(path.join(__dirname, '../src/components/admin/AdminCarImages.jsx'));
    assert.strictEqual(exists, false, 'Backend should not have React component');
  });

  it('junk files should not exist', () => {
    const junkFiles = [
      '../add-image.json',
      '../reorder.json',
      '../test-car.json',
      '../test-db.js',
      '../../frontend/admincars.txt'
    ];
    for (const file of junkFiles) {
      const fullPath = path.join(__dirname, file);
      const exists = fs.existsSync(fullPath);
      assert.strictEqual(exists, false, `${file} should be removed`);
    }
  });

  it('smart-brand-car tenant should be registered in index.js', () => {
    const indexContent = fs.readFileSync(path.join(__dirname, '../../frontend/src/config/tenants/index.js'), 'utf8');
    assert.ok(indexContent.includes('smart-brand-car'), 'smart-brand-car should be in tenants registry');
    assert.ok(indexContent.includes('smartBrandCarTenant'), 'should import smartBrandCarTenant');
  });

  it('smart-brand-car.js file should exist and be valid', () => {
    const filePath = path.join(__dirname, '../../frontend/src/config/tenants/smart-brand-car.js');
    const exists = fs.existsSync(filePath);
    assert.strictEqual(exists, true, 'smart-brand-car.js should exist');
    const content = fs.readFileSync(filePath, 'utf8');
    assert.ok(content.includes('tenant: "smart-brand-car"'), 'should have correct tenant slug');
  });

  it('frontend AdminCarImages.jsx should exist (real one)', () => {
    const exists = fs.existsSync(path.join(__dirname, '../../frontend/src/components/admin/AdminCarImages.jsx'));
    assert.strictEqual(exists, true, 'Frontend AdminCarImages.jsx should exist');
  });

  it('backend/src/services should have only needed services', () => {
    const dir = path.join(__dirname, '../src/services');
    const files = fs.readdirSync(dir);
    // نباید imageService.js تکراری داشته باشد (فقط imageSearchService, catalog, sms, storage, imageValidator)
    const allowed = ['catalogService.js', 'imageSearchService.js', 'imageValidatorService.js', 'smsService.js', 'storageService.js'];
    for (const file of files) {
      assert.ok(allowed.includes(file), `Unexpected service file: ${file} - should be cleaned`);
    }
  });
});
