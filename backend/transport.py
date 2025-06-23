import asyncio
from soupbin_msgs import *

class OuchClient(asyncio.Protocol):
    def __init__(self):
        self.transport = None
        self._buffer = bytearray()
        self.send_q = asyncio.Queue()

    def connection_made(self, transport):
        self.transport = transport
        # kick off your writer coroutine
        asyncio.create_task(self._writer())
        # (optional) notify your app that you’re connected
        self.on_connect()

    def data_received(self, data: bytes):
        self._buffer.extend(data)

        while True:
            try:
                msg, consumed = SoupPacketFactory.parse_frame(memoryview(self._buffer))
            except KeyError:
                raise ValueError("Unknown type byte in frame")
            if consumed == 0:
                break
            # advance 
            del self._buffer[:consumed]
            
            self.handle_message(msg)

    def connection_lost(self, exc):
        self.on_disconnect(exc)

    async def _writer(self):
        while True:
            msg = await self.send_q.get()
            frame = .build_frame(msg)
            self.transport.write(frame)



    def on_connect(self):
        """Called once when the TCP connection is up."""
        # e.g. send a LoginRequest here:
        # await self.send_q.put(LoginRequest(...))

    def handle_message(self, msg):
        """Handle incoming messages."""
        print("▶️ Received:", msg)
        
        if isinstance(msg, ServerHeartbeat):
            print("💓 Server heartbeat received")
        elif isinstance(msg, LoginAccepted):
            print("✅ Login accepted")
        elif isinstance(msg, LoginRejected):
            print("❌ Login rejected:", msg.reason)
        elif isinstance(msg, SequencedData):
            print("📊 Sequenced data:", msg.data)
        elif isinstance(msg, UnsequencedData):
            print("📈 Unsequenced data:", msg.data)
        else:
            print("❓ Unknown message type:", type(msg))


    def on_disconnect(self, exc):
        print("⚠️ Disconnected:", exc)

# ────────────────────────────────────────────────────────────────────

async def main():
    loop = asyncio.get_running_loop()
    await loop.create_connection(
        lambda: OuchClient(),  # factory returns a fresh Protocol
        "nasdaq-gw.example.com", 12345)

asyncio.run(main())
