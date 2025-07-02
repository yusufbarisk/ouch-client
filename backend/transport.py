import asyncio
from soupbin_msgs import *
from dotenv import load_dotenv
import os
import logging
import json
from heartbeat_controller import HeartbeatController
from ouch_msgs import OUCH_MessageFactory


class OuchClient(asyncio.Protocol):

    hb: Optional["HeartbeatController"] = None

    def __init__(self, pub):
        self.logger = logging.getLogger(__name__)
        self.logger.setLevel(logging.DEBUG)
        self.transport = None
        self._buffer = bytearray()
        self.send_q = asyncio.Queue()
        self.next_seq = 0
        self.pub = pub

    def connection_made(self, transport: asyncio.Transport):
        self.transport = transport
        # Initiate writer coroutine
        asyncio.create_task(self._writer())

        test_username = os.getenv("TEST_USERNAME", "default_user")
        test_password = os.getenv("TEST_PASSWORD", "default_pass")
        # Send a login request
        asyncio.create_task(self.send_q.put(LoginRequest(username=test_username, password=test_password)))

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
            
            self.handle_incoming_message(msg)

    def connection_lost(self, exc):
        self.on_disconnect(exc)

    async def _writer(self):
        while True:
            msg = await self.send_q.get()
            frame = SoupPacketFactory.serialize(msg)
    
            assert self.transport is not None 
            self.transport.write(frame)
            self.logger.debug(f"Sent: {msg}")
            if isinstance(msg, SequencedData):
                self.next_seq += 1
                self.logger.info(f"📤 Incremented SeqNo to: {self.next_seq}")
    

    # will send received acks and heartbeats
  

    def handle_incoming_message(self, msg):
        """Handle incoming messages."""
        # if(msg.TYPE_ID != PacketType.SERVER_HEARTBEAT.value):
        self.logger.debug(f"Received message: {msg}")
        
        if isinstance(msg, ServerHeartbeat):
            if self.hb:
                self.logger.debug("Updating server timestamp")
                self.hb.refresh_server_timestamp()
            else:
                self.logger.warning("Heartbeat controller not initialized, skipping timestamp update")


        if isinstance(msg, LoginAccepted):
            self.next_seq = msg.sequence_number
            self.logger.info("✅ Login accepted setting next seq number to " + str(self.next_seq))

        if isinstance(msg, LoginRejected):
            self.logger.warning(f"❌ Login rejected: {msg.reason}")

         # Promote to OUCH Handlers   
        if isinstance(msg, SequencedData):
            # self.logger.info(f"📊 Sequenced data: {msg}")
            ouch_msg = OUCH_MessageFactory.create_message(msg.message) # may need some slicing debug later
            
            if ouch_msg:
                self.logger.info(f"📊 Processed OUCH message: {ouch_msg}")

                payload = {k: v for k, v in ouch_msg.__dict__.items() if k != "reserved_bits"}
                self.send_event("Type: " + ouch_msg.TYPE_ID.decode(), payload)

        if isinstance(msg, UnsequencedData):
            self.logger.info(f"📈 Unsequenced data: {msg}")
 
        # self.send_event("message_received", {"type": "incoming", "content": str(msg)})

    def send_outgoing_msg(self, msg):
        """Relay a message to the server."""
        
        asyncio.create_task(self.send_q.put(msg))


    def on_disconnect(self, exc):
        self.logger.warning(f"⚠️ Disconnected: {exc}")

    def send_event(self, event_type: str, payload: dict):
        envelope = {"type": event_type, "payload": payload}
        json_str = json.dumps(envelope)
        self.logger.debug(f"Sending event: {json_str}")
        self.pub.send_string(json.dumps(envelope))