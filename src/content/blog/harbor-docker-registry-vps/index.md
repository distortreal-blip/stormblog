---
title: "Harbor на VPS: private Docker Registry для CI/CD"
description: "Harbor на VPS: установка, SSL, robot accounts, vulnerability scanning и интеграция с GitHub Actions, Jenkins и GitLab Runner."
pubDate: 2026-07-08
category: DevOps
keywords:
  - "Harbor VPS"
  - "Docker Registry"
  - "private registry"
  - "container images"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** Harbor — enterprise Docker/OCI registry с UI, RBAC, scanning и replication. VPS 4 GB+: Docker Compose или installer + [SSL](/blog/ssl-letsencrypt-vps/) + robot accounts для [CI/CD](/blog/github-actions-cicd/).

Docker Hub rate limits и публичные образы — риск supply chain. Private Harbor на [VPS](/blog/choose-vps/) = контроль версий, CVE scan, air-gapped deploy.

---

## Harbor vs Docker Registry vs GitHub GHCR

| | Harbor | registry:2 | GHCR |
| --- | --- | --- | --- |
| UI | Да | Нет | GitHub UI |
| Vulnerability scan | Trivy built-in | Нет | GitHub |
| RBAC | Projects, roles | Token only | Repo permissions |
| RAM | 4 GB+ | 512 MB | N/A |
| Self-hosted | Да | Да | Нет |

Для серьёзного CI — Harbor. Для minimal — [MinIO](/blog/minio-s3-na-vps/) + registry:2.

---

## Архитектура

```
CI (GitHub Actions / Jenkins / GitLab Runner)
        ↓ docker push
   Harbor Registry (HTTPS)
        ↓ pull
Production VPS / K3s / [Docker Swarm](/blog/docker-swarm-na-vps/)
```

---

## Требования к VPS

| Нагрузка | RAM | Диск |
| --- | --- | --- |
| Dev team, <50 images | 4 GB | 50 GB SSD |
| Production, scanning | 8 GB | 200 GB+ |
| Multi-tenant | 16 GB | NVMe |

Harbor heavy — не ставьте на 2 GB VPS.

---

## Установка (Docker Compose offline installer)

```bash
wget https://github.com/goharbor/harbor/releases/download/v2.11.0/harbor-offline-installer-v2.11.0.tgz
tar xzf harbor-offline-installer-v2.11.0.tgz
cd harbor
cp harbor.yml.tmpl harbor.yml
# edit: hostname, admin password, HTTPS cert paths
./install.sh
```

Или HTTPS через [Nginx](/blog/nginx-ili-caddy/) reverse proxy к harbor nginx.

---

## harbor.yml essentials

```yaml
hostname: registry.example.com
https:
  port: 443
  certificate: /path/to/fullchain.pem
  private_key: /path/to/privkey.pem
harbor_admin_password: CHANGE_ME
data_volume: /data/harbor
```

---

## Projects и RBAC

| Роль | Права |
| --- | --- |
| Project Admin | Full project control |
| Developer | push + pull |
| Guest | pull only |
| Limited Guest | pull public repos only |

Структура: `library/` (default), `team-a/app`, `team-b/api`.

---

## Robot accounts для CI

1. Project → Robot Accounts → New
2. Permissions: push + pull (or pull only for deploy)
3. Token → GitHub Secrets / [Vault](/blog/vault-secrets-vps/)

```yaml
# GitHub Actions
- name: Login Harbor
  uses: docker/login-action@v3
  with:
    registry: registry.example.com
    username: robot$project+ci
    password: ${{ secrets.HARBOR_ROBOT_TOKEN }}
```

---

## GitHub Actions push example

```yaml
- name: Build and push
  uses: docker/build-push-action@v6
  with:
    context: .
    push: true
    tags: registry.example.com/myapp/api:${{ github.sha }}
```

Deploy stage — pull on [production VPS](/blog/docker-compose-vps/) via SSH or [Ansible](/blog/ansible-avtomatizaciya-servera/).

---

## Vulnerability scanning

Harbor 2.x — Trivy scanner built-in:

- Project → Configuration → Automatically scan images on push
- Intercept Critical CVE — prevent pull in production
- Reports в UI + webhooks

---

## Replication и backup

- **Replication** — Harbor → Harbor (DR site) или Harbor → [MinIO S3](/blog/minio-s3-na-vps/)
- **Backup** — `/data/harbor` volume + DB postgres inside stack
- Schedule — [Restic](/blog/restic-backup-vps/) nightly

---

## Docker daemon insecure registry (avoid)

Production — always valid TLS. Dev only:

```json
{ "insecure-registries": ["registry.local:5000"] }
```

---

## Integration matrix

| CI | Push | Pull deploy |
| --- | --- | --- |
| [GitHub Actions](/blog/github-actions-cicd/) | docker/login-action | SSH + docker pull |
| [Jenkins](/blog/jenkins-ci-cd-vps/) | docker.withRegistry | kubectl/compose |
| [GitLab Runner](/blog/gitlab-runner-cicd-vps/) | CI_REGISTRY vars | helm upgrade |

---

## Troubleshooting

| Проблема | Решение |
| --- | --- |
| push denied | Robot permissions, project quota |
| x509 certificate | CA trust on build agents |
| Scan stuck | Trivy DB update, RAM |
| Disk full | Garbage collection, retention policy |
| Slow push | Layer cache, SSD, bandwidth |

```bash
# GC unused blobs
docker exec harbor-core harbor_gc
```

---

## Hardening

- [CrowdSec](/blog/crowdsec-zashchita-vps/) + rate limit login
- Disable self-registration
- OIDC via [Authentik](/blog/authentik-sso-vps/)
- Separate robot per pipeline — rotate tokens
- [nftables](/blog/nftables-firewall-vps/) — registry only from CI IPs if static

---

## Итог

Harbor — стандарт private registry для self-hosted DevOps. CVE scan + RBAC + robot accounts закрывают production requirements.

VPS 8 GB — [StormNet Cloud](https://stormnetcloud.com/). CI — [Jenkins](/blog/jenkins-ci-cd-vps/) или [GitHub Actions](/blog/github-actions-cicd/). Storage backend — [MinIO](/blog/minio-s3-na-vps/).
