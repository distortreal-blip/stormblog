---
title: "k3s на VPS: легковесный Kubernetes за 10 минут"
description: "Установка k3s на VPS: поды, сервисы, Ingress, Helm. Production-ready Kubernetes без тяжёлого K8s для 1–3 серверов."
pubDate: 2026-07-04
category: Облака
keywords:
  - "k3s VPS"
  - "Kubernetes VPS"
  - "легкий Kubernetes"
  - "k3s install"
  - "Helm VPS"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** k3s — облегчённый Kubernetes от Rancher. Одна команда на VPS — рабочий кластер. Для 1–3 серверов k3s практичнее полного K8s и проще [Minikube](/blog/kubernetes-minikube-vps/).

Когда [Docker Compose](/blog/docker-compose-vps/) не хватает для оркестрации, а полный Kubernetes пугает — k3s золотая середина.

---

## k3s vs Minikube vs Docker Swarm

| | k3s | Minikube | Swarm |
| --- | --- | --- | --- |
| Production | Да | Нет (dev) | Да |
| RAM минимум | 1 GB | 2 GB | 1 GB |
| Multi-node | Да | Сложно | Да |
| Экосистема K8s | Полная | Полная | Docker-only |

---

## Установка single-node

```bash
curl -sfL https://get.k3s.io | sh -
sudo kubectl get nodes
```

Kubeconfig:

```bash
sudo cat /etc/rancher/k3s/k3s.yaml
```

Подготовка VPS — [Ubuntu настройка](/blog/ubuntu-24-04-pervaya-nastroyka-vps/).

---

## Деплой приложения

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
        - name: api
          image: myapi:latest
          ports:
            - containerPort: 8080
---
apiVersion: v1
kind: Service
metadata:
  name: api
spec:
  selector:
    app: api
  ports:
    - port: 80
      targetPort: 8080
```

```bash
kubectl apply -f api.yaml
```

---

## Ingress (Traefik встроен в k3s)

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt
spec:
  tls:
    - hosts: [api.example.com]
      secretName: api-tls
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api
                port:
                  number: 80
```

Альтернатива — [Traefik standalone](/blog/traefik-reverse-proxy-vps/).

---

## Multi-node кластер

На втором VPS:

```bash
curl -sfL https://get.k3s.io | K3S_URL=https://manager:6443 K3S_TOKEN=xxx sh -
```

Связь между нодами — приватная сеть или [WireGuard](/blog/wireguard-vpn-na-vps/).

---

## Helm

```bash
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install redis bitnami/redis
```

---

## RAM

| Кластер | RAM |
| --- | --- |
| 1 node, 2–3 пода | 2 GB |
| 1 node, 10+ подов | 4 GB |
| 3 nodes | 2 GB per node |

Мониторинг — [Grafana](/blog/grafana-prometheus-vps/) + kube-prometheus-stack.

---

## k3s vs managed Kubernetes

Self-hosted k3s на [StormNet Cloud](https://stormnetcloud.com/) дешевле managed при 1–3 серверах. Managed — когда нужен SLA и control plane без забот.

---

## Итог

k3s — вход в Kubernetes без боли. Один VPS для старта, масштаб на worker-ноды по мере роста.

VPS от 2 GB — [StormNet Cloud](https://stormnetcloud.com/). IaC — [Terraform](/blog/terraform-vps-infrastruktura/). Swarm проще — [Docker Swarm](/blog/docker-swarm-na-vps/).
