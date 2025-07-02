import zmq, json, os
import zmq.asyncio
import asyncio
from typing import Optional
from dotenv import load_dotenv
from heartbeat_controller import HeartbeatController
import logging
from transport import OuchClient
import sys
from util import create_ouch_message_from_json
from soupbin_msgs import SequencedData, UnsequencedData, LogoutRequest


async def handle_conn(data, client, root):
    """
    Handle connection messages from the frontend.
    """
    logging.info(f"Handling connection message: {data}")
    
    if data.get("command") == "connect":
        username = data.get("username")
        password = data.get("password")
        host_addr = data.get("host_addr")
        hport = data.get("host_port")

        if not username or not password:
            logging.error("Username and password must be provided for connection.")
            return
        # try default env variables if available
        if not host_addr or not hport:
            host_addr = os.getenv("HOST_ADDR")
            hport = os.getenv("HOST_PORT")

        if host_addr is None or hport is None:
            logging.error("Host address and port must be provided for connection.")
            return

        try:
            hport_int = int(hport)
        except (TypeError, ValueError):
            logging.error(f"Invalid host port: {hport}")
            return
        
        # Check conn
        if client.transport is not None:
            logging.warning("Already connected to server, ignoring connection request")
            return
            
        if client.hb is None:
            HeartbeatController(client)
        
        loop = asyncio.get_running_loop()
        
        root.debug(f"Connecting to {host_addr}:{hport_int} as {username}")
        await loop.create_connection(
            lambda: client,  
            host=str(host_addr), port=hport_int
        )

        logging.info("Connection established.")

    elif data.get("command") == "disconnect":
        logging.info("Disconnect command received.")
        # Soupbin requires O packet for graceful disconnection

        disconnect_pkt = LogoutRequest()
        client.send_outgoing_msg(disconnect_pkt)
        logging.info("Sent logout request to server.")

        return

async def handle_front_to_back(sub, client: OuchClient, root):
    while True:
        try:
            msg = await sub.recv_string()
            data = json.loads(msg)

            # divide between ouch and client-specific messages
            if data.get("type") == "CONN":
                await handle_conn(data, client, root)
                continue

            ouch_msg = create_ouch_message_from_json(data)
            if ouch_msg is None:
                logging.error(f"Received invalid ouch message: {data}")
                continue
            
            ouch_payload = ouch_msg.TYPE_ID + ouch_msg.to_soupbin()
            
            sequenced_packet = UnsequencedData(message=ouch_payload)
            
            client.send_outgoing_msg(sequenced_packet)
            
        except Exception as e:
            logging.error(f"Error handling frontend message: {e}")

async def main():

    # Load environment variables
    load_dotenv()

    root = logging.getLogger()
    if not root.handlers:
        handler = logging.StreamHandler(stream=sys.stderr)
        handler.setFormatter(logging.Formatter(
            "%(asctime)s %(name)s %(levelname)-8s │ %(message)s",
            datefmt="%H:%M:%S"
        ))

    root.addHandler(handler)
    root.setLevel(logging.INFO)

    ctx = zmq.asyncio.Context()

    # Publisher socket so multiclient possible for single backend scaling in the future
    pub = ctx.socket(zmq.PUB)
    ipc_path = "/tmp/ouch-ipc.sock"
    try:
        os.remove(ipc_path)
    except FileNotFoundError:
        pass
    pub.bind(f"ipc://{ipc_path}")

    # SUB socket for frontend → backend
    sub = ctx.socket(zmq.SUB)
    sub.connect("ipc:///tmp/ouch-ipc-orders.sock")
    sub.setsockopt_string(zmq.SUBSCRIBE, "") 

    client = OuchClient(pub=pub)

    logging.info("Ouch client is running. Press Ctrl+C to exit.")

    asyncio.create_task(handle_front_to_back(sub=sub, client=client, root=root)) # start handling
    

    ## Separate this part for frontend based connection mgmt
    await asyncio.Event().wait()  




asyncio.run(main())
