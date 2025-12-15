#!/bin/bash
set -euo pipefail

readonly APP_DIR="/var/www/aviator-engine"
readonly SERVICE_DIR="$APP_DIR/node-service"

print_status() {
    echo -e "\n\033[1;34m==>\033[0m \033[1m$1\033[0m"
}

print_success() {
    echo -e "\033[1;32m✓\033[0m $1"
}

pull_latest() {
    print_status "Baixando atualizações..."
    cd "$APP_DIR"
    git fetch origin main
    git reset --hard origin/main
    print_success "Código atualizado"
}

install_dependencies() {
    print_status "Instalando dependências..."
    cd "$SERVICE_DIR"
    # Precisamos das devDependencies para executar o build (ex.: tsup).
    # Após o build, removemos as devDependencies para deixar o runtime mais enxuto.
    npm ci --include=dev
    print_success "Dependências instaladas"
}

build_project() {
    print_status "Fazendo build..."
    cd "$SERVICE_DIR"
    npm run build
    print_success "Build concluído"

    print_status "Removendo devDependencies..."
    npm prune --omit=dev
    print_success "Dependências de produção prontas"
}

restart_service() {
    print_status "Reiniciando serviço..."
    cd "$SERVICE_DIR"
    pm2 reload ecosystem.config.cjs --update-env
    print_success "Serviço reiniciado"
}

health_check() {
    print_status "Verificando saúde do serviço..."
    sleep 3
    
    local max_attempts=10
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/health | grep -q "200"; then
            print_success "Serviço respondendo corretamente"
            return 0
        fi
        
        echo "Tentativa $attempt de $max_attempts..."
        sleep 2
        ((attempt++))
    done
    
    echo "Serviço não respondeu após $max_attempts tentativas"
    return 1
}

main() {
    pull_latest
    install_dependencies
    build_project
    restart_service
    health_check
    
    print_status "Deploy concluído com sucesso!"
}

main "$@"
