# Akademia AI — AWS EC2 Launch Template & Cost-Economized Sandbox Architecture

## 1. Sandbox Budget & Cost-Economy Design

- **Application Host**: **1x EC2 `t3.micro`** (`al2023-ami-kernel-default-x86_64`, 20 GiB `gp3` encrypted EBS, `DeleteOnTermination=true`, **0 EBS snapshots/backups**, `IMDSv2` required).
- **Database**: **1x RDS PostgreSQL 16 `db.t3.micro`** (`--no-multi-az`, 20 GiB `gp3` encrypted, **`--backup-retention-period 0` / no backups**, private security group `akademia-rds-sg` accepting TCP `5432` strictly from `akademia-ec2-sg`).
- **Edge Routing**: `akademia-frontend` Nginx container serves the React SPA and reverse-proxies `/api/` to `http://api:8000/api/`.
