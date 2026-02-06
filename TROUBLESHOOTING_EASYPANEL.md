# Troubleshooting - Deploy no Easypanel

Este documento contém soluções para problemas comuns ao fazer deploy no Easypanel.

## Problema: "Service is not reachable"

### Sintomas
- O build é concluído com sucesso
- O nginx inicia corretamente (visível nos logs)
- Mas o Easypanel mostra "Service is not reachable"

### Possíveis Causas e Soluções

#### 1. Porta Incorreta Configurada

**Verificar:**
- No Easypanel, vá em "Settings" > "Ports"
- Certifique-se de que a porta do container está configurada como `80`
- O tipo deve ser "HTTP"

**Solução:**
```
Porta do Container: 80
Tipo: HTTP
```

#### 2. Healthcheck Falhando

**Verificar:**
- Os logs do container devem mostrar que o nginx está rodando
- Verifique se há erros relacionados ao healthcheck

**Solução:**
O Dockerfile já inclui um healthcheck configurado. Se ainda assim falhar:

1. Verifique se o endpoint `/health` está respondendo:
   ```bash
   # Dentro do container ou via exec
   wget http://localhost/health
   ```

2. O healthcheck usa o endpoint `/health` que retorna `200 OK`

#### 3. Arquivos de Build Não Encontrados

**Verificar:**
- Os logs do build devem mostrar que o stage de build foi concluído
- Verifique se há erros durante o `npm run build`

**Solução:**
1. Verifique se as variáveis de ambiente estão configuradas como **Build Arguments**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

2. Verifique se o build está gerando os arquivos em `/app/dist`:
   ```bash
   # No stage de build, verificar:
   ls -la /app/dist
   ```

#### 4. Configuração do Nginx Incorreta

**Verificar:**
- Os logs do nginx devem mostrar que a configuração foi carregada
- Verifique se há erros de sintaxe no `nginx.conf`

**Solução:**
1. Teste a configuração do nginx localmente:
   ```bash
   docker run --rm -v $(pwd)/nginx.conf:/etc/nginx/conf.d/default.conf nginx:alpine nginx -t
   ```

2. Certifique-se de que o `nginx.conf` está sendo copiado corretamente no Dockerfile

#### 5. Problema com Variáveis de Ambiente

**Verificar:**
- As variáveis devem estar como **Build Arguments**, não Runtime Variables
- Verifique se os valores estão corretos

**Solução:**
No Easypanel:
1. Vá em "Settings" > "Environment Variables"
2. Configure como **Build Arguments**:
   ```
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon
   ```

## Verificações de Debug

### 1. Verificar se o Container Está Rodando

```bash
# No Easypanel, vá em "Logs" e verifique:
# - O nginx deve mostrar "start worker processes"
# - Não deve haver erros de configuração
```

### 2. Verificar se o Nginx Está Escutando na Porta Correta

Os logs devem mostrar:
```
nginx/1.29.5
start worker processes
```

### 3. Testar Localmente

Antes de fazer deploy, teste localmente:

```bash
# Build
docker build \
  --build-arg VITE_SUPABASE_URL=https://seu-projeto.supabase.co \
  --build-arg VITE_SUPABASE_ANON_KEY=sua-chave \
  -t financertrack:test .

# Run
docker run -p 8080:80 financertrack:test

# Testar
curl http://localhost:8080/health
curl http://localhost:8080/
```

### 4. Verificar Logs do Easypanel

No painel do Easypanel:
1. Vá em "Logs"
2. Verifique se há erros durante o build
3. Verifique se há erros durante o runtime
4. Procure por mensagens de erro do nginx

## Solução Rápida

Se o problema persistir, tente:

1. **Reconstruir o App:**
   - No Easypanel, vá em "Settings" > "Rebuild"
   - Isso forçará um novo build completo

2. **Verificar Configuração de Porta:**
   - Certifique-se de que a porta está configurada como `80` (HTTP)

3. **Verificar Healthcheck:**
   - O healthcheck está configurado para usar `/health`
   - Aguarde pelo menos 40 segundos após o deploy para o healthcheck passar

4. **Verificar Domínio:**
   - Se você configurou um domínio customizado, verifique o DNS
   - O domínio deve apontar para o IP do Easypanel

## Contato

Se o problema persistir após seguir estas etapas:
1. Verifique os logs completos no Easypanel
2. Teste o build localmente
3. Verifique se todas as configurações estão corretas

## Checklist de Deploy

Antes de fazer deploy, certifique-se de:

- [ ] Dockerfile está na raiz do projeto
- [ ] nginx.conf está na raiz do projeto
- [ ] .dockerignore está configurado
- [ ] Variáveis de ambiente configuradas como Build Arguments
- [ ] Porta configurada como 80 (HTTP)
- [ ] Build local funciona corretamente
- [ ] Teste local funciona (`docker run -p 8080:80`)
