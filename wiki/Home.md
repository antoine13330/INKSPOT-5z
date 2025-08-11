# INKSPOT-5z Wiki

Welcome to the INKSPOT-5z documentation. This wiki consolidates all setup, architecture, operations, and maintenance guides.

## Quick navigation
- [Getting Started](Getting-Started)
- [Environment Variables](Environment-Variables)
- [Architecture](Architecture)
- [Run with Docker](Running-with-Docker)
- [Deployment](Deployment)
- [Monitoring & Observability](Monitoring)
- [Database](Database)
- [Security](Security)
- [Performance](Performance)
- [Realtime Messaging](Realtime-Messaging)
- [Design System](Design-System)
- [Testing](Testing)
- [Troubleshooting / FAQ](Troubleshooting)
- [Useful Commands](Useful-Commands)
- [Publish the Wiki](Publishing-the-Wiki)

## What is INKSPOT-5z?
A modern social platform for professionals with bookings, payments, messaging, and rich media, built on Next.js 14, TypeScript, Prisma, PostgreSQL, Redis, and Stripe.

## At a glance
- Next.js App Router (`app/`), API routes in `app/api/*`
- Database: PostgreSQL + Prisma (`prisma/schema.prisma`)
- Realtime messaging: Socket.IO
- Payments: Stripe (Checkout + Webhooks)
- Storage: AWS S3
- Caching: Redis
- Monitoring: Prometheus + Grafana

See [Getting Started](Getting-Started) to run the app locally.