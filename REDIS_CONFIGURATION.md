# Redis Configuration for Task Management API

## Overview

This application uses Redis as a message broker for Socket.IO to enable horizontal scaling across multiple server instances. This allows realtime events to be broadcast to all connected clients regardless of which server instance they're connected to.

## Quick Start

### 1. Install Redis (Local Development)

**Ubuntu/Debian:**
```bash
sudo apt install redis-server -y
sudo systemctl start redis-server
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Windows:**
Download from [Redis for Windows](https://github.com/microsoftarchive/redis/releases)

### 2. Configure Environment

Add to your `.env` file:
```env
REDIS_URI=redis://localhost:6379
```

### 3. Start Application

```bash
npm run dev src/Server.js
```

You should see:
```
✅ Redis adapter connected successfully
```

## Configuration Options

### Local Redis
```env
REDIS_URI=redis://localhost:6379
```

### Online Redis (Free Tier)

**Upstash:**
1. Sign up at [upstash.com](https://upstash.com)
2. Create a Redis database
3. Copy the connection string:
```env
REDIS_URI=rediss://default:your-password@your-endpoint.upstash.io:6379
```

**Redis Cloud:**
1. Sign up at [redis.com/try-free](https://redis.com/try-free)
2. Create a database
3. Copy the connection string:
```env
REDIS_URI=redis://default:password@endpoint:port
```

### Production (Docker)

```env
REDIS_URI=redis://redis:6379
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes

  app:
    build: .
    environment:
      - REDIS_URI=redis://redis:6379
    depends_on:
      - redis

volumes:
  redis-data:
```

## Graceful Fallback

If Redis is unavailable, the application automatically falls back to single-instance mode:

```
❌ Failed to connect Redis adapter: connect ECONNREFUSED
⚠️  Socket.IO will run without Redis (single instance mode)
```

The application will continue to work normally, but realtime events will only be broadcast to clients connected to the same server instance.

## Testing

See [REDIS_TEST_GUIDE.md](./REDIS_TEST_GUIDE.md) for detailed testing instructions.

## Multi-Instance Deployment

To run multiple instances:

```bash
# Terminal 1
PORT=3000 npm run dev src/Server.js

# Terminal 2
PORT=3001 npm run dev src/Server.js

# Terminal 3
PORT=3002 npm run dev src/Server.js
```

All instances will share realtime events through Redis pub/sub.

## Monitoring

Check Redis connection:
```bash
redis-cli ping
# Output: PONG
```

Check connected clients:
```bash
redis-cli info clients
# Should show at least 3 clients (pub, sub, cli)
```

Monitor Redis pub/sub:
```bash
redis-cli monitor
```

## Troubleshooting

**Connection refused:**
- Ensure Redis is running: `sudo systemctl status redis-server`
- Check Redis URI in `.env`

**High memory usage:**
- Redis stores messages temporarily
- Configure maxmemory in redis.conf
- Use Redis eviction policies

**Slow performance:**
- Check Redis latency: `redis-cli --latency`
- Consider Redis cluster for high load
- Monitor with `redis-cli info stats`
