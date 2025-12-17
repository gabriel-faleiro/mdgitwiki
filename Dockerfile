FROM node:20-alpine

# Instalar git (necessário para simple-git)
RUN apk add --no-cache git

# Criar diretório da aplicação
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código da aplicação
COPY index.js config.json ./

# Expor porta
EXPOSE 3000

# Executar como usuário não-root
USER node

# Comando de inicialização
CMD ["node", "index.js"]