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

    const certificate = Certificate.fromCertificateArn(this, 'Certificate', config.certificateArn);

    const websiteBucket = new Bucket(this, 'WebsiteBucket', {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const s3Origin = S3BucketOrigin.withOriginAccessControl(websiteBucket, {
      originAccessLevels: [AccessLevel.READ],
    });

    // IMPORTAR la distribución existente de CloudFront
    const distribution = Distribution.fromDistributionAttributes(this, 'ExistingCloudFrontDistribution', {
      distributionId: 'EA5BBA018FZ2J', // <-- Usa el ID de tu distribución existente
      domainName: 'd2ditbgi19oah4.cloudfront.net', // <-- Usa el Domain Name estándar de tu distribución existente
    });

    new BucketDeployment(this, 'DeployWebsite', {
      sources: [Source.asset(join(__dirname, '../frontend/dist'))],
      destinationBucket: websiteBucket,
      distribution, // Usar la distribución importada
      distributionPaths: ['/*'],
    });

    new CfnOutput(this, 'DistributionDomainName', {
      value: distribution.distributionDomainName,
      description: 'Use this domain name to update your DNS CNAME record',
    });

    new CfnOutput(this, 'CustomDomainName', {
      value: config.domainName,
      description: 'Target domain name for DNS configuration',
    });

    new CfnOutput(this, 'Environment', {
      value: config.environment,
    });

    new CfnOutput(this, 'DNSInstructions', {
      value: `After deployment, update your DNS CNAME record for ${config.domainName} to point to ${distribution.distributionDomainName}`,
      description: 'DNS Configuration Instructions',
    });
  }
}
