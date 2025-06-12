# 💬 Aubilities Chat Frontend

[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-4.x-purple.svg)](https://vitejs.dev/)
[![AWS CDK](https://img.shields.io/badge/AWS%20CDK-2.x-orange.svg)](https://aws.amazon.com/cdk/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Frontend chat application for the Aubilities platform. Built with React + Vite and deployed using AWS CDK to S3 + CloudFront. Features a modern chat interface with session management and real-time messaging capabilities.

## 📁 Project Structure

```
.
├── /frontend          # React + Vite application
├── /lib              # CDK infrastructure code
└── /bin              # CDK app entry point
```

## 🚀 Development

### Prerequisites

- Node.js (v18 or later)
- AWS CLI configured with appropriate credentials
- AWS CDK CLI installed globally (`npm install -g aws-cdk`)

### 🛠️ Installation

1. Install project dependencies:
```bash
npm install
cd frontend && npm install
```

2. Run the frontend locally:
```bash
cd frontend
npm run dev
```

3. Deploy to AWS:
```bash
npm run build
npx cdk deploy -c env=dev
```

## 🌐 Deployment

The project is automatically deployed to AWS using CDK, creating:
- S3 bucket for static hosting
- CloudFront distribution for CDN
- SSL/TLS certificates
- Custom domain configuration
