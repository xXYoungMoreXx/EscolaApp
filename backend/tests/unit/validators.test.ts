import { describe, it, expect, beforeEach } from 'vitest';
import { validateCPF, cpfRegex } from '../../src/shared/validators';

describe('CPF Validation', () => {
  it('should validate correct CPF', () => {
    expect(validateCPF('529.982.247-25')).toBe(true);
    expect(validateCPF('111.444.777-35')).toBe(true);
    expect(validateCPF('123.456.789-09')).toBe(true);
  });

  it('should reject invalid CPF', () => {
    expect(validateCPF('111.111.111-11')).toBe(false);
    expect(validateCPF('222.222.222-22')).toBe(false);
    expect(validateCPF('123.456.789-00')).toBe(false);
    expect(validateCPF('000.000.000-00')).toBe(false);
  });

  it('should reject short CPF', () => {
    expect(validateCPF('123.456.789')).toBe(false);
    expect(validateCPF('12345678901')).toBe(false);
  });

  it('should accept CPF without formatting', () => {
    expect(validateCPF('52998224725')).toBe(true);
  });
});

describe('CPF Regex', () => {
  it('should match formatted CPF', () => {
    expect(cpfRegex.test('529.982.247-25')).toBe(true);
  });

  it('should not match unformatted CPF', () => {
    expect(cpfRegex.test('52998224725')).toBe(false);
  });
});
