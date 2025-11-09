import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Import step components
import OnboardingStep1 from '@/components/Onboarding/Step1Welcome';
import OnboardingStep2 from '@/components/Onboarding/Step2Profile';
import OnboardingStep3 from '@/components/Onboarding/Step3Income';
import OnboardingStep4 from '@/components/Onboarding/Step4Banks';
import OnboardingStep5 from '@/components/Onboarding/Step5Categories';
import OnboardingStep6 from '@/components/Onboarding/Step6Style';
import OnboardingStep7 from '@/components/Onboarding/Step7Summary';

const TOTAL_STEPS = 7;

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [onboardingData, setOnboardingData] = useState({
    nome_completo: user?.user_metadata?.full_name || '',
    data_nascimento: '',
    pais: 'Brasil',
    moeda_principal: 'BRL',
    renda_mensal: 0,
    tipo_profissao: 'Empregado',
    eh_freelancer: false,
    renda_minima: 0,
    renda_maxima: 0,
    tipo_renda_compartilhada: 'nenhuma',
    renda_total_compartilhada: 0,
    sua_parte_percentual: 100,
    contas: [{
      nome_banco: 'Nubank',
      tipo_conta: 'corrente',
      saldo_atual: 0,
      finalidade: 'salario',
      agencia: '',
      numero_conta: ''
    }],
    categorias_selecionadas: [
      'Alimentação', 'Transporte', 'Moradia', 'Diversão', 'Saúde/Beleza', 'Roupas/Acessórios'
    ],
    estilo_usuario: 'balanceado'
  });

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!user) return;

      try {
        const { data } = await supabase
          .from('configuracao_onboarding')
          .select('onboarding_completo')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data?.onboarding_completo) {
          navigate('/dashboard');
        }
      } catch (error) {
        console.log('Primeiro acesso - iniciando onboarding');
      }
    };

    checkOnboarding();
  }, [user, navigate]);

  // Sincronizar dados em tempo real (sem avançar step)
  const handleDataChange = (stepData: any) => {
    setOnboardingData(prev => ({ ...prev, ...stepData }));
  };

  // Navegar para próximo step (apenas quando botão é clicado)
  const handleNextStep = async () => {
    if (!validateStep(step, onboardingData)) {
      toast({
        variant: "destructive",
        title: "Erro de Validação",
        description: "Preencha todos os campos obrigatórios"
      });
      return;
    }

    if (step === TOTAL_STEPS) {
      await saveOnboardingData(onboardingData);
    } else {
      setStep(step + 1);
    }
  };

  const handlePreviousStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const validateStep = (currentStep: number, data: any) => {
    console.log(`🔍 Validando step ${currentStep}:`, data);
    
    switch (currentStep) {
      case 2: // Perfil
        const nomeValido = data.nome_completo && data.nome_completo.trim().length >= 3;
        const paisValido = data.pais && data.pais.trim().length > 0;
        console.log(`✅ Step 2: nome="${data.nome_completo}" (${data.nome_completo?.length || 0} chars), país="${data.pais}"`);
        console.log(`   → Validação: nome=${nomeValido}, país=${paisValido}`);
        return nomeValido && paisValido;
        
      case 3: // Renda
        const rendaValida = data.renda_mensal && parseFloat(data.renda_mensal) > 0;
        const profissaoValida = data.tipo_profissao && data.tipo_profissao.trim().length > 0;
        console.log(`✅ Step 3: renda=${rendaValida}, profissão=${profissaoValida}`);
        return rendaValida && profissaoValida;
        
      case 4: // Contas
        const contasValidas = data.contas && data.contas.length > 0 && 
                             data.contas.every((c: any) => 
                               c.nome_banco && 
                               c.tipo_conta && 
                               typeof parseFloat(c.saldo_atual) === 'number'
                             );
        console.log(`✅ Step 4: contas válidas=${contasValidas}`, data.contas);
        return contasValidas;
        
      case 5: // Categorias
        const categoriasValidas = data.categorias_selecionadas && data.categorias_selecionadas.length > 0;
        console.log(`✅ Step 5: categorias válidas=${categoriasValidas}`);
        return categoriasValidas;
        
      case 6: // Estilo
        const estiloValido = data.estilo_usuario && 
                            ['controlador', 'balanceado', 'organizador'].includes(data.estilo_usuario);
        console.log(`✅ Step 6: estilo válido=${estiloValido}`);
        return estiloValido;
        
      case 7: // Summary
        return true;
        
      default:
        return true;
    }
  };

  const saveOnboardingData = async (data: any) => {
    if (!user) return;

    setLoading(true);

    try {
      // 1. Update users table
      await supabase
        .from('users')
        .update({
          nome_completo: data.nome_completo,
          data_nascimento: data.data_nascimento || null,
          pais: data.pais,
          email_verificado: true
        })
        .eq('id', user.id);

      // 2. Create/Update configuracao_usuario
      const { data: configExist } = await supabase
        .from('configuracao_usuario')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const configData = {
        renda_mensal: data.renda_mensal,
        moeda_principal: data.moeda_principal,
        tipo_profissao: data.tipo_profissao,
        eh_freelancer: data.eh_freelancer,
        renda_minima_freelancer: data.renda_minima,
        renda_maxima_freelancer: data.renda_maxima,
        estilo_usuario: data.estilo_usuario,
        quer_alertas: data.estilo_usuario === 'controlador',
        tone_ia: data.estilo_usuario === 'controlador' ? 'agressivo' : 
                 data.estilo_usuario === 'organizador' ? 'neutro' : 'amigavel'
      };

      if (configExist) {
        await supabase
          .from('configuracao_usuario')
          .update(configData)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('configuracao_usuario')
          .insert({ user_id: user.id, ...configData });
      }

      // 3. Create/Update configuracao_saldo_usuario
      await supabase
        .from('configuracao_saldo_usuario')
        .upsert({
          user_id: user.id,
          renda_mensal: data.renda_mensal,
          percentual_limite_verde: 30.0,
          percentual_limite_amarelo: 10.0,
          percentual_limite_vermelho: 5.0
        });

      // 4. Create renda_compartilhada if needed
      if (data.tipo_renda_compartilhada !== 'nenhuma') {
        const { data: rendaCompartilhada } = await supabase
          .from('renda_compartilhada')
          .insert({
            nome_grupo: data.tipo_renda_compartilhada === 'conjuge' ? 'Renda do Casal' : 'Renda Compartilhada',
            tipo: data.tipo_renda_compartilhada === 'conjuge' ? 'casal' : 'roommates',
            renda_total: data.renda_total_compartilhada,
            criado_por: user.id
          })
          .select()
          .single();

        if (rendaCompartilhada) {
          await supabase
            .from('renda_compartilhada_membros')
            .insert({
              renda_compartilhada_id: rendaCompartilhada.id,
              user_id: user.id,
              percentual_renda: data.sua_parte_percentual,
              valor_renda: (data.renda_total_compartilhada * data.sua_parte_percentual) / 100,
              confirmado: true
            });
        }
      }

      // 5. Insert bank accounts
      for (const conta of data.contas) {
        await supabase
          .from('bancos_contas')
          .insert({
            user_id: user.id,
            nome_banco: conta.nome_banco,
            tipo_conta: conta.tipo_conta,
            saldo_atual: conta.saldo_atual,
            finalidade: conta.finalidade,
            agencia: conta.agencia || null,
            numero_conta: conta.numero_conta || null,
            principal: data.contas.indexOf(conta) === 0
          });
      }

      // 6. Create financial month
      const hoje = new Date();
      const mes = hoje.getMonth() + 1;
      const ano = hoje.getFullYear();
      const saldoTotal = data.contas.reduce((sum: number, c: any) => sum + c.saldo_atual, 0);

      await supabase
        .from('meses_financeiros')
        .insert({
          user_id: user.id,
          mes: mes,
          ano: ano,
          status: 'aberto',
          saldo_inicial: saldoTotal
        });

      // 7. Insert categories
      const categoriaMap: Record<string, any> = {
        'Alimentação': { nome: 'Alimentação', icone: '🍕', cor: '#ef4444', tipo: 'variavel' },
        'Transporte': { nome: 'Transporte', icone: '🚗', cor: '#f59e0b', tipo: 'variavel' },
        'Moradia': { nome: 'Moradia', icone: '🏠', cor: '#8b5cf6', tipo: 'fixa' },
        'Diversão': { nome: 'Diversão', icone: '🎮', cor: '#06b6d4', tipo: 'variavel' },
        'Saúde/Beleza': { nome: 'Saúde/Beleza', icone: '💆', cor: '#10b981', tipo: 'variavel' },
        'Roupas/Acessórios': { nome: 'Roupas/Acessórios', icone: '👗', cor: '#ec4899', tipo: 'variavel' },
        'Educação': { nome: 'Educação', icone: '📚', cor: '#3b82f6', tipo: 'variavel' },
        'Setup/Equipamentos': { nome: 'Setup/Equipamentos', icone: '💻', cor: '#1f2937', tipo: 'variavel' },
        'Emergência': { nome: 'Emergência', icone: '🛡️', cor: '#dc2626', tipo: 'variavel' },
        'Outro': { nome: 'Outro', icone: '❓', cor: '#6b7280', tipo: 'variavel' }
      };

      const categoriasData = data.categorias_selecionadas.map((cat: string) => ({
        user_id: user.id,
        ...categoriaMap[cat],
        padrao: true
      }));

      if (!categoriasData.find((c: any) => c.nome === 'Emergência')) {
        categoriasData.push({
          user_id: user.id,
          nome: 'Emergência',
          icone: '🛡️',
          cor: '#dc2626',
          tipo: 'variavel',
          padrao: true
        });
      }

      await supabase
        .from('categorias_saidas')
        .insert(categoriasData);

      // 8. Mark onboarding as complete
      await supabase
        .from('configuracao_onboarding')
        .upsert({
          user_id: user.id,
          onboarding_completo: true,
          data_conclusao: new Date().toISOString()
        });

      toast({
        title: "Sucesso!",
        description: "Seu perfil foi configurado com sucesso",
      });

      setLoading(false);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Erro ao salvar onboarding:', error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error.message
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-foreground">
              Passo {step} de {TOTAL_STEPS}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round((step / TOTAL_STEPS) * 100)}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Components */}
        <div className="bg-card rounded-lg shadow-lg p-8">
          {step === 1 && <OnboardingStep1 onNext={() => handleNextStep()} />}
          {step === 2 && <OnboardingStep2 data={onboardingData} onDataChange={handleDataChange} />}
          {step === 3 && <OnboardingStep3 data={onboardingData} onDataChange={handleDataChange} />}
          {step === 4 && <OnboardingStep4 data={onboardingData} onDataChange={handleDataChange} />}
          {step === 5 && <OnboardingStep5 data={onboardingData} onDataChange={handleDataChange} />}
          {step === 6 && <OnboardingStep6 data={onboardingData} onDataChange={handleDataChange} />}
          {step === 7 && <OnboardingStep7 data={onboardingData} onNext={() => handleNextStep()} loading={loading} />}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 gap-4">
            <button
              onClick={handlePreviousStep}
              disabled={step === 1 || loading}
              className="px-6 py-2 border border-border rounded-lg text-foreground hover:bg-muted disabled:opacity-50 font-medium transition-colors"
            >
              ← Voltar
            </button>
            <button
              onClick={() => handleNextStep()}
              disabled={loading}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 font-medium transition-colors"
            >
              {loading ? 'Processando...' : step === TOTAL_STEPS ? 'Completar' : 'Próximo →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
