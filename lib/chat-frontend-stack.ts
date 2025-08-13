import { Stack, StackProps, RemovalPolicy, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Bucket, BlockPublicAccess } from 'aws-cdk-lib/aws-s3';
import { Distribution, ViewerProtocolPolicy, AllowedMethods, CachePolicy, AccessLevel } from 'aws-cdk-lib/aws-cloudfront';
import { S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { join } from 'path';
import { EnvironmentConfig, getConfig } from './config';

interface ChatFrontendStackProps extends StackProps {
  environment: string;
}

export class ChatFrontendStack extends Stack {
  constructor(scope: Construct, id: string, props: ChatFrontendStackProps) {
    super(scope, id, props);

    const config: EnvironmentConfig = getConfig(props.environment);

    // Validar que el certificado ARN esté configurado
    if (!config.certificateArn) {
      throw new Error(`CERTIFICATE_ARN no está configurado para el entorno ${props.environment}`);
    }

    const certificate = Certificate.fromCertificateArn(this, 'Certificate', config.certificateArn);

    const websiteBucket = new Bucket(this, 'WebsiteBucket', {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const s3Origin = S3BucketOrigin.withOriginAccessControl(websiteBucket, {
      originAccessLevels: [AccessLevel.READ],
    });

    // Configuración base de la distribución
    const distributionConfig: any = {
      defaultBehavior: {
        origin: s3Origin,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachePolicy: CachePolicy.CACHING_OPTIMIZED,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    };

    // Solo agregar dominio personalizado si está disponible
    // Para evitar conflictos de DNS, usar solo el dominio CloudFront por defecto en caso de problemas
    const useCustomDomain = process.env.USE_CUSTOM_DOMAIN !== 'false';
    
    if (useCustomDomain && config.certificateArn) {
      distributionConfig.domainNames = [config.domainName];
      distributionConfig.certificate = certificate;
    }

    const distribution = new Distribution(this, 'Distribution', distributionConfig);

    new BucketDeployment(this, 'DeployWebsite', {
      sources: [Source.asset(join(__dirname, '../frontend/dist'))],
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    new CfnOutput(this, 'DistributionDomainName', {
      value: distribution.distributionDomainName,
      description: 'Dominio de CloudFront (siempre disponible)',
    });

    new CfnOutput(this, 'CustomDomainName', {
      value: useCustomDomain && config.certificateArn ? config.domainName : 'No configurado',
      description: 'Dominio personalizado (si está configurado)',
    });

    new CfnOutput(this, 'Environment', {
      value: config.environment,
      description: 'Entorno de despliegue',
    });

    new CfnOutput(this, 'WebsiteURL', {
      value: useCustomDomain && config.certificateArn 
        ? `https://${config.domainName}` 
        : `https://${distribution.distributionDomainName}`,
      description: 'URL principal del sitio web',
    });
  }
}
