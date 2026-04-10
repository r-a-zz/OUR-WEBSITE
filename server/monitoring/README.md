# Monitoring Starter

This folder contains a Grafana starter dashboard for the API metrics exposed by `GET /api/metrics`.

## What's Included

- `grafana-dashboard.json`
  - Request rate by route
  - p95 latency by route
  - 5xx error rate by route
  - Cache hit ratio

## Prometheus Scrape Config Example

```yaml
scrape_configs:
  - job_name: our-website-api
    metrics_path: /api/metrics
    static_configs:
      - targets:
          - localhost:5000
```

## Grafana Import

1. Open Grafana.
2. Go to Dashboards > Import.
3. Upload `grafana-dashboard.json`.
4. Select your Prometheus data source.
5. Save.

## Notes

- Metrics are enabled by default via `METRICS_ENABLED=true`.
- If you disable metrics, `/api/metrics` returns 404.
- In production, consider limiting access to `/api/metrics` at the gateway level.
