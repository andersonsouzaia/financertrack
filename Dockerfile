# Stage 1: Build da aplicação
FROM node:20-alpine AS builder

# Define o diretório de trabalho
WORKDIR /app

# Argumentos de build para variáveis de ambiente do Vite
# Essas variáveis são incorporadas no build em tempo de build
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Define as variáveis de ambiente para o build
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}

# Copia os arquivos de dependências
COPY package*.json ./
COPY bun.lockb* ./

# Instala as dependências
RUN npm ci --only=production=false

# Copia o resto dos arquivos do projeto
COPY . .

# Build da aplicação para produção
RUN npm run build

# Stage 2: Servir a aplicação com Nginx
FROM nginx:alpine

# Copia os arquivos buildados do stage anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Copia a configuração customizada do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expõe a porta 80
EXPOSE 80

# Healthcheck para verificar se o servidor está funcionando
# Usa o endpoint /health que retorna 200 OK
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Comando para iniciar o nginx
CMD ["nginx", "-g", "daemon off;"]
