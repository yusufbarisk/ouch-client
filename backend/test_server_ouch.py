#!/usr/bin/env python3
"""
Enhanced SoupBinTCP server for OUCH client testing.
Provides both automatic responses and manual message injection via keyboard.
"""

import asyncio
import struct
import random
import argparse
import logging
import sys
import signal
from datetime import datetime, timezone
from typing import Dict, Optional, Callable, Any

from soupbin_msgs import *
from ouch_msgs import *

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("ouch-test-server")

# Default settings
HOST = "0.0.0.0"
PORT = 9999

# Global state
active_connections = {}
next_order_id = 10000


class OuchTestServer:
    def __init__(self, host=HOST, port=PORT):
        self.host = host
        self.port = port
        self.server = None
        self.next_order_id = 10000
        self.connections = {}
        self.cmd_handlers = self._setup_commands()
        
    def _setup_commands(self):
        """Set up command mappings for interactive control"""
        return {
            'h': (self._cmd_heartbeat, "Send heartbeat to all clients"),
            'r': (self._cmd_reject_order, "Reject next order"),
            'a': (self._cmd_accept_order, "Accept next order with ACK"),
            'e': (self._cmd_execute, "Execute an order"),
            'c': (self._cmd_cancel, "Cancel an order"),
            'q': (self._cmd_quit, "Quit server"),
            '?': (self._cmd_help, "Show this help"),
        }
        
    async def _cmd_heartbeat(self, *args):
        """Send heartbeat to all clients"""
        for writer in self.connections.values():
            heartbeat = ServerHeartbeat()
            frame = SoupPacketFactory.serialize(heartbeat)
            writer.write(frame)
            await writer.drain()
        logger.info("💓 Sent heartbeat to all clients")
        
    async def _cmd_reject_order(self, *args):
        """Reject the next order"""
        logger.info("❌ Next order will be rejected")
        self._next_action = "reject"
        
    async def _cmd_accept_order(self, *args):
        """Accept the next order with an ACK"""
        logger.info("✅ Next order will be accepted")
        self._next_action = "accept"
        
    async def _cmd_execute(self, *args):
        """Execute an order"""
        if not self.connections:
            logger.info("No active connections")
            return
            
        # Generate an execution for a random client
        client_id = random.choice(list(self.connections.keys()))
        writer = self.connections[client_id]
        
        # Create a simulated execution
        execution = OrderExecuted(
            ts_ns=int(datetime.now().timestamp() * 1_000_000_000),
            order_token="TOKEN" + str(random.randint(1000, 9999)),
            order_book_id=random.randint(1, 100),
            traded_qty=random.randint(1, 100) * 10,
            trade_price=random.randint(100, 1000),
            match_id=random.randint(10000, 99999),
            client_category=1,
            reserved_bits=b"\x00" * 16
        )
        
        # Wrap in a SequencedData message
        seq_data = SequencedData(
            message=OUCH_INBOUND_MSG_TYPE.ORDER_EXECUTED.value + execution.to_soupbin()
        )
        frame = SoupPacketFactory.serialize(seq_data)
        writer.write(frame)
        await writer.drain()
        logger.info(f"📊 Sent execution to client {client_id}")
        
    async def _cmd_cancel(self, *args):
        """Cancel an order"""
        logger.info("🗑️ Will send cancel acknowledgment on next order")
        self._next_action = "cancel"
        
    async def _cmd_quit(self, *args):
        """Quit the server"""
        logger.info("Shutting down server...")
        if self.server:
            self.server.close()
            await self.server.wait_closed()
        sys.exit(0)
        
    async def _cmd_help(self, *args):
        """Show command help"""
        print("\n--- Available Commands ---")
        for key, (_, desc) in self.cmd_handlers.items():
            print(f"{key}: {desc}")
        print("-----------------------\n")
        
    async def handle_command(self, cmd: str):
        """Process a keyboard command"""
        parts = cmd.strip().split()
        if not parts:
            return
            
        command = parts[0].lower()
        args = parts[1:]
        
        if command in self.cmd_handlers:
            handler, _ = self.cmd_handlers[command]
            await handler(*args)
        else:
            print(f"Unknown command: {command}. Type '?' for help.")
    
    async def handle_client(self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
        peer = writer.get_extra_info("peername")
        client_id = f"{peer[0]}:{peer[1]}"
        self.connections[client_id] = writer
        
        logger.info(f"📡 New connection from {peer}")
        buf = bytearray()
        
        try:
            while not reader.at_eof():
                data = await reader.read(4096)
                if not data:
                    break
                buf.extend(data)
                
                # Process complete frames
                while True:
                    if len(buf) < 2:
                        break
                    length = struct.unpack_from(">H", buf, 0)[0]
                    frame_len = 2 + length
                    if len(buf) < frame_len:
                        break
                        
                    # Extract the complete frame
                    frame = bytes(buf[:frame_len])
                    del buf[:frame_len]
                    
                    # Parse the frame
                    await self.process_frame(frame, writer, client_id)
                    
        except asyncio.CancelledError:
            pass
        except Exception as exc:
            logger.error(f"Error handling client {client_id}: {exc}", exc_info=True)
        finally:
            writer.close()
            try:
                await writer.wait_closed()
            except ConnectionResetError:
                pass
            if client_id in self.connections:
                del self.connections[client_id]
            logger.info(f"👋 Connection from {peer} closed")
    
    async def process_frame(self, frame: bytes, writer: asyncio.StreamWriter, client_id: str):
        """Process a complete SoupBinTCP frame"""
        if len(frame) < 3:
            logger.warning(f"Received invalid frame (too short): {frame.hex()}")
            return
            
        # Extract type byte and payload
        type_byte = frame[2:3]
        payload = frame[3:]
        
        try:
            msg = SoupPacketFactory.PACKET_TYPES[type_byte].from_bytes(payload)
            logger.info(f"📥 Received from {client_id}: {type_byte!r} - {msg.__class__.__name__}")
            
            # Handle specific message types
            if type_byte == PacketType.LOGIN_REQUEST.value:
                await self.handle_login(msg, writer)
                
            elif type_byte == PacketType.CLIENT_HEARTBEAT.value:
                # Respond with server heartbeat
                response = ServerHeartbeat()
                resp_frame = SoupPacketFactory.serialize(response)
                writer.write(resp_frame)
                await writer.drain()
                
            elif type_byte == PacketType.UNSEQUENCED_DATA.value:
                # Process OUCH message inside the unsequenced data
                await self.handle_ouch_message(msg.message, writer)
                
            # For any other message, we might want to echo it back for testing
            else:
                writer.write(frame)
                await writer.drain()
                
        except Exception as e:
            logger.error(f"Error processing frame: {e}", exc_info=True)
    
    async def handle_login(self, msg: LoginRequest, writer: asyncio.StreamWriter):
        """Process a login request"""
        logger.info(f"🔑 Login request: username={msg.username}, password={'*' * len(msg.password)}")
        
        # Accept all logins for testing purposes
        response = LoginAccepted(
            session="TEST" + str(random.randint(1000, 9999)),
            sequence_number=1
        )
        
        resp_frame = SoupPacketFactory.serialize(response)
        writer.write(resp_frame)
        await writer.drain()
        logger.info(f"✅ Login accepted: {response.session}")
        
        # After login, send a welcome message
        welcome_msg = f"Welcome to OUCH Test Server! Commands: type 'h' for heartbeat, '?' for help"
        print(welcome_msg)
    
    async def handle_ouch_message(self, data: bytes, writer: asyncio.StreamWriter):
        """Process an OUCH message inside a SoupBinTCP message"""
        if not data:
            return
            
        # First byte is the message type
        type_byte = data[0:1]
        payload = data[1:]
        
        logger.info(f"🔍 OUCH message: type={type_byte!r}")
        
        # Handle specific OUCH message types
        if type_byte == OUCH_OUTBOUND_MSG_TYPE.ENTER_ORDER.value:
            enter_order = EnterOrder.from_soupbin(payload)
            logger.info(f"📝 Enter Order: token={enter_order.order_token}, "
                        f"side={enter_order.side}, qty={enter_order.qty}, "
                        f"price={enter_order.price}")
                        
            # Determine response based on server state or random choice
            action = getattr(self, '_next_action', None)
            if action is None:
                # Default behavior: randomly accept or reject
                action = random.choices(
                    ['accept', 'reject', 'cancel'], 
                    weights=[0.8, 0.1, 0.1]
                )[0]
            
            # Reset for next order
            self._next_action = None
            
            if action == 'accept':
                await self.send_order_ack(enter_order, writer)
            elif action == 'reject':
                await self.send_order_reject(enter_order, writer)
            elif action == 'cancel':
                await self.send_cancel_ack(enter_order, writer)
                
        elif type_byte == OUCH_OUTBOUND_MSG_TYPE.REPLACE_ORDER.value:
            replace_order = ReplaceOrder.from_soupbin(payload)
            logger.info(f"🔄 Replace Order: old={replace_order.existing_order_token}, "
                        f"new={replace_order.replacement_order_token}")
                        
            # Send a replace ack
            await self.send_replace_ack(replace_order, writer)
            
        elif type_byte == OUCH_OUTBOUND_MSG_TYPE.CANCEL_ORDER.value:
            cancel_order = CancelOrder.from_soupbin(payload)
            logger.info(f"🗑️ Cancel Order: token={cancel_order.order_token}")
            
            # Send a cancel ack
            await self.send_cancel_ack_by_token(cancel_order.order_token, writer)
            
        # Other OUCH message types could be handled here
    
    async def send_order_ack(self, enter_order: EnterOrder, writer: asyncio.StreamWriter):
        """Send an OrderAck response for a received EnterOrder"""
        order_id = self.next_order_id
        self.next_order_id += 1
        
        ack = OrderAck(
            ts_ns=int(datetime.now(timezone.utc).timestamp() * 1_000_000_000) & 0xFFFFFFFFFFFFFFFF,  # 8 bytes
            order_token=enter_order.order_token,
            order_book_id=enter_order.order_book_id,
            side=enter_order.side,
            order_id=order_id,
            qty=enter_order.qty,
            price=int(enter_order.price * 100),
            time_in_force=enter_order.time_in_force,
            open_close=enter_order.open_close,
            client_account=enter_order.client_account,
            order_state=1,  # 1=on book
            customer_info=enter_order.customer_info,
            exchange_info=enter_order.exchange_info,
            pretrade_qty=enter_order.qty,
            display_qty=enter_order.display_qty,
            client_category=enter_order.client_category,
            off_hours=enter_order.off_hours,
            reserved_bits=b"\x00" * 3
        )
        
        # Wrap in a SequencedData message
        seq_data = SequencedData(
            message=OUCH_INBOUND_MSG_TYPE.ORDER_ACK.value + ack.to_soupbin()
        )
        
        frame = SoupPacketFactory.serialize(seq_data)
        writer.write(frame)
        await writer.drain()
        
        logger.info(f"✅ Sent OrderAck for token {enter_order.order_token}, order_id={order_id}")
    
    async def send_order_reject(self, enter_order: EnterOrder, writer: asyncio.StreamWriter):
        """Send an OrderReject response"""
        reject = OrderReject(
            ts_ns=int(datetime.now(timezone.utc).timestamp() * 1_000_000_000),
            order_token=enter_order.order_token,
            reject_code=random.randint(1, 10)  # Random rejection code
        )
        
        # Wrap in a SequencedData message
        seq_data = SequencedData(
            message=OUCH_INBOUND_MSG_TYPE.ORDER_REJECT.value + reject.to_soupbin()
        )
        
        frame = SoupPacketFactory.serialize(seq_data)
        writer.write(frame)
        await writer.drain()
        
        logger.info(f"❌ Sent OrderReject for token {enter_order.order_token}")
    
    async def send_cancel_ack(self, enter_order: EnterOrder, writer: asyncio.StreamWriter):
        """Send a CancelAck response for simulation"""
        order_id = self.next_order_id
        self.next_order_id += 1
        
        cancel_ack = OrderCancelAck(
            ts_ns=int(datetime.now(timezone.utc).timestamp() * 1_000_000_000),
            order_token=enter_order.order_token,
            order_book_id=enter_order.order_book_id,
            side=enter_order.side,
            order_id=order_id,
            reason=1  # User requested
        )
        
        # Wrap in a SequencedData message
        seq_data = SequencedData(
            message=OUCH_INBOUND_MSG_TYPE.ORDER_CANCEL_ACK.value + cancel_ack.to_soupbin()
        )
        
        frame = SoupPacketFactory.serialize(seq_data)
        writer.write(frame)
        await writer.drain()
        
        logger.info(f"🗑️ Sent OrderCancelAck for token {enter_order.order_token}")
        
    async def send_cancel_ack_by_token(self, order_token: str, writer: asyncio.StreamWriter):
        """Send a CancelAck response for an actual cancel request"""
        cancel_ack = OrderCancelAck(
            ts_ns=int(datetime.now(timezone.utc).timestamp() * 1_000_000_000),
            order_token=order_token,
            order_book_id=1,  # Default
            side="B",  # Default 
            order_id=self.next_order_id,
            reason=1  # User requested
        )
        self.next_order_id += 1
        
        # Wrap in a SequencedData message
        seq_data = SequencedData(
            message=OUCH_INBOUND_MSG_TYPE.ORDER_CANCEL_ACK.value + cancel_ack.to_soupbin()
        )
        
        frame = SoupPacketFactory.serialize(seq_data)
        writer.write(frame)
        await writer.drain()
        
        logger.info(f"🗑️ Sent OrderCancelAck for token {order_token}")
    
    async def send_replace_ack(self, replace_order: ReplaceOrder, writer: asyncio.StreamWriter):
        """Send a ReplaceAck response"""
        replace_ack = OrderReplaceAck(
            ts_ns=int(datetime.now(timezone.utc).timestamp() * 1_000_000_000),
            replacement_order_token=replace_order.replacement_order_token,
            previous_order_token=replace_order.existing_order_token,
            order_book_id=1,  # Default
            side="B",  # Default
            order_id=self.next_order_id,
            qty=replace_order.qty,
            price=replace_order.price,
            time_in_force=0,  # Default
            open_close=replace_order.open_close,
            client_account=replace_order.client_account,
            order_state=1,  # On book
            customer_info=replace_order.customer_info,
            exchange_info=replace_order.exchange_info,
            pretrade_qty=replace_order.qty,
            display_qty=replace_order.display_qty,
            client_category=replace_order.client_category
        )
        self.next_order_id += 1
        
        # Wrap in a SequencedData message
        seq_data = SequencedData(
            message=OUCH_INBOUND_MSG_TYPE.ORDER_REPLACE_ACK.value + replace_ack.to_soupbin()
        )
        
        frame = SoupPacketFactory.serialize(seq_data)
        writer.write(frame)
        await writer.drain()
        
        logger.info(f"🔄 Sent OrderReplaceAck for new token {replace_order.replacement_order_token}")
    
    async def start(self):
        """Start the test server"""
        self.server = await asyncio.start_server(
            self.handle_client, self.host, self.port
        )
        
        addr = ", ".join(str(sock.getsockname()) for sock in self.server.sockets)
        logger.info(f"🚀 OUCH Test Server started on {addr}")
        print("\n=== OUCH Test Server ===")
        print("Press '?' for available commands")
        print("========================\n")
        
        # Start command input handling
        asyncio.create_task(self.command_loop())
        
        async with self.server:
            await self.server.serve_forever()
    
    async def command_loop(self):
        """Handle keyboard commands"""
        while True:
            try:
                cmd = await asyncio.get_event_loop().run_in_executor(
                    None, lambda: input("\nCommand> ")
                )
                await self.handle_command(cmd)
            except (EOFError, KeyboardInterrupt):
                await self._cmd_quit()
                break
            except Exception as e:
                logger.error(f"Error handling command: {e}", exc_info=True)


async def main():
    parser = argparse.ArgumentParser(description="OUCH Test Server")
    parser.add_argument("--host", default=HOST, help=f"Host to bind to (default: {HOST})")
    parser.add_argument("--port", type=int, default=PORT, help=f"Port to listen on (default: {PORT})")
    args = parser.parse_args()
    
    # Handle graceful shutdown
    loop = asyncio.get_event_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, lambda: asyncio.create_task(
            OuchTestServer()._cmd_quit())
        )
    
    server = OuchTestServer(args.host, args.port)
    await server.start()

if __name__ == "__main__":
    asyncio.run(main())