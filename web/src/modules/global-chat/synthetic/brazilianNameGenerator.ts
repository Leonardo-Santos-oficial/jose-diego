import type { NameGenerator } from './types';

const FIRST_NAMES = [
  'Lucas', 'Pedro', 'Mateus', 'Gabriel', 'Rafael',
  'Bruno', 'Felipe', 'Thiago', 'Gustavo', 'André',
  'Ana', 'Julia', 'Maria', 'Fernanda', 'Carolina',
  'Beatriz', 'Amanda', 'Larissa', 'Camila', 'Priscila',
  'Diego', 'Marcos', 'Leandro', 'Rodrigo', 'Caio',
  'Renan', 'Victor', 'Eduardo', 'Henrique', 'Danilo',
] as const;

const SUFFIXES = [
  '', '_oficial', '_joga', '_bet', '_vip', '_pro',
  '123', '321', '_gamer', '_real', '2024', '01', '99',
  '_win', '', '', '', '', '',
] as const;

export class BrazilianNameGenerator implements NameGenerator {
  generate(): string {
    const firstName = this.pickRandom(FIRST_NAMES);
    const suffix = this.pickRandom(SUFFIXES);
    return `${firstName}${suffix}`;
  }

  private pickRandom<T>(array: readonly T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }
}
