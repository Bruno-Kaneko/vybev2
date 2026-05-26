// Sanity check de constantes — pega caso alguém mude valores acidentalmente

import { Spacing, Radius, CHAT_LIFETIME_MS } from '@/constants';

describe('Spacing', () => {
  it('tem todos os tamanhos esperados', () => {
    expect(Spacing.xs).toBe(4);
    expect(Spacing.sm).toBe(8);
    expect(Spacing.md).toBe(12);
    expect(Spacing.lg).toBe(16);
    expect(Spacing.xl).toBe(20);
  });

  it('valores crescem monotonicamente', () => {
    expect(Spacing.xs).toBeLessThan(Spacing.sm);
    expect(Spacing.sm).toBeLessThan(Spacing.md);
    expect(Spacing.md).toBeLessThan(Spacing.lg);
    expect(Spacing.lg).toBeLessThan(Spacing.xl);
  });
});

describe('Radius', () => {
  it('full é o valor maior (gera círculo)', () => {
    expect(Radius.full).toBe(999);
  });
});

describe('CHAT_LIFETIME_MS', () => {
  it('é 8 horas em milissegundos', () => {
    expect(CHAT_LIFETIME_MS).toBe(8 * 60 * 60 * 1000);
  });
});
