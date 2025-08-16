# INKSPOT Monitoring & Grafana Integration

This directory contains the monitoring infrastructure for the INKSPOT application, including Grafana dashboards, Prometheus configuration, and performance monitoring.

## 🚀 Quick Start

### 1. Start Monitoring Stack

```bash
# Start with monitoring profile
docker-compose --profile monitoring up -d

# Or for development
docker-compose -f docker-compose-dev.yml --profile monitoring up -d
```

### 2. Access Grafana

- **URL**: http://localhost:3002
- **Username**: admin
- **Password**: admin123

### 3. Access Prometheus

- **URL**: http://localhost:9090

## 📊 Available Dashboards

### 1. INKSPOT Application Overview
- **File**: `monitoring/grafana/dashboards/inkspot-overview.json`
- **Description**: Comprehensive application metrics including:
  - User registrations and activity
  - Revenue metrics and trends
  - Post engagement and booking conversion
  - Message volume and search trends
  - User demographics and notification delivery

### 2. INKSPOT Performance Monitoring
- **File**: `monitoring/grafana/dashboards/inkspot-performance.json`
- **Description**: Real-time performance metrics including:
  - Page load times
  - API response times
  - Memory usage and cache hit rates
  - Network latency and error rates
  - Database performance

## 🔧 Configuration

### Grafana Datasources

The following datasources are automatically configured:

1. **INKSPOT JSON API** (Default)
   - Type: Simple JSON
   - URL: http://app:3000/api/grafana
   - Refresh: 5 seconds

2. **Prometheus**
   - Type: Prometheus
   - URL: http://prometheus:9090

3. **PostgreSQL**
   - Type: PostgreSQL
   - Host: postgres:5432
   - Database: inkspot

### Prometheus Targets

- **INKSPOT App**: `app:3000/api/metrics`
- **Node Exporter**: `node-exporter:9100`
- **PostgreSQL Exporter**: `postgres-exporter:9187`

## 📈 Metrics Collection

### Application Metrics

The application automatically collects and sends the following metrics to Grafana:

#### User Metrics
- Total user registrations
- Active users
- User demographics by role
- User activity patterns

#### Business Metrics
- Revenue trends
- Booking conversion rates
- Payment success rates
- Daily/monthly growth

#### Content Metrics
- Post engagement
- Message volume
- Search trends
- Notification delivery rates

### Performance Metrics

Real-time performance data collected from the browser:

- **Page Load Time**: Navigation timing API
- **Memory Usage**: Heap and RSS memory
- **API Response Time**: Backend performance
- **Cache Hit Rate**: Redis cache efficiency
- **Network Latency**: Request timing
- **Error Rate**: Application errors

### System Metrics

Infrastructure monitoring via Prometheus:

- **Database**: Connection status, query performance
- **Redis**: Connection status, cache metrics
- **Node**: CPU, memory, disk usage
- **Application**: Process metrics, uptime

## 🛠️ API Endpoints

### Grafana Integration

- **GET** `/api/grafana` - Grafana JSON API endpoint
- **POST** `/api/grafana` - Handle Grafana queries
- **POST** `/api/grafana/metrics` - Store performance metrics

### Prometheus Metrics

- **GET** `/api/metrics` - Prometheus format metrics

## 🔄 Real-time Updates

### Performance Monitor Component

The `PerformanceMonitor` component automatically:
- Collects browser performance metrics every 10 seconds
- Sends data to Grafana via the API
- Provides real-time performance monitoring
- Includes a direct link to Grafana dashboards

### Auto-refresh

- **Grafana Dashboards**: 5-second refresh intervals
- **Performance Metrics**: 10-second collection intervals
- **System Metrics**: 15-second Prometheus scraping

## 📱 Performance Monitor UI

The performance monitor appears as a floating button in the bottom-right corner:

- **Collapsed**: Shows "Performance" button
- **Expanded**: Displays real-time metrics with:
  - Current metric values
  - Status indicators (green/yellow/red)
  - Progress bars for percentage metrics
  - Quick actions (refresh, clear cache, open Grafana)

## 🚨 Alerting & Thresholds

### Performance Thresholds

The system includes configurable thresholds for performance metrics:

- **Page Load Time**: Warning at 2s, Critical at 5s
- **API Response Time**: Warning at 1s, Critical at 3s
- **Memory Usage**: Warning at 80%, Critical at 95%
- **Cache Hit Rate**: Warning at 60%, Critical at 40%
- **Network Latency**: Warning at 200ms, Critical at 500ms
- **Error Rate**: Warning at 5%, Critical at 15%

### Status Indicators

- 🟢 **Green**: Normal performance
- 🟡 **Yellow**: Warning threshold exceeded
- 🔴 **Red**: Critical threshold exceeded

## 🔧 Customization

### Adding New Metrics

1. **Update Grafana API** (`app/api/grafana/route.ts`):
   - Add new metric to `handleSearch()` targets
   - Implement metric collection function
   - Add to `handleQuery()` switch statement

2. **Update Dashboards**:
   - Add new panels to dashboard JSON files
   - Configure visualization types and thresholds

3. **Update Performance Monitor**:
   - Add new metric to `PerformanceMetrics` interface
   - Implement collection logic
   - Add to Grafana data sending

### Custom Dashboards

Create new dashboards by:
1. Designing in Grafana UI
2. Exporting as JSON
3. Placing in `monitoring/grafana/dashboards/`
4. Restarting Grafana container

## 🐛 Troubleshooting

### Common Issues

1. **Grafana not accessible**:
   - Check if monitoring profile is enabled
   - Verify container is running: `docker ps | grep grafana`
   - Check logs: `docker logs inkspot_grafana`

2. **No data in dashboards**:
   - Verify app is running and accessible
   - Check API endpoint responses
   - Verify datasource configuration

3. **Performance metrics not updating**:
   - Check browser console for errors
   - Verify `/api/grafana/metrics` endpoint
   - Check Redis connection

### Logs

```bash
# Grafana logs
docker logs inkspot_grafana

# Prometheus logs
docker logs inkspot_prometheus

# Application logs
docker logs inkspot_app
```

## 📚 Additional Resources

- [Grafana Documentation](https://grafana.com/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Node Exporter](https://prometheus.io/docs/guides/node-exporter/)
- [PostgreSQL Exporter](https://github.com/prometheus-community/postgres_exporter)

## 🔄 Updates & Maintenance

### Regular Tasks

1. **Dashboard Updates**: Export updated dashboards from Grafana UI
2. **Metric Validation**: Verify all metrics are being collected
3. **Performance Review**: Analyze trends and optimize thresholds
4. **Backup**: Export dashboard configurations

### Version Control

All monitoring configurations are version controlled:
- Dashboard JSON files
- Prometheus configuration
- Datasource configurations
- Provisioning settings

---

**Note**: This monitoring setup provides comprehensive visibility into your INKSPOT application. Regular review and optimization of dashboards and thresholds will help maintain optimal performance and user experience.
