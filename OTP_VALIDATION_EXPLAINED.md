# 🔐 Como Funciona a Validação do Código OTP

## ✅ Validação Automática pelo Supabase

O sistema **não precisa validar manualmente** o código OTP. A validação é feita automaticamente pelo **Supabase** através do método `verifyOtp()`.

## 📋 Fluxo de Validação

### 1. Usuário digita o código (6 dígitos)
```typescript
// Em VerifyEmail.tsx - linha 74-78
const { data, error } = await supabase.auth.verifyOtp({
  email,        // Email do usuário
  token: otp,   // Código de 6 dígitos digitado
  type: 'email' // Tipo: confirmação de email
});
```

### 2. Supabase valida no servidor
O Supabase verifica automaticamente:
- ✅ Se o código está correto
- ✅ Se o código não expirou (padrão: 1 hora)
- ✅ Se o código pertence ao email correto
- ✅ Se o código já foi usado (códigos são de uso único)

### 3. Resposta do Supabase

**Se o código estiver CORRETO:**
```typescript
{
  data: {
    session: Session,  // Sessão criada automaticamente
    user: User         // Usuário autenticado
  },
  error: null
}
```

**Se o código estiver INCORRETO ou EXPIRADO:**
```typescript
{
  data: null,
  error: {
    message: "Token has expired" // ou "Invalid token"
  }
}
```

## 🔍 Validações que o Supabase faz automaticamente

1. **Código correto**: Compara o código enviado com o código gerado
2. **Código não expirado**: Verifica se ainda está dentro do tempo de validade
3. **Código não usado**: Códigos são de uso único (one-time password)
4. **Email correto**: Verifica se o código pertence ao email informado
5. **Tipo correto**: Verifica se o código é do tipo 'email' (signup)

## 💻 Código Atual (Já Implementado)

```typescript
// src/pages/VerifyEmail.tsx - linha 56-89
const handleVerify = async () => {
  // 1. Validação básica (frontend)
  if (!otp || otp.length !== 6) {
    return; // Não envia se não tiver 6 dígitos
  }

  if (!email) {
    // Redireciona se não tiver email
    navigate('/signup');
    return;
  }

  setLoading(true);

  try {
    // 2. Validação pelo Supabase (servidor)
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email'
    });

    // 3. Tratamento de erro
    if (error) {
      // Código inválido, expirado ou já usado
      toast({
        variant: "destructive",
        title: "Código inválido",
        description: error.message
      });
      setOtp(""); // Limpa para tentar novamente
      return;
    }

    // 4. Código válido - criar sessão
    if (data.session && data.user) {
      // Usuário autenticado com sucesso!
      // Redireciona para onboarding ou dashboard
    }
  } catch (error) {
    // Erro de rede ou outro erro
    console.error('Erro ao verificar OTP:', error);
  }
};
```

## 🎯 O que acontece quando o código é válido?

1. ✅ Supabase cria uma sessão automaticamente
2. ✅ Usuário fica autenticado
3. ✅ `email_confirmed_at` é atualizado no banco
4. ✅ Sistema redireciona para onboarding ou dashboard

## 🚫 O que acontece quando o código é inválido?

1. ❌ Supabase retorna erro
2. ❌ Nenhuma sessão é criada
3. ❌ Usuário permanece não autenticado
4. ❌ Sistema mostra mensagem de erro
5. ❌ Campo OTP é limpo para nova tentativa

## 🔄 Reenvio de Código

Se o código expirar ou o usuário não receber, ele pode solicitar um novo:

```typescript
// src/pages/VerifyEmail.tsx - linha 130-155
const handleResend = async () => {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email
  });
  
  // Novo código é enviado por email
  // Código anterior fica inválido
};
```

## 📊 Segurança

- ✅ Códigos são gerados aleatoriamente pelo Supabase
- ✅ Códigos expiram automaticamente (1 hora)
- ✅ Códigos são de uso único
- ✅ Validação acontece no servidor (não pode ser burlado)
- ✅ Rate limiting automático (evita spam)

## ✨ Resumo

**Você não precisa fazer nada!** O Supabase já faz toda a validação:
- ✅ Verifica se o código está correto
- ✅ Verifica se não expirou
- ✅ Verifica se não foi usado
- ✅ Cria a sessão automaticamente se válido
- ✅ Retorna erro se inválido

O código atual já está **100% funcional** e seguro! 🎉

