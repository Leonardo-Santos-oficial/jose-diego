# Deploy do Aviator Engine na VPS Hostinger

## Informações da VPS

| Propriedade | Valor |
|-------------|-------|
| IP | 31.97.26.48 |
| SO | Ubuntu 24.04 LTS |
| CPU | 2 cores |
| RAM | 8 GB |
| Disco | 100 GB |
| Usuário SSH | root |

## Passo 1: Conectar na VPS

```bash
ssh root@31.97.26.48
```

## Passo 2: Executar Setup Inicial

```bash
# Baixar e executar script de setup
curl -fsSL https://raw.githubusercontent.com/Leonardo-Santos-oficial/jose-diego/main/deploy/scripts/setup-vps.sh | bash
```

Ou manualmente:

```bash
# Atualizar sistema
apt update && apt upgrade -y

# Instalar dependências
apt install -y curl git nginx ufw

# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Instalar PM2
npm install -g pm2
pm2 startup systemd -u root --hp /root

# Criar diretórios
mkdir -p /var/www/aviator-engine
mkdir -p /var/log/aviator

# Configurar firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https
ufw enable
```

## Passo 3: Clonar Repositório

```bash
cd /var/www/aviator-engine
git clone https://github.com/Leonardo-Santos-oficial/jose-diego.git .
```

## Passo 4: Configurar Node Service

```bash
cd /var/www/aviator-engine/node-service

# Instalar dependências
npm ci

# Fazer build
npm run build

# Criar arquivo de ambiente
cp .env.example .env
nano .env
```

Edite o `.env` com suas credenciais do Supabase:

```env
PORT=8081
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui
REALTIME_URL=wss://SEU-PROJETO.supabase.co/realtime/v1
```

## Passo 5: Configurar Nginx

```bash
# Copiar configuração
cp /var/www/aviator-engine/deploy/nginx/aviator-engine.conf /etc/nginx/sites-available/

# Criar link simbólico
ln -sf /etc/nginx/sites-available/aviator-engine.conf /etc/nginx/sites-enabled/

# Remover config padrão
rm -f /etc/nginx/sites-enabled/default

# Testar configuração
nginx -t

# Recarregar Nginx
systemctl reload nginx
```

## Passo 6: Iniciar com PM2

```bash
cd /var/www/aviator-engine/node-service

# Iniciar aplicação
pm2 start ecosystem.config.cjs

# Salvar configuração
pm2 save

# Verificar status
pm2 status
```

## Passo 7: Testar

```bash
# Testar localmente
curl http://localhost:8081/health

# Testar via Nginx
curl http://31.97.26.48/health
```

Resposta esperada:
```json
{"status":"ok","uptime":123.456,"realtimeUrl":"wss://..."}
```

---

## Comandos Úteis

### PM2

```bash
# Ver status
pm2 status

# Ver logs em tempo real
pm2 logs aviator-engine

# Reiniciar
pm2 restart aviator-engine

# Parar
pm2 stop aviator-engine

# Recarregar sem downtime
pm2 reload aviator-engine
```

### Nginx

```bash
# Testar configuração
nginx -t

# Recarregar
systemctl reload nginx

# Ver logs
tail -f /var/log/nginx/aviator-error.log
tail -f /var/log/nginx/aviator-access.log
```

### Logs da Aplicação

```bash
# Logs de erro
tail -f /var/log/aviator/error.log

# Logs de saída
tail -f /var/log/aviator/output.log
```

---

## Deploy de Atualizações

Para atualizar a aplicação após mudanças:

```bash
cd /var/www/aviator-engine
./deploy/scripts/deploy.sh
```

Ou manualmente:

```bash
cd /var/www/aviator-engine
git pull origin main
cd node-service
npm ci
npm run build
pm2 reload ecosystem.config.cjs
```

---

## Configuração do Frontend (Vercel)

Adicione a variável de ambiente na Vercel:

| Variável | Valor |
|----------|-------|
| `NEXT_PUBLIC_ENGINE_URL` | `http://31.97.26.48` |

> **Nota:** Quando você tiver um domínio com SSL, atualize para `https://seu-dominio.com`

---

## Quando Tiver um Domínio

1. Configure o DNS apontando para `31.97.26.48`
2. Instale o Certbot:

```bash
apt install certbot python3-certbot-nginx -y
```

3. Gere o certificado SSL:

```bash
certbot --nginx -d seu-dominio.com
```

4. Atualize a config do Nginx e a variável na Vercel

---

## Troubleshooting

### Aplicação não inicia

```bash
# Ver logs de erro
pm2 logs aviator-engine --err --lines 50

# Verificar se a porta está em uso
lsof -i :8081
```

### Nginx retorna 502

```bash
# Verificar se a aplicação está rodando
pm2 status

# Verificar conexão local
curl http://localhost:8081/health

# Ver logs do Nginx
tail -50 /var/log/nginx/aviator-error.log
```

### Erro de CORS

Verifique se o domínio do frontend está na lista `ALLOWED_ORIGINS` em `src/server.ts`
