---
title: "OpenSearch на VPS: централизованные логи и полнотекстовый поиск"
description: "OpenSearch на VPS: Docker cluster, ingest pipelines, Dashboards, интеграция с Nginx и приложениями. Альтернатива ELK для малого production."
pubDate: 2026-07-07
category: DevOps
keywords:
  - "OpenSearch VPS"
  - "ELK alternative"
  - "log aggregation"
  - "OpenSearch Dashboards"
  - "centralized logging"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** OpenSearch — форк Elasticsearch для логов и search. На VPS 4 GB: single-node Docker, Dashboards, ingest nginx/app logs. Дополняет [Loki+Grafana](/blog/loki-grafana-logi-vps/) или заменяет ELK если нужен full-text и rich queries.

Когда [journalctl](/blog/journalctl-logi-linux-vps/) на 5 серверах уже не масштабируется — центральный OpenSearch + retention policy.

---

## OpenSearch vs Loki vs Elasticsearch

| | OpenSearch | Loki | Elasticsearch |
| --- | --- | --- | --- |
| Лицензия | Apache 2.0 | AGPL | Elastic license |
| Full-text | Отлично | Labels + LogQL | Отлично |
| RAM | 4 GB+ | 1–2 GB | 4 GB+ |
| Metrics | Dashboards | Grafana native | Kibana |

Стек: metrics в [Prometheus](/blog/grafana-prometheus-vps/), logs в OpenSearch или Loki — не обязательно «или-или».

---

## Single-node Docker (staging / small prod)

```yaml
services:
  opensearch:
    image: opensearchproject/opensearch:2
    environment:
      - discovery.type=single-node
      - OPENSEARCH_JAVA_OPTS=-Xms2g -Xmx2g
      - DISABLE_SECURITY_PLUGIN=true  # только dev! включите security в prod
    volumes:
      - os-data:/usr/share/opensearch/data
    ports:
      - "127.0.0.1:9200:9200"

  dashboards:
    image: opensearchproject/opensearch-dashboards:2
    environment:
      - OPENSEARCH_HOSTS=["http://opensearch:9200"]
      - DISABLE_SECURITY_DASHBOARDS_PLUGIN=true
    ports:
      - "127.0.0.1:5601:5601"
    depends_on:
      - opensearch

volumes:
  os-data:
```

Production: включите security plugin, TLS, fine-grained roles.

---

## Индекс и retention

```bash
# Создать index pattern для nginx logs
curl -X PUT "localhost:9200/nginx-logs-000001" -H 'Content-Type: application/json' -d'
{
  "settings": { "number_of_shards": 1, "number_of_replicas": 0 }
}'
```

Index Lifecycle Management (ISM):

- Hot: 7 days на SSD
- Delete: после 30 days (adjust под compliance)

---

## Отправка логов Nginx

Filebeat/Fluent Bit → OpenSearch:

```yaml
# fluent-bit.conf output
[OUTPUT]
    Name  opensearch
    Match nginx.*
    Host  127.0.0.1
    Port  9200
    Index nginx-logs
```

Парсинг — [nginx log format](/blog/nginx-logi-i-oshibki/) combined → JSON fields.

---

## Dashboards queries

```
status:502 AND @timestamp:[now-1h TO now]
```

Visualize:

- 5xx rate over time
- Top slow endpoints
- Geo map (если есть geoip filter)

Алерты — OpenSearch Alerting plugin → [Alertmanager-style](/blog/prometheus-alertmanager-vps/) Telegram webhook.

---

## Application logs

JSON logs из [Django](/blog/django-deploy-na-vps/), [Node](/blog/nodejs-pm2-deploy/), [Go](/blog/go-golang-deploy-vps/):

```json
{"level":"error","msg":"payment failed","user_id":123,"@timestamp":"..."}
```

Structured logging упрощает query `level:error AND msg:"payment"`.

---

## RAM tuning на VPS 4 GB

```env
OPENSEARCH_JAVA_OPTS=-Xms2g -Xmx2g
```

Heap = 50% RAM max. Остальное — OS cache для Lucene. Не ставьте heap 4 GB на VPS 4 GB — OOM killer убьёт node.

---

## Security (production)

1. Включите security plugin
2. Internal users + roles
3. TLS между nodes (multi-node)
4. Dashboards за [Authentik](/blog/authentik-sso-vps/) или VPN
5. Не expose 9200 в интернет

```bash
# Prod: только localhost + Nginx auth
ss -tlnp | grep 9200
```

---

## Multi-node (когда вырастете)

3 VPS: master + data nodes. Minimum production HA — 3×4 GB. До этого single-node + good backups достаточно.

---

## Бэкапы

Snapshot repository — [MinIO S3](/blog/minio-s3-na-vps/):

```bash
curl -X PUT "localhost:9200/_snapshot/my_s3_repo" ...
curl -X PUT "localhost:9200/_snapshot/my_s3_repo/snap_1?wait_for_completion=true"
```

Или stop container + tar volume (downtime).

---

## Типичные проблемы

| Симптом | Fix |
| --- | --- |
| Yellow cluster | single-node — normal без replicas |
| Disk full | ISM delete old indices |
| GC overhead | Reduce heap / add RAM |
| Slow queries | Index templates, avoid wildcard leading |
| Circuit breaker | Fielddata limit, keyword vs text |

---

## Связка с мониторингом

- Metrics: [Grafana Prometheus](/blog/grafana-prometheus-vps/)
- Logs: OpenSearch
- Traces: optional Jaeger (отдельная тема)
- Uptime: [Uptime Kuma](/blog/uptime-kuma-monitoring-vps/)

Единый on-call: алерт из Prometheus + drill-down logs в Dashboards.

---

## Итог

OpenSearch на VPS — мощный log hub для нескольких сервисов. 4 GB RAM, single-node, ISM retention, Fluent Bit ingest — production baseline для малой команды.

VPS 4 GB — [StormNet Cloud](https://stormnetcloud.com/). Лёгкая альтернатива — [Loki](/blog/loki-grafana-logi-vps/). Search на сайте — [Meilisearch](/blog/meilisearch-poisk-na-vps/).
