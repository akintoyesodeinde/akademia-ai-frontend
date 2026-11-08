#!/usr/bin/env bash
set -euo pipefail

IMAGE_REF="${1:?Usage: ssm-deploy-frontend.sh <image-with-digest>}"
AWS_REGION="${AWS_REGION:-us-east-1}"
APP_TAG="${APP_TAG:-akademia-ai}"

case "$IMAGE_REF" in
  *@sha256:*) ;;
  *)
    echo "ERROR: Deployment requires an immutable @sha256:... image digest, got: $IMAGE_REF" >&2
    exit 1
    ;;
esac

aws ssm put-parameter \
  --region "$AWS_REGION" \
  --name "/akademia-ai/prod/frontend_image" \
  --type "String" \
  --value "$IMAGE_REF" \
  --overwrite

INSTANCE_ID=$(aws ec2 describe-instances \
  --region "$AWS_REGION" \
  --filters "Name=tag:Application,Values=${APP_TAG}" "Name=instance-state-name,Values=running" \
  --query "Reservations[0].Instances[0].InstanceId" \
  --output text)

if [ -z "$INSTANCE_ID" ] || [ "$INSTANCE_ID" = "None" ]; then
  echo "ERROR: No running EC2 instance found with tag Application=${APP_TAG}" >&2
  exit 1
fi

COMMAND_ID=$(aws ssm send-command \
  --region "$AWS_REGION" \
  --instance-ids "$INSTANCE_ID" \
  --document-name "AWS-RunShellScript" \
  --comment "Deploy frontend image ${IMAGE_REF}" \
  --parameters "commands=[\"/opt/akademia-ai/deploy-release.sh frontend ${IMAGE_REF}\"]" \
  --query "Command.CommandId" \
  --output text)

aws ssm wait command-executed \
  --region "$AWS_REGION" \
  --command-id "$COMMAND_ID" \
  --instance-id "$INSTANCE_ID"

aws ssm get-command-invocation \
  --region "$AWS_REGION" \
  --command-id "$COMMAND_ID" \
  --instance-id "$INSTANCE_ID" \
  --query "StandardOutputContent" \
  --output text
