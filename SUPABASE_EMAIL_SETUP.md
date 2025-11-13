# 📧 Configuração de Email OTP no Supabase

## Passo a Passo para Configurar o Template de Email com Código OTP

### 1. Acesse o Dashboard do Supabase

1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Faça login e selecione seu projeto

### 2. Navegue até Authentication → Email Templates

1. No menu lateral esquerdo, clique em **"Authentication"**
2. Clique na aba **"Email Templates"**
3. Selecione o template **"Confirm signup"**

### 3. Configure o Template para OTP

Substitua o conteúdo do template pelo seguinte:

**Subject (Assunto):**
```
Confirme seu cadastro no FinanceTrack
```

**Body (Corpo do Email):**
```html
<h2>Bem-vindo ao FinanceTrack! 🎉</h2>

<p>Obrigado por se cadastrar! Para confirmar sua conta, use o código abaixo:</p>

<div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
  <h1 style="font-size: 32px; letter-spacing: 8px; color: #1f2937; margin: 0; font-family: monospace;">
    {{ .Token }}
  </h1>
</div>

<p style="color: #6b7280; font-size: 14px;">
  Este código expira em 1 hora. Se você não solicitou este código, pode ignorar este email.
</p>

<p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
  Ou clique no link abaixo para confirmar:
</p>
<p><a href="{{ .ConfirmationURL }}" style="color: #3b82f6; text-decoration: underline;">Confirmar meu email</a></p>

<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />

<p style="color: #9ca3af; font-size: 12px;">
  Se você não criou uma conta no FinanceTrack, pode ignorar este email com segurança.
</p>
```

### 4. Variáveis Disponíveis no Template

- `{{ .Token }}` - O código OTP de 6 dígitos
- `{{ .ConfirmationURL }}` - Link de confirmação (fallback)
- `{{ .Email }}` - Email do usuário
- `{{ .SiteURL }}` - URL do seu site

### 5. Configurações Adicionais

#### Authentication → Settings → Email Auth

1. **Enable email confirmations**: ✅ ON
2. **Secure email change**: ✅ ON (recomendado)
3. **Email OTP expiry**: `3600` (1 hora em segundos)

#### Authentication → URL Configuration

1. **Site URL**: Sua URL de produção (ex: `https://seusite.com`)
2. **Redirect URLs**: Adicione:
   - `http://localhost:8081/auth/callback` (desenvolvimento)
   - `https://seusite.com/auth/callback` (produção)

### 6. Template Alternativo (Mais Simples)

Se preferir um template mais simples:

```html
<h2>Confirme seu cadastro</h2>

<p>Seu código de verificação é:</p>

<h1 style="font-size: 36px; letter-spacing: 10px; text-align: center; color: #1f2937;">
  {{ .Token }}
</h1>

<p>Digite este código na página de verificação para confirmar sua conta.</p>

<p><small>Este código expira em 1 hora.</small></p>
```

### 7. Testando

1. Salve o template
2. Faça um cadastro de teste
3. Verifique se o email chega com o código OTP
4. Teste a verificação na aplicação

## ⚠️ Importante

- O código OTP (`{{ .Token }}`) só aparece quando o Supabase está configurado para enviar OTP
- Se você ainda estiver vendo o link `{{ .ConfirmationURL }}` literal, verifique se:
  - O template está salvo corretamente
  - A configuração de email está ativa
  - O tipo de confirmação está como "OTP" ou "Email"

## 🔧 Troubleshooting

**Problema**: Email ainda mostra `{{ .Token }}` literal
**Solução**: Verifique se o template foi salvo e se há cache. Tente fazer um novo cadastro.

**Problema**: Código não chega
**Solução**: 
- Verifique a pasta de spam
- Confirme que o email está correto
- Verifique os logs do Supabase em Authentication → Logs

**Problema**: Código expira muito rápido
**Solução**: Ajuste o "Email OTP expiry" nas configurações (padrão é 3600 segundos = 1 hora)

