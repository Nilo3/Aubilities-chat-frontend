# Guía de Despliegue - Chat Frontend

## Problema Resuelto

El error original se debía a un conflicto de DNS donde `chat.dev.aubilities.com` ya estaba configurado como CNAME apuntando a una distribución de CloudFront existente (`d2ditbgi19oah4.cloudfront.net`).

## Solución Implementada

Hemos modificado el stack para:
1. **Crear una nueva distribución** sin especificar el alias del dominio personalizado
2. **Evitar el conflicto** de DNS durante el despliegue
3. **Proporcionar instrucciones** para actualizar el DNS manualmente después del despliegue

## Pasos para el Despliegue

### 1. Preparación
```bash
# Asegúrate de tener las credenciales AWS configuradas
source .env.dev  # o .env.demo, .env.prod según el entorno
```

### 2. Despliegue
```bash
# Opción 1: Despliegue normal
make deploy ENV=dev

# Opción 2: Despliegue con instrucciones de DNS automáticas
make deploy-with-dns ENV=dev
```

### 3. Actualización del DNS (Manual)

Después del despliegue exitoso, necesitas actualizar el DNS:

#### Opción A: Usar el script automático
```bash
make update-dns ENV=dev
```

#### Opción B: Manual
1. Ve a tu proveedor de DNS (Route 53, Cloudflare, etc.)
2. Busca el registro CNAME para `chat.dev.aubilities.com`
3. Actualiza el valor para que apunte a la nueva distribución (se mostrará en la salida del despliegue)
4. Espera la propagación del DNS (hasta 24 horas)

### 4. Configuración del Certificado SSL

Una vez que el DNS esté actualizado:
1. Ve a AWS Certificate Manager en la región `us-east-1`
2. Verifica que el certificado para `chat.dev.aubilities.com` esté validado
3. Si no está validado, completa la validación

### 5. Habilitar el Dominio Personalizado (Opcional)

Una vez que todo esté funcionando, puedes habilitar el dominio personalizado:

1. Edita `lib/chat-frontend-stack.ts`
2. Descomenta las líneas:
   ```typescript
   domainNames: [config.domainName],
   certificate,
   ```
3. Ejecuta `make deploy ENV=dev` nuevamente

## Verificación

Para verificar que todo funciona:

```bash
# Verificar que la distribución está activa
aws cloudfront list-distributions --query "DistributionList.Items[?contains(Comment, 'ChatFrontendStack-dev')]"

# Verificar el DNS
nslookup chat.dev.aubilities.com

# Verificar el sitio web
curl -I https://chat.dev.aubilities.com
```

## Comandos Útiles

```bash
# Ver diferencias antes del despliegue
make diff ENV=dev

# Limpiar archivos compilados
make clean

# Ver ayuda completa
make help
```

## Troubleshooting

### Error: "Distribution already exists"
- Asegúrate de que el DNS esté actualizado antes de habilitar el dominio personalizado
- Verifica que no haya distribuciones duplicadas

### Error: "Certificate not found"
- Verifica que el certificado existe en la región `us-east-1`
- Asegúrate de que la variable `CERTIFICATE_ARN` esté configurada correctamente

### Error: "DNS not propagated"
- Espera hasta 24 horas para la propagación completa
- Usa herramientas como `dig` o `nslookup` para verificar el estado

## Estructura de Archivos

```
├── lib/
│   ├── chat-frontend-stack.ts  # Stack principal (modificado)
│   └── config.ts               # Configuración de entornos
├── scripts/
│   ├── get-distribution-id.sh  # Obtener ID de distribución
│   └── update-dns.sh          # Instrucciones de DNS
├── makefile                    # Comandos de despliegue (actualizado)
└── DEPLOYMENT_GUIDE.md        # Esta guía
```

## Notas Importantes

- **Región del Certificado**: Los certificados para CloudFront deben estar en `us-east-1`
- **Propagación DNS**: Puede tomar hasta 24 horas
- **Validación SSL**: El certificado debe estar validado antes de usar HTTPS
- **Backup**: Considera hacer backup de la configuración DNS actual antes de cambiarla 