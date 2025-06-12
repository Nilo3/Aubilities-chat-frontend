export interface EnvironmentConfig {
    environment: string;
    domainName: string;
    certificateArn: string;
  }
  
  export interface Config {
    [key: string]: EnvironmentConfig;
  }
  
  export const config: Config = {
    dev: {
      environment: 'dev',
      domainName: 'chat.dev.aubilities.com',
      certificateArn: process.env.CERTIFICATE_ARN ?? ''
    },
    demo: {
      environment: 'demo',
      domainName: 'chat.demo.aubilities.com',
      certificateArn: process.env.CERTIFICATE_ARN ?? ''
    },
    prod: {
      environment: 'prod',
      domainName: 'chat.aubilities.com',
      certificateArn: process.env.CERTIFICATE_ARN ?? ''
    }
  };
  
  export function getConfig(environment: string): EnvironmentConfig {
    const envConfig = config[environment];
    if (!envConfig) {
      throw new Error(`Unknown environment: ${environment}`);
    }
  
    return envConfig;
  }
  