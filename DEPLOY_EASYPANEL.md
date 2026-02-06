# Guia de Deploy no Easypanel

Este guia explica como fazer o deploy da aplicação FinanceRTrack no Easypanel usando Docker.

## Pré-requisitos

- Conta no Easypanel
- Repositório Git configurado (GitHub, GitLab, etc.)
- Variáveis de ambiente do Supabase configuradas

## Configuração no Easypanel

### 1. Criar um novo App

1. Acesse o Easypanel
2. Clique em "New App"
3. Selecione "Dockerfile" como método de build

### 2. Configurar o Repositório

1. Conecte seu repositório Git
2. Selecione o branch principal (geralmente `main` ou `master`)
3. O Easypanel detectará automaticamente o `Dockerfile` na raiz do projeto

### 3. Configurar Variáveis de Ambiente

No Easypanel, adicione as seguintes variáveis de ambiente como **Build Arguments**:

```
VITE_SUPABASE_URL=https://leuvmcmhnzxczbilfwhy.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxldXZtY21obnp4Y3piaWxmd2h5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MzU2ODgsImV4cCI6MjA3ODIxMTY4OH0.4uxleizyG-8V0aLLR2MGGZmNUHLK2XJZUMXpsAIp16Y
```

**Importante**: No Easypanel, essas variáveis devem ser configuradas como **Build Arguments** (não como variáveis de ambiente de runtime), pois são incorporadas durante o build do Vite.

### 4. Configurar Porta

- **Porta do Container**: `80` (porta padrão do nginx)
- O Easypanel mapeará automaticamente para uma porta externa

### 5. Configurar Domínio (Opcional)

1. Vá em "Domains" no painel do app
2. Adicione seu domínio personalizado
3. Configure o DNS conforme as instruções do Easypanel

## Estrutura dos Arquivos Docker

### Dockerfile
- **Stage 1 (builder)**: Instala dependências e faz o build da aplicação React/Vite
- **Stage 2 (nginx)**: Serve os arquivos estáticos usando nginx

### nginx.conf
- Configuração otimizada para SPA (Single Page Application)
- Suporte a gzip compression
- Cache para arquivos estáticos
- Headers de segurança

### .dockerignore
- Exclui arquivos desnecessários do build context
- Reduz o tamanho da imagem e acelera o build

## Build Local (Teste)

Para testar o build localmente antes de fazer deploy:

```bash
# Build da imagem
docker build \
  --build-arg VITE_SUPABASE_URL=https://leuvmcmhnzxczbilfwhy.supabase.co \
  --build-arg VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxldXZtY21obnp4Y3piaWxmd2h5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MzU2ODgsImV4cCI6MjA3ODIxMTY4OH0.4uxleizyG-8V0aLLR2MGGZmNUHLK2XJZUMXpsAIp16Y \
  -t financertrack:latest .

# Executar o container
docker run -p 8080:80 financertrack:latest

# Acessar em http://localhost:8080
```

## Troubleshooting

### Build falha com erro de variáveis de ambiente
- Certifique-se de que as variáveis estão configuradas como **Build Arguments** no Easypanel
- Verifique se os valores estão corretos e sem espaços extras

### Aplicação não carrega após o deploy
- Verifique os logs do container no Easypanel
- Confirme que a porta está configurada como `80`
- Verifique se o build foi concluído com sucesso

### Rotas não funcionam (404)
- O nginx está configurado para SPA, todas as rotas devem retornar `index.html`
- Verifique se o `nginx.conf` está sendo copiado corretamente

## Otimizações

O Dockerfile já inclui várias otimizações:

- ✅ Multi-stage build (imagem final menor)
- ✅ Cache de layers do Docker
- ✅ Gzip compression no nginx
- ✅ Cache de arquivos estáticos
- ✅ Healthcheck configurado
- ✅ Headers de segurança

## Atualizações

Para atualizar a aplicação:

1. Faça push das alterações para o repositório Git
2. O Easypanel detectará automaticamente e iniciará um novo build
3. Após o build, o deploy será feito automaticamente

## Suporte

Para mais informações sobre o Easypanel:
- [Documentação do Easypanel](https://easypanel.io/docs)
- [Dockerfile Reference](https://docs.docker.com/reference/dockerfile/)
