import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AccessibilityValidator } from './accessibilityValidator';

describe('AccessibilityValidator', () => {
  let validator: AccessibilityValidator;
  let container: HTMLElement;

  beforeEach(() => {
    validator = new AccessibilityValidator();
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('checkColorContrast', () => {
    it('detects matching text and background colors', () => {
      container.innerHTML = '<p style="color: red; background-color: red;">Test text</p>';
      
      const report = validator.audit(container);
      
      expect(report.issues).toHaveLength(1);
      expect(report.issues[0].rule).toBe('color-contrast');
      expect(report.issues[0].type).toBe('error');
    });

    it('passes when colors are different', () => {
      container.innerHTML = '<p style="color: black; background-color: white;">Test text</p>';
      
      const report = validator.audit(container);
      
      const contrastIssues = report.issues.filter(i => i.rule === 'color-contrast');
      expect(contrastIssues).toHaveLength(0);
    });

    it('ignores elements without text content', () => {
      container.innerHTML = '<p style="color: red; background-color: red;"></p>';
      
      const report = validator.audit(container);
      
      const contrastIssues = report.issues.filter(i => i.rule === 'color-contrast');
      expect(contrastIssues).toHaveLength(0);
    });
  });

  describe('checkKeyboardNavigation', () => {
    it('warns about positive tabindex values', () => {
      container.innerHTML = '<button tabindex="5">Test Button</button>';
      
      const report = validator.audit(container);
      
      const tabIndexIssues = report.issues.filter(i => i.rule === 'keyboard-navigation');
      expect(tabIndexIssues).toHaveLength(1);
      expect(tabIndexIssues[0].type).toBe('warning');
    });

    it('allows tabindex="0" and negative values', () => {
      container.innerHTML = `
        <button tabindex="0">Button 1</button>
        <button tabindex="-1">Button 2</button>
        <button>Button 3</button>
      `;
      
      const report = validator.audit(container);
      
      const tabIndexIssues = report.issues.filter(i => i.rule === 'keyboard-navigation');
      expect(tabIndexIssues).toHaveLength(0);
    });
  });

  describe('checkAriaLabels', () => {
    it('detects buttons without accessible names', () => {
      container.innerHTML = '<button></button>';
      
      const report = validator.audit(container);
      
      const ariaIssues = report.issues.filter(i => i.rule === 'aria-label');
      expect(ariaIssues).toHaveLength(1);
      expect(ariaIssues[0].type).toBe('error');
    });

    it('passes for buttons with text content', () => {
      container.innerHTML = '<button>Click me</button>';
      
      const report = validator.audit(container);
      
      const ariaIssues = report.issues.filter(i => i.rule === 'aria-label');
      expect(ariaIssues).toHaveLength(0);
    });

    it('passes for buttons with aria-label', () => {
      container.innerHTML = '<button aria-label="Close dialog"></button>';
      
      const report = validator.audit(container);
      
      const ariaIssues = report.issues.filter(i => i.rule === 'aria-label');
      expect(ariaIssues).toHaveLength(0);
    });
  });

  describe('checkTouchTargets', () => {
    it('detects small touch targets', () => {
      // Create a button with small dimensions
      const button = document.createElement('button');
      button.style.width = '20px';
      button.style.height = '20px';
      button.textContent = 'Small';
      container.appendChild(button);
      
      const report = validator.audit(container);
      
      const touchTargetIssues = report.issues.filter(i => i.rule === 'touch-target');
      expect(touchTargetIssues).toHaveLength(1);
      expect(touchTargetIssues[0].type).toBe('warning');
    });

    it('passes for adequately sized touch targets', () => {
      const button = document.createElement('button');
      button.style.width = '48px';
      button.style.height = '48px';
      button.textContent = 'Large';
      container.appendChild(button);
      
      const report = validator.audit(container);
      
      const touchTargetIssues = report.issues.filter(i => i.rule === 'touch-target');
      expect(touchTargetIssues).toHaveLength(0);
    });
  });

  describe('scoring', () => {
    it('returns perfect score for no issues', () => {
      container.innerHTML = `
        <button style="width: 48px; height: 48px;">Good Button</button>
        <p style="color: black; background-color: white;">Good text</p>
      `;
      
      const report = validator.audit(container);
      
      expect(report.score).toBe(100);
      expect(report.summary.errors).toBe(0);
      expect(report.summary.warnings).toBe(0);
    });

    it('reduces score based on issues', () => {
      container.innerHTML = `
        <button></button>
        <button tabindex="5">Bad Button</button>
        <p style="color: red; background-color: red;">Bad text</p>
      `;
      
      const report = validator.audit(container);
      
      expect(report.score).toBeLessThan(100);
      expect(report.summary.errors).toBeGreaterThan(0);
      expect(report.summary.warnings).toBeGreaterThan(0);
    });

    it('provides summary of issue types', () => {
      container.innerHTML = `
        <button></button>
        <button tabindex="5">Warning Button</button>
      `;
      
      const report = validator.audit(container);
      
      expect(report.summary.errors).toBe(1); // Missing aria-label
      expect(report.summary.warnings).toBe(1); // Positive tabindex
      expect(report.summary.info).toBe(0);
    });
  });

  describe('comprehensive audit', () => {
    it('runs all checks and provides complete report', () => {
      container.innerHTML = `
        <h1>Main Heading</h1>
        <button aria-label="Close">×</button>
        <button style="width: 48px; height: 48px;">Large Button</button>
        <p style="color: black; background-color: white;">Readable text</p>
        <input type="text" id="name" />
        <label for="name">Name</label>
      `;
      
      const report = validator.audit(container);
      
      expect(report).toHaveProperty('score');
      expect(report).toHaveProperty('issues');
      expect(report).toHaveProperty('passedChecks');
      expect(report).toHaveProperty('summary');
      
      expect(Array.isArray(report.issues)).toBe(true);
      expect(Array.isArray(report.passedChecks)).toBe(true);
      expect(typeof report.score).toBe('number');
      expect(report.score).toBeGreaterThanOrEqual(0);
      expect(report.score).toBeLessThanOrEqual(100);
    });
  });
});