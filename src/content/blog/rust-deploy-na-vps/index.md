---
title: "Rust на VPS: деплой production-бинарника"
description: "Деплой Rust на VPS: cargo build --release, systemd, Nginx, кросс-компиляция. Максимальная производительность на минимальном RAM."
pubDate: 2026-07-03
category: Разработка
keywords:
  - "Rust VPS"
  - "деплой Rust"
  - "cargo release"
  - "Rust production"
  - "systemd Rust"
  - "Storm Cloud"
heroImage: ./cover.webp
---

**Краткий ответ:** `cargo build --release` → один бинарник на VPS → systemd. Nginx для SSL. Rust потребляет 5–20 MB RAM — идеален для [1 GB VPS](/blog/choose-vps/).

Rust на VPS — как [Go](/blog/go-golang-deploy-vps/): статическая компиляция, без runtime. Но zero-cost abstractions и memory safety без GC.

---

## Сборка release

```bash
cargo build --release
# target/release/myapp — готов к деплою
```

Кросс-компиляция для VPS (musl = полностью static):

```bash
rustup target add x86_64-unknown-linux-musl
cargo build --release --target x86_64-unknown-linux-musl
```

---

## Деплой

```bash
scp target/release/myapp deploy@VPS:/opt/myapp/myapp
```

```ini
[Unit]
Description=Rust API
After=network.target

[Service]
User=deploy
WorkingDirectory=/opt/myapp
ExecStart=/opt/myapp/myapp
Restart=on-failure
Environment=RUST_LOG=info

[Install]
WantedBy=multi-user.target
```

[systemd](/blog/systemd-linux-servisy/) + [Nginx](/blog/nginx-ili-caddy/) reverse proxy.

---

## Docker альтернатива

```dockerfile
FROM rust:1.78 AS builder
WORKDIR /app
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim
COPY --from=builder /app/target/release/myapp /usr/local/bin/
CMD ["myapp"]
```

[multi-stage build](/blog/docker-multi-stage-builds/) — образ ~20 MB.

---

## Мониторинг

- RUST_LOG=debug для отладки
- tracing crate → JSON logs → [Loki](/blog/loki-grafana-logi-vps/)
- /metrics endpoint → [Prometheus](/blog/grafana-prometheus-vps/)

---

## Rust vs Go на VPS

| | Rust | Go |
| --- | --- | --- |
| RAM | 5–20 MB | 20–50 MB |
| Compile time | Дольше | Быстрее |
| Performance | Максимум | Высокая |
| Learning curve | Круче | Мягче |

---

## Итог

Rust — для latency-critical API на маленьком VPS. Один бинарник, systemd, минимум RAM.

VPS от 1 GB — [StormNet Cloud](https://stormnetcloud.com/). Логи — [journalctl](/blog/journalctl-logi-linux-vps/).
