#!/bin/bash
set -euo pipefail

readonly VPS_HOST="31.97.26.48"
readonly VPS_USER="root"
readonly APP_DIR="/var/www/aviator-engine"

print_status() {
    echo -e "\n\033[1;34m==>\033[0m \033[1m$1\033[0m"
}

print_success() {
    echo -e "\033[1;32m✓\033[0m $1"
}

case "${1:-help}" in
    setup)
        print_status "Executando setup inicial na VPS..."
        ssh ${VPS_USER}@${VPS_HOST} 'bash -s' < ./setup-vps.sh
        print_success "Setup concluído!"
        ;;
    
    deploy)
        print_status "Iniciando deploy..."
        ssh ${VPS_USER}@${VPS_HOST} "cd ${APP_DIR} && ./deploy/scripts/deploy.sh"
        print_success "Deploy concluído!"
        ;;
    
    logs)
        print_status "Mostrando logs..."
        ssh ${VPS_USER}@${VPS_HOST} "pm2 logs aviator-engine --lines 100"
        ;;
    
    status)
        print_status "Status dos serviços..."
        ssh ${VPS_USER}@${VPS_HOST} "pm2 status && echo '' && systemctl status nginx --no-pager"
        ;;
    
    restart)
        print_status "Reiniciando aplicação..."
        ssh ${VPS_USER}@${VPS_HOST} "pm2 restart aviator-engine"
        print_success "Aplicação reiniciada!"
        ;;
    
    ssh)
        print_status "Conectando via SSH..."
        ssh ${VPS_USER}@${VPS_HOST}
        ;;
    
    health)
        print_status "Verificando saúde..."
        curl -s http://${VPS_HOST}/health | python3 -m json.tool
        ;;
    
    *)
        echo "Uso: $0 {setup|deploy|logs|status|restart|ssh|health}"
        echo ""
        echo "Comandos:"
        echo "  setup    - Executa setup inicial na VPS"
        echo "  deploy   - Faz deploy das atualizações"
        echo "  logs     - Mostra logs da aplicação"
        echo "  status   - Mostra status dos serviços"
        echo "  restart  - Reinicia a aplicação"
        echo "  ssh      - Conecta via SSH na VPS"
        echo "  health   - Verifica saúde da API"
        exit 1
        ;;
esac
