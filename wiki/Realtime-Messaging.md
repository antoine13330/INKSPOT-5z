# Realtime Messaging

Socket.IO powers conversations with typing indicators, read receipts, presence, and attachments.

## Dev usage
```bash
pnpm run dev
# WebSocket endpoint: http://localhost:3000/api/socketio
```

## Production
App and WebSocket services run as separate containers. See `docker-compose.yml`.

## Client hook
```ts
import { useWebSocket } from "@/hooks/useWebSocket"
const { sendMessage, onNewMessage } = useWebSocket({ conversationId, autoConnect: true })
```

## Events
- join/leave conversation
- send/new message
- typing start/stop
- mark read, user status

Troubleshooting: ensure auth is valid, conversation membership is enforced, and DB is reachable.

See `WEBSOCKET_SETUP_GUIDE.md` for detailed examples.