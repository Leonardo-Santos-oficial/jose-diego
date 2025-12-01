import type { CommentGenerator } from './types';

const REACTIONS = [
  'boaaa', 'boa!', 'vamo!', 'isso ai', 'show',
  'top demais', 'kkk', 'kkkk', 'eita', 'uiii',
  'caramba', 'nossa', 'eee', 'aeee', 'vamoo',
  'slk', 'mds', 'pqp', 'kkkkk', 'aehooo',
  'bora', 'dale', 'tmj', 'gg', 'nice',
  'dahora', 'maneiro', 'irado', 'brabo', 'sinistro',
] as const;

const GAME_COMMENTS = [
  'quase peguei 10x agora',
  'perdi de novo kkk',
  'ganhei 50 conto',
  'voou demais',
  'cashout no 2x sempre',
  'segura mais um pouco',
  'deu green',
  'red de novo',
  'valeu a pena',
  'hoje ta pagando bem',
  'ontem perdi tudo kk',
  'recuperei o prejuizo',
  'bora pro proximo',
  'demorou pra cair',
  'caiu rapido demais',
  'esse aviao ta maluco',
  'travou no 1.5 dnv',
  'sai no 3x e foi ate 50',
  'minha estrategia ta funcionando',
  'vou dobrar a aposta',
  'melhor sair cedo',
  'quem saiu no 2x se deu bem',
  'ta dificil hoje',
  'ontem tava melhor',
  'esse jogo vicia',
  'mais uma rodada',
  'ultima do dia kk',
  'mentira mais uma',
  'deposito mais 50',
  'saquei 200 agora',
  'comecei com 20 to com 150',
  'perdi 100 em 5 min',
  'paciencia é tudo',
  'errei o timing',
  'tava certinho pra sair',
  'sorte demais',
  'azar total',
  'nao acredito que caiu',
  'foi ate quanto?',
  'pegou 100x agora',
  'vi alguem pegar 500x',
  'meu maior foi 25x',
  'sempre saio cedo demais',
  'medo de perder tudo',
  'sem medo de ser feliz',
] as const;

const QUESTIONS = [
  'alguem sabe o horario bom?',
  'ta dando crash sempre?',
  'qual estrategia voces usam?',
  'cashout automatico vale a pena?',
  'alguem ai ganhou hoje?',
  'qual o minimo pra apostar?',
  'da pra sacar rapido?',
  'quanto voces apostam por vez?',
  'melhor sair no 2x ou arriscar?',
  'alguem usa bot?',
  'como funciona o auto?',
  'tem limite de saque?',
  'qual a maior vela do dia?',
  'alguem ta lucrando?',
  'como faz pra ganhar sempre?',
  'serio que caiu no 1.0?',
  'pq travou?',
] as const;

const CELEBRATION = [
  'conseguiii',
  'finalmente',
  'era o que eu precisava',
  'melhor jogo',
  'viciei nisso kkk',
  'to no lucro',
  'melhor dia da semana',
  'agora vai',
  'nao acredito',
  'sonho realizado',
  'obrigado aviator',
  'hoje é meu dia',
  'sorte ta do meu lado',
  'recuperei tudo',
  'dobrei a banca',
  'tripliquei',
  'nunca duvidei kkk',
  'to chorando aqui',
  'vou comprar um lanche',
  'cerveja garantida',
] as const;

const FRUSTRATION = [
  'nao é possivel',
  'sempre eu',
  'pq comigo',
  'desisto',
  'vou parar por hoje',
  'perdi tudo dnv',
  'esse jogo é roubado',
  'impossivel ganhar',
  'to sem sorte',
  'amanha eu volto',
  'preciso de uma pausa',
  'minha banca foi embora',
  'f',
  'rip banca',
  'era pra ter saido',
] as const;

const GREETINGS = [
  'salve galera',
  'boa noite a todos',
  'cheguei agora',
  'voltei',
  'opa',
  'eae pessoal',
  'fala galera',
  'bom dia',
  'boa tarde',
  'tmj familia',
] as const;

export class AviatorCommentGenerator implements CommentGenerator {
  private readonly allComments: readonly string[];

  constructor() {
    this.allComments = [
      ...REACTIONS,
      ...GAME_COMMENTS,
      ...QUESTIONS,
      ...CELEBRATION,
      ...FRUSTRATION,
      ...GREETINGS,
    ];
  }

  generate(): string {
    return this.pickRandom(this.allComments);
  }

  private pickRandom<T>(array: readonly T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }
}
