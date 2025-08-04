# 📊 INKSPOT Grafana Integration Setup Guide

## 🎯 Overview

This guide sets up comprehensive monitoring for your INKSPOT application using Grafana, Prometheus, and custom metrics collection. The integration provides real-time insights into:

- **Application Metrics**: User activity, posts, messages, bookings, payments
- **Business Metrics**: Revenue, conversion rates, user engagement
- **Technical Metrics**: Database performance, system resources, API response times
- **Real-time Monitoring**: Live activity tracking and alerts

## 🚀 Quick Start

### 1. Environment Setup

First, ensure your environment variables are properly configured:

```bash
# Add to your .env file
DATABASE_URL="postgresql://username:password@localhost:5432/inkspot"
POSTGRES_DB="inkspot"
POSTGRES_USER="username" 
POSTGRES_PASSWORD="password"
```

### 2. Start Monitoring Stack

```bash
# Start all monitoring services
docker-compose up -d

# Check services are running
docker-compose ps
```

### 3. Access Dashboards

- **Grafana**: http://localhost:3001 (admin/admin123)
- **Prometheus**: http://localhost:9090
- **Your App**: http://localhost:3000

## 📋 Services Overview

### Grafana (Port 3001)
- **Purpose**: Visualization and dashboards
- **Login**: admin / admin123
- **Features**: Pre-configured dashboards, alerts, data sources

### Prometheus (Port 9090)
- **Purpose**: Metrics collection and storage
- **Scrapes**: Application metrics every 30s
- **Retention**: 200 hours of data

### Node Exporter (Port 9100)
- **Purpose**: System metrics (CPU, memory, disk)
- **Metrics**: Hardware and OS level statistics

### Postgres Exporter (Port 9187)
- **Purpose**: Database performance metrics
- **Metrics**: Connections, queries, database size

## 📊 Available Dashboards

### 1. Application Overview
**File**: `monitoring/grafana/dashboards/inkspot-overview.json`
- Total users and growth
- Revenue metrics
- Content engagement
- Payment success rates
- System health

### 2. Business Metrics  
**File**: `monitoring/grafana/dashboards/inkspot-business.json`
- Daily revenue trends
- Booking conversion funnel
- PRO user statistics
- User engagement scores
- Top search terms

### 3. Technical Metrics
**File**: `monitoring/grafana/dashboards/inkspot-technical.json`
- Database connections and performance
- System resource usage (CPU, Memory, Disk)
- Network traffic
- Application uptime

### 4. Real-time Activity
**File**: `monitoring/grafana/dashboards/inkspot-realtime.json`
- Live user activity
- Current system load
- Error rates and response times
- Real-time business metrics

## 🔔 Alert Configuration

### Critical Alerts
- **Application Down**: Triggers in 1 minute
- **High Error Rate**: >5% errors for 5 minutes
- **Payment Failures**: >10% failure rate for 15 minutes
- **Database Issues**: Connection problems or downtime

### Warning Alerts
- **High Resource Usage**: CPU >80% or Memory >85%
- **Slow Response Times**: 95th percentile >3 seconds
- **Low User Engagement**: Engagement score <1 for 30 minutes
- **Revenue Drops**: 50% below yesterday's levels

### Business Alerts
- **Booking Conversion**: <30% conversion rate
- **User Registration Drop**: No new users for 2 hours
- **Search Anomalies**: Unusual search volume patterns

## 🛠 API Endpoints

### Metrics Endpoint
```
GET /api/metrics
```
Returns Prometheus-formatted metrics for all application data.

### Health Check
```
GET /api/health
```
Comprehensive health status including database connectivity.

### Custom Grafana API
```
POST /api/grafana
```
JSON datasource for custom queries and visualizations.

## 📈 Key Metrics Tracked

### User Metrics
- `inkspot_users_total` - Total registered users
- `inkspot_users_active` - Currently active users
- `inkspot_users_pro` - PRO account holders
- `inkspot_users_verified` - Verified users
- `inkspot_users_new_today` - Daily registrations
- `inkspot_users_active_today` - Daily active users

### Content Metrics
- `inkspot_posts_total` - Total posts created
- `inkspot_posts_today` - Posts created today
- `inkspot_likes_total` - Total likes given
- `inkspot_comments_total` - Total comments made
- `inkspot_likes_today` - Likes given today

### Business Metrics
- `inkspot_revenue_total` - Total revenue (EUR)
- `inkspot_revenue_today` - Today's revenue
- `inkspot_bookings_total` - Total bookings
- `inkspot_bookings_pending` - Pending bookings
- `inkspot_bookings_confirmed` - Confirmed bookings
- `inkspot_bookings_completed` - Completed bookings

### Payment Metrics
- `inkspot_payments_total` - Total payments
- `inkspot_payments_successful` - Successful payments
- `inkspot_payments_pending` - Pending payments
- `inkspot_payments_failed` - Failed payments

### Communication Metrics
- `inkspot_conversations_total` - Total conversations
- `inkspot_messages_total` - Total messages
- `inkspot_messages_today` - Messages sent today

### Engagement Metrics
- `inkspot_follows_total` - Total follows
- `inkspot_reviews_total` - Total reviews
- `inkspot_rating_average` - Average rating
- `inkspot_searches_total` - Total searches
- `inkspot_notifications_unread` - Unread notifications

## 🔧 Integration with Application Code

### Tracking User Actions

```typescript
import { trackUserAction, trackBusinessEvent } from '@/middleware/monitoring'

// Track user actions
trackUserAction('post_created', userId, { postId, hashtags })
trackUserAction('message_sent', userId, { conversationId })
trackUserAction('booking_requested', userId, { proId, amount })

// Track business events
trackBusinessEvent('payment_completed', amount, { bookingId })
trackBusinessEvent('user_upgraded_to_pro', 0, { userId })
```

### Wrapping API Routes with Monitoring

```typescript
import { withMonitoring } from '@/middleware/monitoring'

export const GET = withMonitoring(async (request: NextRequest) => {
  // Your API logic here
  return NextResponse.json({ data: 'example' })
})
```

## 🚨 Troubleshooting

### Common Issues

#### Grafana Shows "No Data"
1. Check Prometheus is running: `curl http://localhost:9090`
2. Verify metrics endpoint: `curl http://localhost:3000/api/metrics`
3. Check Prometheus targets: http://localhost:9090/targets

#### Database Metrics Missing
1. Ensure `DATABASE_URL` is correctly set
2. Check postgres-exporter logs: `docker-compose logs postgres-exporter`
3. Verify database permissions

#### Application Metrics Not Updating
1. Check application is using monitoring middleware
2. Verify `/api/metrics` returns data
3. Check Prometheus scrape configuration

### Performance Considerations

#### Memory Usage
- Metrics are stored in-memory by default
- For production, consider Redis for metrics storage
- Monitor dashboard refresh rates (set to reasonable intervals)

#### Database Impact
- Metrics queries are optimized with proper indexing
- Consider read replicas for heavy monitoring workloads
- Use connection pooling

## 🔒 Security

### Access Control
- Change default Grafana password immediately
- Use environment variables for sensitive configuration
- Restrict network access to monitoring ports in production

### Data Privacy
- Metrics do not expose personal user data
- All tracking is aggregated and anonymized
- Consider GDPR compliance for user action tracking

## 📚 Advanced Configuration

### Custom Metrics
Add custom metrics by extending the `/api/metrics` endpoint:

```typescript
// Add to app/api/metrics/route.ts
metrics.push(formatMetric('custom_metric_name', value, { label: 'value' }, 'Help text'))
```

### Custom Dashboards
1. Create dashboard in Grafana UI
2. Export JSON configuration
3. Save to `monitoring/grafana/dashboards/`
4. Restart Grafana to auto-load

### Alert Channels
Configure notification channels in Grafana:
- Email notifications
- Slack integration
- Webhook endpoints
- PagerDuty integration

## 🎯 Production Recommendations

### High Availability
- Run Grafana and Prometheus in cluster mode
- Use external storage for Grafana (database)
- Set up Prometheus federation for multiple instances

### Backup Strategy
- Regular backups of Grafana configuration
- Prometheus data retention policies
- Export critical dashboard configurations

### Monitoring the Monitor
- Set up uptime monitoring for Grafana itself
- Monitor Prometheus storage usage
- Alert on monitoring system failures

## 📞 Support

For issues or questions:
1. Check logs: `docker-compose logs [service-name]`
2. Verify configuration files in `monitoring/` directory
3. Review Prometheus targets and Grafana datasources
4. Consult individual service documentation

## 🔄 Maintenance

### Regular Tasks
- Update dashboard refresh rates based on usage
- Review and tune alert thresholds
- Clean up old metric data
- Update service configurations

### Monthly Reviews
- Analyze dashboard usage patterns
- Optimize slow-performing queries
- Review alert noise and effectiveness
- Plan capacity upgrades

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Compatibility**: INKSPOT-5z v0.1.0