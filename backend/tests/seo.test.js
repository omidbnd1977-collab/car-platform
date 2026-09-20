const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

describe('HTML metadata SEO', () => {
  it('index.html should have lang="fa" not en', () => {
    const content = fs.readFileSync(path.join(__dirname, '../../frontend/index.html'), 'utf8');
    assert.ok(content.includes('lang="fa"'), 'should have lang="fa" for Persian site');
    assert.ok(!content.includes('lang="en"'), 'should not have lang="en"');
  });

  it('should have dir="rtl" for Persian', () => {
    const content = fs.readFileSync(path.join(__dirname, '../../frontend/index.html'), 'utf8');
    assert.ok(content.includes('dir="rtl"'), 'should have dir="rtl"');
  });

  it('should have proper title not "frontend"', () => {
    const content = fs.readFileSync(path.join(__dirname, '../../frontend/index.html'), 'utf8');
    assert.ok(!content.includes('<title>frontend</title>'), 'should not have generic title frontend');
    assert.ok(content.includes('SMART BRAND CAR') || content.includes('اسمارت'), 'should have brand in title');
    assert.ok(content.match(/<title>.{10,}<\/title>/), 'title should be descriptive');
  });

  it('should have meta description', () => {
    const content = fs.readFileSync(path.join(__dirname, '../../frontend/index.html'), 'utf8');
    assert.ok(content.includes('meta name="description"'), 'should have meta description');
    const descMatch = content.match(/meta name="description" content="([^"]+)"/);
    assert.ok(descMatch && descMatch[1].length >= 50, 'description should be at least 50 chars');
  });

  it('should have Open Graph tags', () => {
    const content = fs.readFileSync(path.join(__dirname, '../../frontend/index.html'), 'utf8');
    assert.ok(content.includes('og:title'), 'should have og:title');
    assert.ok(content.includes('og:description'), 'should have og:description');
    assert.ok(content.includes('og:locale') && content.includes('fa_IR'), 'should have fa_IR locale');
  });

  it('should have theme-color and viewport', () => {
    const content = fs.readFileSync(path.join(__dirname, '../../frontend/index.html'), 'utf8');
    assert.ok(content.includes('theme-color'), 'should have theme-color');
    assert.ok(content.includes('viewport'), 'should have viewport');
  });
});
