export type WithdrawMethod = 'pix' | 'bank';

export type BankAccountType = 'corrente' | 'poupanca';

export interface BankAccount {
  bankName: string;
  agency: string;
  account: string;
  accountType: BankAccountType;
  holderName: string;
  holderCpf: string;
}

export interface WithdrawPreferences {
  preferredMethod: WithdrawMethod;
  pixKey: string;
  bankAccount: BankAccount | null;
}
