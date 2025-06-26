import zmq, json, os
import zmq.asyncio
import asyncio
from typing import Optional
from dotenv import load_dotenv
from heartbeat_controller import HeartbeatController
import logging
from transport import OuchClient
import sys




async def handle_incoming_requests(rep):
        while True:
            msg = rep.recv_string()
            req = json.loads(msg)
            # process req, e.g. { "action": "cancel", "orderId": 123 }
            resp = {"status": "ok"}
            rep.send_string(json.dumps(resp))


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

    # REP socket for frontend → backend
    rep = ctx.socket(zmq.REP)
    rep.bind("ipc:///tmp/ouch-ipc-reqrep.sock")

    asyncio.create_task(handle_incoming_requests(rep=rep)) # start handling

    def factory() -> OuchClient:
        client = OuchClient(pub=pub)
        HeartbeatController(client)  # Initialize heartbeat controller
        return client
    
    if not host_addr or not hport:
        raise ValueError("HOST_ADDR and HOST_PORT must be set in the environment variables")
    
    loop = asyncio.get_running_loop()
    
    root.debug(f"Connecting to {host_addr}:{hport}")
    await loop.create_connection(
        lambda: factory(),  
        host=str(host_addr), port=int(hport))
    
    await asyncio.Event().wait()

asyncio.run(main())
