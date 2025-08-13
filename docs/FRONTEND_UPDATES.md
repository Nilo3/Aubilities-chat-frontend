# Frontend Update Guide

## Overview

This document describes the process for making frontend updates and deploying them safely across different environments.

## Update Process

### 1. Local Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev
```

### 2. Build and Testing

```bash
# Build for specific environment
npm run build:dev    # Development
npm run build:demo   # Demo
npm run build:prod   # Production

# Verify build locally
npm run preview
```

### 3. Deployment Process

#### First Time in an Environment

```bash
# Initial deployment (includes CloudFront setup)
make deploy ENV=<dev|demo|prod>
```

#### Subsequent Updates

```bash
# Only update frontend (faster, doesn't touch CloudFront)
make deploy-no-domain ENV=<dev|demo|prod>
```

## Recommended Workflow

1. **Development and Testing**
   ```bash
   npm install
   npm run dev
   # Develop and test locally
   ```

2. **Build for Environment**
   ```bash
   # Build for target environment
   npm run build:demo
   ```

3. **Deployment**
   ```bash
   # Update frontend only
   make deploy-no-domain ENV=demo
   ```

4. **Verification**
   - Check URL in deployment outputs
   - Verify functionality in browser
   - Check browser console for errors

## Important Considerations

### Environment Variables

- Verify `.env.<environment>` before deployment
- Ensure `CERTIFICATE_ARN` is configured
- Set `USE_CUSTOM_DOMAIN` as needed

### Domains and DNS

- Custom domain is optional
- CloudFront always provides alternative domain
- Using `deploy-no-domain` avoids DNS conflicts

### Cache and CDN

- CloudFront caches content
- Consider TTL for updates
- Use invalidation if necessary

## Troubleshooting

### Build Failures
```bash
# Clean dependencies and node_modules
rm -rf node_modules
npm install
```

### Deployment Errors
```bash
# Check stack status
make doctor ENV=<environment>

# View differences
make diff ENV=<environment>
```

## Rollback

### Rollback Process
1. Identify previous working version
2. Build that version
3. Use `deploy-no-domain` to update

```bash
git checkout <previous-version>
npm install
npm run build:<environment>
make deploy-no-domain ENV=<environment>
```

## Best Practices

1. **Always test locally** before deploying
2. **Use `deploy-no-domain`** for updates
3. **Verify outputs** after deployment
4. **Maintain documentation** of changes
5. **Follow established** workflow

## Time Estimates

- **Local Build**: 1-2 minutes
- **Local Testing**: 5-10 minutes
- **Deployment**: 3-4 minutes
- **Verification**: 2-3 minutes

## Deployment Checklist

- [ ] Dependencies updated
- [ ] Build successful
- [ ] Local tests passed
- [ ] Environment variables configured
- [ ] Deployment completed
- [ ] Browser verification
- [ ] Documentation updated

## References

- [Vite Documentation](https://vitejs.dev/)
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/latest/guide/home.html)
- [CloudFront Developer Guide](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Introduction.html)