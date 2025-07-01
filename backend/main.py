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
from soupbin_msgs import SequencedData, UnsequencedData

async def handle_front_to_back(sub, client: OuchClient):
    while True:
        try:
            msg = await sub.recv_string()
            data = json.loads(msg)
            
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
    host_addr = os.getenv("HOST_ADDR")
    hport = os.getenv("HOST_PORT")

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
    HeartbeatController(client)

    asyncio.create_task(handle_front_to_back(sub=sub, client=client)) # start handling
    
    
    if not host_addr or not hport:
        raise ValueError("HOST_ADDR and HOST_PORT must be set in the environment variables")
    
    loop = asyncio.get_running_loop()
    
    root.debug(f"Connecting to {host_addr}:{hport}")
    await loop.create_connection(
        lambda: client,  
        host=str(host_addr), port=int(hport))
    
    await asyncio.Event().wait()

asyncio.run(main())
