# Akademia AI — AWS IAM & GitHub OIDC Federation Report

## 1. AWS Account Verification Commands (Windows PowerShell)

The target AWS account is associated with `toyesode123@gmail.com`. Authenticate from Windows PowerShell and verify the actual account ID via AWS STS before provisioning:

```powershell
aws --version

aws configure sso

aws sso login --profile akademia-deploy

aws sts get-caller-identity --profile akademia-deploy
```

## 2. GitHub OIDC Identity Provider & Trust Policy

- **Provider URL**: `https://token.actions.githubusercontent.com`
- **Audience (`ClientID`)**: `sts.amazonaws.com`
- **IAM Role Name**: `akademia-github-deploy-role`
- **Allowed Subjects (`sub`)**:
  - `repo:akintoyesodeinde/akademia-ai-backend:ref:refs/heads/main`
  - `repo:akintoyesodeinde/akademia-ai-backend:environment:production`
  - `repo:akintoyesodeinde/akademia-ai-frontend:ref:refs/heads/main`
  - `repo:akintoyesodeinde/akademia-ai-frontend:environment:production`
