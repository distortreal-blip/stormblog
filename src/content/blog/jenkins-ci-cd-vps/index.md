---
title: "Jenkins на VPS: CI/CD pipeline с нуля до production"
description: "Jenkins LTS на VPS: Docker, agents, Pipeline as Code, GitHub webhooks, деплой на staging. Полный гайд self-hosted CI/CD."
pubDate: 2026-07-05
category: DevOps
keywords:
  - "Jenkins VPS"
  - "CI/CD pipeline"
  - "Jenkins Docker"
  - "self-hosted CI"
  - "DevOps Jenkins"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** Jenkins — классический self-hosted CI/CD. На VPS 2 GB: Docker, LTS, Pipeline из Jenkinsfile, agent на том же или отдельном VPS. Webhook из GitHub/GitLab → build → test → deploy.

Если [GitHub Actions](/blog/github-actions-cicd/) и [GitLab Runner](/blog/gitlab-runner-cicd-vps/) не подходят (air-gapped, compliance, unlimited minutes) — Jenkins всё ещё стандарт enterprise.

---

## Jenkins vs GitHub Actions vs GitLab CI

| | Jenkins | GitHub Actions | GitLab Runner |
| --- | --- | --- | --- |
| Self-hosted | Да | Hybrid | Да |
| Plugins | 2000+ | Marketplace | Built-in |
| Learning curve | Высокая | Низкая | Средняя |
| RAM | 2 GB+ | SaaS | 2 GB+ |

Jenkins выигрывает гибкостью pipeline и интеграциями (Slack, Jira, SonarQube).

---

## Архитектура

```
Git push → Webhook → Jenkins controller
                         ↓
                    Jenkins agent (Docker)
                         ↓
              build → test → docker push → deploy VPS
```

**Controller** — UI, scheduling, credentials.  
**Agent** — выполняет job (лучше отдельный VPS для isolation).

---

## Установка через Docker

```yaml
services:
  jenkins:
    image: jenkins/jenkins:lts-jdk17
    restart: unless-stopped
    user: root
    ports:
      - "127.0.0.1:8080:8080"
      - "127.0.0.1:50000:50000"
    volumes:
      - jenkins_home:/var/jenkins_home
      - /var/run/docker.sock:/var/run/docker.sock

volumes:
  jenkins_home:
```

```bash
docker compose up -d
docker compose exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

Nginx reverse proxy + [Let's Encrypt](/blog/ssl-letsencrypt-vps/) → `https://ci.example.com`.

---

## Первичная настройка

1. Unlock Jenkins (initialAdminPassword)
2. Install suggested plugins
3. Create admin user — **сразу включите 2FA** (plugin)
4. Configure global tools: JDK 17, Git, Docker

Не оставляйте Jenkins открытым в интернет без auth — bot'ы найдут за часы.

---

## Jenkinsfile (Pipeline as Code)

```groovy
pipeline {
  agent any
  stages {
    stage('Checkout') {
      steps { checkout scm }
    }
    stage('Test') {
      steps {
        sh 'npm ci && npm test'
      }
    }
    stage('Build Docker') {
      steps {
        sh 'docker build -t myapp:${BUILD_NUMBER} .'
      }
    }
    stage('Deploy') {
      when { branch 'main' }
      steps {
        sh 'ssh deploy@vps "docker pull myapp:${BUILD_NUMBER} && docker compose up -d"'
      }
    }
  }
  post {
    failure {
      echo 'Notify Telegram/Slack'
    }
  }
}
```

Храните Jenkinsfile в репозитории — [infrastructure as code](/blog/terraform-vps-infrastruktura/) mindset.

---

## GitHub webhook

1. Jenkins job → Build Triggers → GitHub hook trigger
2. GitHub repo → Webhooks → `https://ci.example.com/github-webhook/`
3. Push → auto build

Для [Gitea](/blog/gitea-git-server-vps/) — аналогичный plugin.

---

## Credentials

Jenkins → Credentials:

- SSH key для deploy на [VPS](/blog/vps-first-steps/)
- Docker registry token
- API keys (не в Jenkinsfile plaintext!)

Лучше — [Vault](/blog/vault-secrets-vps/) plugin или Jenkins credential store + rotation.

---

## Agent на отдельном VPS

Controller на ci.example.com, agent на build.example.com:

```bash
# На agent VPS
docker run -d --name jenkins-agent \
  -e JENKINS_URL=https://ci.example.com \
  -e JENKINS_SECRET=... \
  -e JENKINS_AGENT_NAME=build-1 \
  jenkins/inbound-agent
```

Job не должен иметь root на production — только на build agent.

---

## Docker-in-Docker vs socket mount

| | docker.sock mount | DinD |
| --- | --- | --- |
| Простота | Да | Сложнее |
| Безопасность | Agent = root on host | Изолированнее |
| Production | Только trusted jobs | Предпочтительно |

Для pet-project — socket ok на dedicated build VPS. Для multi-tenant — DinD или [Kaniko](/blog/docker-multi-stage-builds/).

---

## Деплой приложений

Связка с существующими гайдами:

- [Node.js PM2](/blog/nodejs-pm2-deploy/)
- [Laravel](/blog/laravel-na-vps/)
- [Django](/blog/django-deploy-na-vps/)
- [Docker Compose](/blog/docker-compose-vps/) pull on VPS

Pipeline stage Deploy:

```bash
rsync -az ./dist/ deploy@vps:/var/www/app/
ssh deploy@vps 'sudo systemctl restart myapp'
```

---

## Мониторинг Jenkins

- Disk: `jenkins_home` растёт (artifacts!) — cleanup policy
- [Prometheus plugin](/blog/grafana-prometheus-vps/) — build duration, queue
- [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/) — ci.example.com
- Логи: `docker compose logs jenkins`

```groovy
// Jenkinsfile — ограничить хранение артефактов
options {
  buildDiscarder(logRotator(numToKeepStr: '20'))
}
```

---

## Бэкапы

```bash
docker run --rm -v jenkins_jenkins_home:/data -v $(pwd):/backup alpine \
  tar czf /backup/jenkins-$(date +%F).tar.gz /data
```

В volume — job configs, credentials (encrypted), plugins. Без бэкапа — потеря CI при disk failure.

---

## Типичные ошибки

| Ошибка | Fix |
| --- | --- |
| OutOfMemory | `JAVA_OPTS=-Xmx1024m`, VPS 4 GB |
| Permission denied docker.sock | Agent user в docker group |
| Webhook 403 | CSRF / GitHub IP allowlist |
| Slow queue | Добавить agents |
| Plugin hell | Pin LTS + test upgrades on staging |

---

## Безопасность checklist

- HTTPS only
- 2FA для admin
- Agent на отдельном VPS
- Не запускать unreviewed PR pipelines с secrets
- [Fail2ban](/blog/fail2ban-ot-bruteforce-vps/) + rate limit
- Обновлять LTS ежемесячно

---

## Итог

Jenkins на VPS — максимально гибкий CI/CD под ваш стек. Controller + agent, Jenkinsfile в git, webhooks, deploy на [StormNet Cloud](https://stormnetcloud.com/) VPS.

Альтернативы полегче: [GitHub Actions](/blog/github-actions-cicd/), [GitLab Runner](/blog/gitlab-runner-cicd-vps/). Jenkins — когда нужны plugins и полный контроль.
