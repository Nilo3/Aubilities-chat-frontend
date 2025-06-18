#!/bin/bash

# Script para obtener el ID de la distribución de CloudFront
# Uso: ./scripts/get-distribution-id.sh <domain-name>

DOMAIN_NAME=$1

if [ -z "$DOMAIN_NAME" ]; then
    echo "Uso: $0 <domain-name>"
    echo "Ejemplo: $0 chat.dev.aubilities.com"
    exit 1
fi

echo "Buscando distribución para el dominio: $DOMAIN_NAME"

# Obtener el ID de la distribución
DISTRIBUTION_ID=$(aws cloudfront list-distributions \
    --query "DistributionList.Items[?Aliases.Items[?contains(@, '$DOMAIN_NAME')]].Id" \
    --output text)

if [ -z "$DISTRIBUTION_ID" ] || [ "$DISTRIBUTION_ID" = "None" ]; then
    echo "No se encontró ninguna distribución para el dominio: $DOMAIN_NAME"
    exit 1
fi

echo "ID de la distribución encontrado: $DISTRIBUTION_ID"

# Obtener el domain name de la distribución
DISTRIBUTION_DOMAIN=$(aws cloudfront list-distributions \
    --query "DistributionList.Items[?Id=='$DISTRIBUTION_ID'].DomainName" \
    --output text)

echo "Domain name de la distribución: $DISTRIBUTION_DOMAIN"

echo ""
echo "Configuración para config.ts:"
echo "existingDistributionId: '$DISTRIBUTION_ID',"
echo "existingDistributionDomain: '$DISTRIBUTION_DOMAIN'" 