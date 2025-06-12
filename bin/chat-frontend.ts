#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { ChatFrontendStack } from '../lib/chat-frontend-stack';

const app = new App();

// Get environment from context (-c env=dev|demo|prod)
const environment = app.node.tryGetContext('env') || 'dev';

new ChatFrontendStack(app, `ChatFrontendStack-${environment}`, {
  environment,
  env: {
    account: process.env.AWS_ACCOUNT_ID,
    region: process.env.AWS_REGION,
  },
});
