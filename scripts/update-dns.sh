#!/bin/bash

# Script para actualizar el DNS después del despliegue
# Uso: ./scripts/update-dns.sh <environment>

ENV=${1:-dev}

if [ ! -f ".env.$ENV" ]; then
    echo "Error: Archivo .env.$ENV no encontrado"
    exit 1
fi

# Cargar variables de entorno
source .env.$ENV

echo "=== Actualización de DNS para entorno: $ENV ==="
echo ""

# Obtener el domain name de la nueva distribución
echo "Obteniendo información de la distribución..."
DISTRIBUTION_DOMAIN=$(aws cloudfront list-distributions \
    --query "DistributionList.Items[?contains(Comment, 'ChatFrontendStack-$ENV')].DomainName" \
    --output text)

if [ -z "$DISTRIBUTION_DOMAIN" ] || [ "$DISTRIBUTION_DOMAIN" = "None" ]; then
    echo "Error: No se pudo encontrar la distribución para el entorno $ENV"
    echo "Asegúrate de que el despliegue se haya completado exitosamente."
    exit 1
fi

echo "✅ Distribución encontrada: $DISTRIBUTION_DOMAIN"
echo ""

# Obtener el dominio personalizado de la configuración
case $ENV in
    "dev")
        CUSTOM_DOMAIN="chat.dev.aubilities.com"
        ;;
    "demo")
        CUSTOM_DOMAIN="chat.demo.aubilities.com"
        ;;
    "prod")
        CUSTOM_DOMAIN="chat.aubilities.com"
        ;;
    *)
        echo "Error: Entorno no válido: $ENV"
        exit 1
        ;;
esac

echo "=== Instrucciones para actualizar DNS ==="
echo ""
echo "1. Ve a tu proveedor de DNS (Route 53, Cloudflare, etc.)"
echo "2. Busca el registro CNAME para: $CUSTOM_DOMAIN"
echo "3. Actualiza el valor para que apunte a: $DISTRIBUTION_DOMAIN"
echo ""
echo "Configuración actual:"
echo "   Tipo: CNAME"
echo "   Nombre: $CUSTOM_DOMAIN"
echo "   Valor: $DISTRIBUTION_DOMAIN"
echo ""
echo "4. Espera a que se propague el DNS (puede tomar hasta 24 horas)"
echo "5. Verifica que funciona visitando: https://$CUSTOM_DOMAIN"
echo ""
echo "⚠️  IMPORTANTE: Asegúrate de que el certificado SSL esté configurado correctamente"
echo "   para el dominio $CUSTOM_DOMAIN en la región us-east-1" 