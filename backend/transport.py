import asyncio
from soupbin_msgs import *
from dotenv import load_dotenv
import os
import logging
from heartbeat_controller import HeartbeatController

class OuchClient(asyncio.Protocol):
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.logger.setLevel(logging.DEBUG)
        self.transport = None
        self._buffer = bytearray()
        self.send_q = asyncio.Queue()
        self.hb = None

    def connection_made(self, transport: asyncio.Transport):
        self.transport = transport
        # Initiate writer coroutine
        asyncio.create_task(self._writer())

        test_username = os.getenv("TEST_USERNAME", "default_user")
        test_password = os.getenv("TEST_PASSWORD", "default_pass")
        # Send a login request
        res = self.send_q.put(LoginRequest(username=test_username, password=test_password))

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
            frame = SoupPacketFactory.serialize(msg)

            assert self.transport is not None 
            self.transport.write(frame)
            self.logger.debug(f"Sent: {msg}")

    def handle_message(self, msg):
        """Handle incoming messages."""
        self.logger.debug(f"Received: {msg}")
        
        if isinstance(msg, ServerHeartbeat):
            # Update server timestamp
            if self.hb:
                self.logger.debug("Updating server timestamp")
                self.hb.refresh_server_timestamp()
            else:
                self.logger.warning("Heartbeat controller not initialized, skipping timestamp update")
            self.logger.info("💓 Server heartbeat received")
            
        elif isinstance(msg, LoginAccepted):
            self.logger.info("✅ Login accepted")
        elif isinstance(msg, LoginRejected):
            self.logger.warning(f"❌ Login rejected: {msg.reason}")
        elif isinstance(msg, SequencedData):
            self.logger.info(f"📊 Sequenced data: {msg}")
        elif isinstance(msg, UnsequencedData):
            self.logger.info(f"📈 Unsequenced data: {msg}")
        else:
            self.logger.warning(f"❓ Unknown message type: {type(msg)}")


    def on_disconnect(self, exc):
        self.logger.warning(f"⚠️ Disconnected: {exc}")

async def main():
    # Load environment variables
    load_dotenv()
    host_addr = os.getenv("HOST_ADDR")
    hport = os.getenv("HOST_PORT")

    def factory() -> OuchClient:
        client = OuchClient()
        HeartbeatController(client)  # Initialize heartbeat controller
        return client
    
    if not host_addr or not hport:
        raise ValueError("HOST_ADDR and HOST_PORT must be set in the environment variables")
    
    loop = asyncio.get_running_loop()
    await loop.create_connection(
        lambda: factory(),  
        host=str(host_addr), port=int(hport))

asyncio.run(main())
