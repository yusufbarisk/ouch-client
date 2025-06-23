import asyncio
import logging
from datetime import datetime, timezone
from soupbin_msgs import ClientHeartbeat, ServerHeartbeat
from transport import OuchClient

logger = logging.getLogger(__name__)

class HeartbeatController:

    timeoutThreshold = 5  # seconds

    def __init__(self, client: OuchClient):
        self.client = client
        self.clientTimestamp = datetime.now(timezone.utc)
        self.serverTimestamp = datetime.now(timezone.utc)
        self._task = asyncio.create_task(self._heartbeat())
        logger.info("Heartbeat controller initialized")

    async def _heartbeat(self):
        while True:
            try:
                current_time = datetime.now(timezone.utc)
                if (current_time - self.clientTimestamp).total_seconds() > self.timeoutThreshold:
                    logger.debug("Sending heartbeat")
                    await self.client.send_q.put(ClientHeartbeat())
                    self.refresh_client_timestamp()
                
                # Check server timestamp too
                if (current_time - self.serverTimestamp).total_seconds() > self.timeoutThreshold * 2:
                    logger.warning(f"No server heartbeat received in {self.timeoutThreshold * 2} seconds")
                
                await asyncio.sleep(1)
            except Exception as e:
                logger.error(f"Error in heartbeat loop: {e}")
                await asyncio.sleep(5)

    def refresh_client_timestamp(self):
        self.clientTimestamp = datetime.now(timezone.utc)
        logger.debug("Client timestamp refreshed")

    def refresh_server_timestamp(self):
        self.serverTimestamp = datetime.now(timezone.utc)
        logger.debug("Server timestamp refreshed")
