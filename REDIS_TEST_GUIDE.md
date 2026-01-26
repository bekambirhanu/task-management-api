# Redis Integration Test Guide

## Manual Testing Steps

### Prerequisites
- Redis server running (`sudo systemctl start redis-server`)
- Server running (`npm run dev src/Server.js`)

### Test 1: Single Instance Realtime Features

1. **Connect a client** to the WebSocket server at `ws://localhost:3000`
2. **Authenticate** using a valid JWT token
3. **Test task events:**
   - Emit `create_task` event with task data
   - Verify `create_request` event is received
   - Verify task is created in database
4. **Test notifications:**
   - Emit `get_notifications` event
   - Verify `get_request` event with notifications
5. **Test presence:**
   - Emit `update_activity` event
   - Emit `get_online_users` event
   - Verify `online_users` event is received

### Test 2: Multi-Instance Broadcasting

1. **Start multiple server instances:**
   ```bash
   # Terminal 1
   PORT=3000 npm run dev src/Server.js
   
   # Terminal 2
   PORT=3001 npm run dev src/Server.js
   ```

2. **Connect clients to different instances:**
   - Client A → `ws://localhost:3000`
   - Client B → `ws://localhost:3001`

3. **Test cross-instance events:**
   - Client A creates a task assigned to Client B
   - Verify Client B receives `task_assigned` event
   - Client B updates task status
   - Verify Client A receives `task_update` event

### Test 3: Redis Fallback

1. **Stop Redis server:**
   ```bash
   sudo systemctl stop redis-server
   ```

2. **Restart application:**
   ```bash
   npm run dev src/Server.js
   ```

3. **Verify fallback message:**
   ```
   ❌ Failed to connect Redis adapter: connect ECONNREFUSED 127.0.0.1:6379
   ⚠️  Socket.IO will run without Redis (single instance mode)
   ```

4. **Test realtime features still work** (single instance only)

5. **Restart Redis:**
   ```bash
   sudo systemctl start redis-server
   ```

## Automated Test (Optional)

Create a test file to verify Redis integration:

```javascript
// tests/socket/redis-integration.test.js
const io = require('socket.io-client');
const { createClient } = require('redis');

describe('Redis Integration', () => {
  let redisClient;
  
  beforeAll(async () => {
    redisClient = createClient({ url: 'redis://localhost:6379' });
    await redisClient.connect();
  });
  
  afterAll(async () => {
    await redisClient.disconnect();
  });
  
  test('Redis should be connected', async () => {
    const pong = await redisClient.ping();
    expect(pong).toBe('PONG');
  });
  
  test('Socket.IO should use Redis adapter', async () => {
    const info = await redisClient.info('clients');
    expect(info).toContain('connected_clients');
    // Should have at least 3 clients (pub, sub, test)
    const match = info.match(/connected_clients:(\d+)/);
    expect(parseInt(match[1])).toBeGreaterThanOrEqual(3);
  });
});
```

## Expected Results

✅ **Single Instance:**
- All realtime events work correctly
- Redis shows 3 connected clients
- No errors in console

✅ **Multi-Instance:**
- Events broadcast across all instances
- Clients on different instances receive events
- Redis pub/sub handles message routing

✅ **Fallback:**
- Application starts without Redis
- Warning message displayed
- Single-instance mode works correctly
