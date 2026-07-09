---
title: "Woodpecker CI на VPS: лёгкий self-hosted CI/CD с Docker pipelines"
description: "Woodpecker CI на VPS: Docker, Gitea/GitHub integration, pipelines YAML, secrets, agents и SSL. Open-source альтернатива GitHub Actions и Jenkins для своего git."
pubDate: 2026-07-09
category: DevOps
keywords:
  - "Woodpecker CI VPS"
  - "self-hosted CI/CD"
  - "Docker pipelines"
  - "GitHub Actions alternative"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** Woodpecker CI — open-source CI/CD, compatible с Drone pipelines. На VPS 2 GB+: server container + agent + [Gitea](/blog/gitea-git-server-vps/) OAuth + [Docker](/blog/docker-compose-vps/) pipeline execution. YAML pipelines как GitHub Actions, но на [вашем VPS](/blog/choose-vps/).

GitHub Actions — minutes billing, [Jenkins](/blog/jenkins-ci-cd-vps/) — Java heavyweight. Woodpecker — минимальный footprint, native Docker pipelines, perfect companion для self-hosted [Gitea](/blog/gitea-git-server-vps/).

---

## Woodpecker vs Jenkins vs GitHub Actions vs Drone

| Критерий | Woodpecker | [Jenkins](/blog/jenkins-ci-cd-vps/) | GitHub Actions | Drone |
| --- | --- | --- | --- | --- |
| RAM server | 512 MB–1 GB | 2 GB+ | N/A | 512 MB |
| Pipeline format | YAML | Groovy/Jenkinsfile | YAML | YAML |
| Docker-native | Да | Plugin | Hosted runners | Да |
| Gitea integration | Native OAuth | Plugin | GitHub only | Native |
| UI | Clean modern | Classic | GitHub UI | Clean |
| Maintenance | Low | High | Zero | Low (archived→Woodpecker) |

Woodpecker — spiritual successor Drone, active development.

---

## Архитектура

```
Developer git push
        ↓ webhook
   Gitea / GitHub / GitLab
        ↓
   Woodpecker Server (API + UI)
        ↓
   Woodpecker Agent(s) — Docker socket
        ↓
   Pipeline containers (build, test, deploy)
        ↓
   Target: VPS deploy, [Harbor](/blog/harbor-docker-registry-vps/), SSH
```

Server и agent могут быть на одном VPS для small teams.

---

## Требования к VPS

| Сценарий | RAM | CPU | Диск |
| --- | --- | --- | --- |
| Server only (1 agent) | 2 GB | 2 vCPU | 20 GB |
| Server + heavy builds | 4 GB | 4 vCPU | 50 GB SSD |
| Multiple agents | 2 GB server + agents on build nodes | | |

Build containers ephemeral — disk fills with dangling images. `docker system prune` weekly cron.

---

## Docker Compose

```yaml
services:
  woodpecker-server:
    image: woodpeckerci/woodpecker-server:latest
    restart: unless-stopped
    ports:
      - "127.0.0.1:8000:8000"
    volumes:
      - woodpecker-data:/var/lib/woodpecker/
    environment:
      WOODPECKER_OPEN: "false"
      WOODPECKER_HOST: https://ci.example.com
      WOODPECKER_GITEA: "true"
      WOODPECKER_GITEA_URL: https://git.example.com
      WOODPECKER_GITEA_CLIENT: YOUR_GITEA_OAUTH_CLIENT_ID
      WOODPECKER_GITEA_SECRET: YOUR_GITEA_OAUTH_SECRET
      WOODPECKER_AGENT_SECRET: CHANGE_ME_AGENT_SECRET
      WOODPECKER_ADMIN: admin

  woodpecker-agent:
    image: woodpeckerci/woodpecker-agent:latest
    restart: unless-stopped
    depends_on:
      - woodpecker-server
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      WOODPECKER_SERVER: woodpecker-server:9000
      WOODPECKER_AGENT_SECRET: CHANGE_ME_AGENT_SECRET
      WOODPECKER_MAX_WORKFLOWS: 2

volumes:
  woodpecker-data:
```

Agent needs Docker socket — security sensitive. Isolate build VPS if possible.

---

## Gitea OAuth setup

1. Gitea → Settings → Applications → Create OAuth2
2. Redirect URI: `https://ci.example.com/authorize`
3. Copy Client ID + Secret → Woodpecker env
4. First login Woodpecker → authorize via Gitea
5. Activate repos in Woodpecker UI

Полный Gitea setup — [Gitea на VPS](/blog/gitea-git-server-vps/).

---

## Nginx reverse proxy

```nginx
server {
    listen 443 ssl http2;
    server_name ci.example.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /webhook {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

SSL — [Let's Encrypt](/blog/ssl-letsencrypt-vps/). Webhooks от Gitea требуют public HTTPS.

---

## Pipeline example (.woodpecker.yml)

```yaml
steps:
  - name: test
    image: node:20-alpine
    commands:
      - npm ci
      - npm test

  - name: build
    image: node:20-alpine
    commands:
      - npm run build
    when:
      branch: main

  - name: deploy
    image: appleboy/drone-ssh
    settings:
      host: deploy.example.com
      username: deploy
      key:
        from_secret: ssh_key
      script:
        - cd /app && docker compose pull && docker compose up -d
    when:
      branch: main
      event: push
```

Place `.woodpecker.yml` in repo root. Woodpecker auto-discovers on push.

---

## Secrets management

```bash
# Woodpecker CLI or UI → repository secrets
woodpecker-cli repo secret add --name ssh_key --value @~/.ssh/id_ed25519
woodpecker-cli repo secret add --name registry_password --value "SECRET"
```

Secrets encrypted at rest. Не храните в YAML. Для org-wide — [HashiCorp Vault](/blog/vault-secrets-vps/) integration via plugins.

---

## Multi-pipeline и when conditions

```yaml
when:
  branch: [main, develop]
  event: [push, pull_request]
  path: ["src/**", "package.json"]
```

Path filtering — run only when relevant files change. Matrix builds:

```yaml
matrix:
  NODE_VERSION:
    - 18
    - 20
steps:
  - name: test
    image: node:${NODE_VERSION}-alpine
    commands:
      - npm test
```

---

## Docker registry integration

Push images to [Harbor](/blog/harbor-docker-registry-vps/) or Docker Hub:

```yaml
  - name: publish
    image: plugins/docker
    settings:
      repo: registry.example.com/app/${CI_COMMIT_SHA}
      registry: registry.example.com
      username:
        from_secret: registry_user
      password:
        from_secret: registry_password
    when:
      branch: main
```

---

## Deploy strategies

| Target | Plugin/method |
| --- | --- |
| SSH + docker compose | appleboy/drone-ssh |
| Kubernetes | kubectl step |
| [PocketBase](/blog/pocketbase-vps/) | rsync + restart |
| Static site | rsync to nginx www |

Notifications — [ntfy](/blog/ntfy-push-vps/) curl step on pipeline fail.

---

## Security hardening

| Пункт | Действие |
| --- | --- |
| WOODPECKER_OPEN=false | No anonymous registration |
| Agent secret | Strong random, server+agent match |
| Docker socket | Dedicated build user, no root in pipelines |
| Trusted repos only | Enable per-repo in Woodpecker UI |
| [Tailscale](/blog/tailscale-vpn-vps/) | Admin UI VPN-only optional |
| Pin images | Don't use :latest in production pipelines |

Malicious `.woodpecker.yml` PR = code execution. Protect main branch, require review.

---

## Backup

```bash
docker run --rm -v woodpecker-data:/data -v $(pwd):/backup alpine \
  tar czf /backup/woodpecker-data.tar.gz /data
```

Contains: pipeline history, secrets (encrypted), settings. [3-2-1](/blog/backup-vps-3-2-1/).

---

## Мониторинг

- [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/) — CI UI availability
- Failed pipeline → [ntfy](/blog/ntfy-push-vps/) alert
- Agent connected — Woodpecker UI shows agent status
- Disk — build cache growth

---

## Troubleshooting

| Проблема | Решение |
| --- | --- |
| Agent not connecting | WOODPECKER_AGENT_SECRET mismatch |
| Pipeline not triggered | Webhook URL in Gitea, check deliveries |
| Docker permission denied | Agent user in docker group |
| OOM during build | Increase VPS RAM, limit parallel workflows |
| Secret not found | Repository vs org secret scope |
| OAuth login fail | Redirect URI exact match |
| Stale images fill disk | cron docker system prune -af |
| YAML parse error | Woodpecker lint in UI logs |
| Clone fail | Gitea deploy key or OAuth scope |
| Slow builds | layer caching, registry mirror |

---

## Связка с экосистемой

- Git — [Gitea](/blog/gitea-git-server-vps/)
- Registry — [Harbor](/blog/harbor-docker-registry-vps/)
- Compare — [Jenkins](/blog/jenkins-ci-cd-vps/), [GitHub Actions](/blog/github-actions-cicd/)
- Secrets — [Vault](/blog/vault-secrets-vps/)
- Alerts — [ntfy](/blog/ntfy-push-vps/)
- Docker — [Docker Compose](/blog/docker-compose-vps/)

---

## Итог

Woodpecker CI — идеальный CI/CD для self-hosted git. Лёгкий, Docker-native, YAML pipelines. Пара с Gitea — полноценная dev platform на одном VPS.

VPS от 2 GB — [StormNet Cloud](https://stormnetcloud.com/). Git — [Gitea](/blog/gitea-git-server-vps/). SSL — [Let's Encrypt](/blog/ssl-letsencrypt-vps/). Alerts — [ntfy](/blog/ntfy-push-vps/).
