#!/bin/bash
set -euo pipefail

readonly APP_DIR="/var/www/aviator-engine"
readonly LOG_DIR="/var/log/aviator"
readonly NGINX_CONF="/etc/nginx/sites-available/aviator-engine"
readonly NODE_VERSION="20"

print_status() {
    echo -e "\n\033[1;34m==>\033[0m \033[1m$1\033[0m"
}

print_success() {
    echo -e "\033[1;32m✓\033[0m $1"
}

print_error() {
    echo -e "\033[1;31m✗\033[0m $1" >&2
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "Este script precisa ser executado como root"
        exit 1
    fi
}

update_system() {
    print_status "Atualizando sistema..."
    apt update && apt upgrade -y
    print_success "Sistema atualizado"
}

install_dependencies() {
    print_status "Instalando dependências..."
    apt install -y curl git nginx ufw
    print_success "Dependências instaladas"
}

install_nodejs() {
    print_status "Instalando Node.js ${NODE_VERSION}..."
    
    if command -v node &> /dev/null; then
        local current_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [[ "$current_version" -ge "$NODE_VERSION" ]]; then
            print_success "Node.js já instalado (v$(node -v))"
            return
        fi
    fi
    
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt install -y nodejs
    print_success "Node.js $(node -v) instalado"
}

install_pm2() {
    print_status "Instalando PM2..."
    
    if command -v pm2 &> /dev/null; then
        print_success "PM2 já instalado"
        return
    fi
    
    npm install -g pm2
    pm2 startup systemd -u root --hp /root
    print_success "PM2 instalado e configurado"
}

create_directories() {
    print_status "Criando diretórios..."
    
    mkdir -p "$APP_DIR"
    mkdir -p "$LOG_DIR"
    
    chown -R root:root "$APP_DIR"
    chown -R root:root "$LOG_DIR"
    
    print_success "Diretórios criados"
}

configure_firewall() {
    print_status "Configurando firewall..."
    
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow http
    ufw allow https
    ufw --force enable
    
    print_success "Firewall configurado"
}

configure_nginx() {
    print_status "Configurando Nginx..."
    
    rm -f /etc/nginx/sites-enabled/default
    
    print_success "Nginx configurado (copie o arquivo de config manualmente)"
}

print_next_steps() {
    print_status "Setup concluído!"
    echo ""
    echo "=========================================="
    echo "         PRÓXIMOS PASSOS                 "
    echo "=========================================="
    echo ""
    echo "1. Clone o repositório:"
    echo "   cd /var/www/aviator-engine"
    echo "   git clone https://github.com/Leonardo-Santos-oficial/jose-diego.git ."
    echo ""
    echo "2. Entre na pasta do node-service:"
    echo "   cd node-service"
    echo ""
    echo "3. Instale as dependências:"
    echo "   npm install"
    echo ""
    echo "4. Faça o build:"
    echo "   npm run build"
    echo ""
    echo "5. Crie o arquivo .env:"
    echo "   cp .env.example .env"
    echo "   nano .env"
    echo ""
    echo "6. Copie a config do Nginx:"
    echo "   cp ../deploy/nginx/aviator-engine.conf /etc/nginx/sites-available/"
    echo "   ln -s /etc/nginx/sites-available/aviator-engine.conf /etc/nginx/sites-enabled/"
    echo "   nginx -t && systemctl reload nginx"
    echo ""
    echo "7. Inicie com PM2:"
    echo "   pm2 start ecosystem.config.cjs"
    echo "   pm2 save"
    echo ""
    echo "8. Teste:"
    echo "   curl http://31.97.26.48/health"
    echo ""
    echo "=========================================="
}

main() {
    check_root
    update_system
    install_dependencies
    install_nodejs
    install_pm2
    create_directories
    configure_firewall
    configure_nginx
    print_next_steps
}

main "$@"
