'use client';

import { useState, useActionState, useCallback } from 'react';
import { useFormStatus } from 'react-dom';
import { updateProfileAction } from '@/app/actions/profile';
import { createInitialProfileActionState } from '@/app/actions/profile-state';
import { Input } from '@/components/components/ui/input';
import { Label } from '@/components/components/ui/label';
import { Button } from '@/components/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/components/ui/card';
import { cn } from '@/components/lib/utils';
import { User, CreditCard, Building2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { AvatarUpload } from './AvatarUpload';
import { useAvatarUpload } from '@/hooks/useAvatarUpload';
import type { BankAccount, BankAccountType, WithdrawMethod } from '@/modules/profile/types';

interface ProfileFormProps {
  userId: string;
  initialDisplayName: string;
  initialPixKey: string;
  initialPreferredMethod: WithdrawMethod;
  initialBankAccount: BankAccount | null;
  initialAvatarUrl: string | null;
  userEmail: string;
}

type WithdrawTab = 'pix' | 'bank';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button 
      type="submit" 
      className="w-full bg-gradient-to-r from-[#E31C58] to-[#FF6B6B] hover:from-[#FF6B6B] hover:to-[#E31C58] text-white font-semibold py-3 rounded-lg transition-all duration-300"
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Salvando...
        </>
      ) : (
        'Salvar Alterações'
      )}
    </Button>
  );
}

export function ProfileForm({ 
  userId,
  initialDisplayName, 
  initialPixKey, 
  initialPreferredMethod,
  initialBankAccount,
  initialAvatarUrl,
  userEmail
}: ProfileFormProps) {
  const [state, formAction] = useActionState(updateProfileAction, createInitialProfileActionState());
  
  // Avatar upload
  const { state: avatarState, upload: uploadAvatar } = useAvatarUpload(userId);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  
  const handleAvatarSelect = useCallback(async (file: File) => {
    const result = await uploadAvatar(file);
    if (result) {
      setAvatarUrl(result.url);
    }
  }, [uploadAvatar]);
  
  // Determine initial tab based on preferred method
  const [withdrawTab, setWithdrawTab] = useState<WithdrawTab>(initialPreferredMethod === 'bank' ? 'bank' : 'pix');
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [pixKey, setPixKey] = useState(initialPixKey);
  
  // Bank account fields
  const [bankName, setBankName] = useState(initialBankAccount?.bankName ?? '');
  const [bankAgency, setBankAgency] = useState(initialBankAccount?.agency ?? '');
  const [bankAccount, setBankAccount] = useState(initialBankAccount?.account ?? '');
  const [bankAccountType, setBankAccountType] = useState<BankAccountType>(initialBankAccount?.accountType ?? 'corrente');
  const [bankHolderName, setBankHolderName] = useState(initialBankAccount?.holderName ?? '');
  const [bankHolderCpf, setBankHolderCpf] = useState(initialBankAccount?.holderCpf ?? '');

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {state.status === 'success' && (
        <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
          <p className="text-green-400 text-sm">{state.message}</p>
        </div>
      )}
      
      {state.status === 'error' && state.message && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-400 text-sm">{state.message}</p>
        </div>
      )}

      <form action={formAction} className="space-y-6">
        {/* Hidden field for preferred method */}
        <input type="hidden" name="preferredWithdrawMethod" value={withdrawTab} />
        {avatarUrl && <input type="hidden" name="avatarUrl" value={avatarUrl} />}

        {/* Profile Card */}
        <Card className="bg-[#1E1E24]/80 backdrop-blur-sm border-[#2A2A32] shadow-xl">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <AvatarUpload
                currentAvatarUrl={avatarUrl}
                displayName={displayName}
                isUploading={avatarState.status === 'uploading'}
                onFileSelect={handleAvatarSelect}
                error={avatarState.error}
                size="lg"
              />
              <div className="text-center sm:text-left">
                <CardTitle className="text-xl text-white">Informações Pessoais</CardTitle>
                <CardDescription className="text-gray-400">
                  {userEmail}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-gray-300 flex items-center gap-2">
                <User className="w-4 h-4 text-[#E31C58]" />
                Nome de Exibição
              </Label>
              <Input
                id="displayName"
                name="displayName"
                type="text"
                value={displayName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDisplayName(e.target.value)}
                placeholder="Seu nome de exibição"
                className="bg-[#12121A] border-[#2A2A32] text-white placeholder:text-gray-500 focus:border-[#E31C58] focus:ring-[#E31C58]/20"
              />
            </div>
          </CardContent>
        </Card>

        {/* Withdrawal Method Card */}
        <Card className="bg-[#1E1E24]/80 backdrop-blur-sm border-[#2A2A32] shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#E31C58]" />
              Método de Saque
            </CardTitle>
            <CardDescription className="text-gray-400">
              Escolha como deseja receber seus saques
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tab Navigation */}
            <div className="flex bg-[#12121A] rounded-lg p-1 gap-1">
              <button
                type="button"
                onClick={() => setWithdrawTab('pix')}
                className={cn(
                  "flex-1 py-3 px-4 min-h-[44px] rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2",
                  withdrawTab === 'pix'
                    ? "bg-gradient-to-r from-[#E31C58] to-[#FF6B6B] text-white shadow-lg"
                    : "text-gray-400 hover:text-white hover:bg-[#2A2A32]"
                )}
              >
                <CreditCard className="w-4 h-4" />
                Pix
              </button>
              <button
                type="button"
                onClick={() => setWithdrawTab('bank')}
                className={cn(
                  "flex-1 py-3 px-4 min-h-[44px] rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2",
                  withdrawTab === 'bank'
                    ? "bg-gradient-to-r from-[#E31C58] to-[#FF6B6B] text-white shadow-lg"
                    : "text-gray-400 hover:text-white hover:bg-[#2A2A32]"
                )}
              >
                <Building2 className="w-4 h-4" />
                Conta Bancária
              </button>
            </div>

            {/* Pix Tab Content */}
            {withdrawTab === 'pix' && (
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="pixKey" className="text-gray-300 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#E31C58]" />
                    Chave Pix
                  </Label>
                  <Input
                    id="pixKey"
                    name="pixKey"
                    type="text"
                    value={pixKey}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPixKey(e.target.value)}
                    placeholder="CPF, Email, Telefone ou Chave Aleatória"
                    className="bg-[#12121A] border-[#2A2A32] text-white placeholder:text-gray-500 focus:border-[#E31C58] focus:ring-[#E31C58]/20"
                  />
                  <p className="text-xs text-gray-500">
                    Insira sua chave Pix para receber saques instantâneos
                  </p>
                </div>
              </div>
            )}

            {/* Bank Tab Content */}
            {withdrawTab === 'bank' && (
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="bankName" className="text-gray-300 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#E31C58]" />
                    Nome do Banco
                  </Label>
                  <Input
                    id="bankName"
                    name="bankName"
                    type="text"
                    value={bankName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBankName(e.target.value)}
                    placeholder="Ex: Banco do Brasil, Itaú, Nubank..."
                    className="bg-[#12121A] border-[#2A2A32] text-white placeholder:text-gray-500 focus:border-[#E31C58] focus:ring-[#E31C58]/20"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankAgency" className="text-gray-300">
                      Agência
                    </Label>
                    <Input
                      id="bankAgency"
                      name="bankAgency"
                      type="text"
                      value={bankAgency}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBankAgency(e.target.value)}
                      placeholder="0000"
                      className="bg-[#12121A] border-[#2A2A32] text-white placeholder:text-gray-500 focus:border-[#E31C58] focus:ring-[#E31C58]/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bankAccount" className="text-gray-300">
                      Número da Conta
                    </Label>
                    <Input
                      id="bankAccountField"
                      name="bankAccount"
                      type="text"
                      value={bankAccount}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBankAccount(e.target.value)}
                      placeholder="00000-0"
                      className="bg-[#12121A] border-[#2A2A32] text-white placeholder:text-gray-500 focus:border-[#E31C58] focus:ring-[#E31C58]/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Tipo de Conta</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer min-h-[44px] px-3 py-2 rounded-lg hover:bg-[#2A2A32]/50 transition-colors">
                      <input
                        type="radio"
                        name="bankAccountType"
                        value="corrente"
                        checked={bankAccountType === 'corrente'}
                        onChange={() => setBankAccountType('corrente')}
                        className="w-4 h-4 text-[#E31C58] bg-[#12121A] border-[#2A2A32] focus:ring-[#E31C58]/20"
                      />
                      <span className="text-gray-300 text-sm">Corrente</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer min-h-[44px] px-3 py-2 rounded-lg hover:bg-[#2A2A32]/50 transition-colors">
                      <input
                        type="radio"
                        name="bankAccountType"
                        value="poupanca"
                        checked={bankAccountType === 'poupanca'}
                        onChange={() => setBankAccountType('poupanca')}
                        className="w-4 h-4 text-[#E31C58] bg-[#12121A] border-[#2A2A32] focus:ring-[#E31C58]/20"
                      />
                      <span className="text-gray-300 text-sm">Poupança</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankHolderName" className="text-gray-300">
                      Nome do Titular
                    </Label>
                    <Input
                      id="bankHolderName"
                      name="bankHolderName"
                      type="text"
                      value={bankHolderName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBankHolderName(e.target.value)}
                      placeholder="Nome completo"
                      className="bg-[#12121A] border-[#2A2A32] text-white placeholder:text-gray-500 focus:border-[#E31C58] focus:ring-[#E31C58]/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bankHolderCpf" className="text-gray-300">
                      CPF do Titular
                    </Label>
                    <Input
                      id="bankHolderCpf"
                      name="bankHolderCpf"
                      type="text"
                      value={bankHolderCpf}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBankHolderCpf(e.target.value)}
                      placeholder="000.000.000-00"
                      className="bg-[#12121A] border-[#2A2A32] text-white placeholder:text-gray-500 focus:border-[#E31C58] focus:ring-[#E31C58]/20"
                    />
                  </div>
                </div>

                <p className="text-xs text-gray-500">
                  O saque será enviado via TED/DOC para sua conta bancária
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <SubmitButton />
      </form>
    </div>
  );
}
