#!/usr/bin/env python3
"""
Very-basic SoupBinTCP echo server – good enough for OUCH client smoke tests.
No login logic, no sequencing, just frame-in → frame-out.
"""

import asyncio
import struct
from datetime import datetime

HOST = "0.0.0.0"
PORT = 9999


async def handle(reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
    peer = writer.get_extra_info("peername")
    print(f"[{datetime.now().isoformat(timespec='seconds')}] + Connection from {peer}")

    buf = bytearray()

    try:
        while not reader.at_eof():
            data = await reader.read(4_096)
            if not data:
                break
            buf.extend(data)

            # — parse as many complete SoupBin frames as possible —
            while True:
                if len(buf) < 2:
                    break  # need at least 2 bytes for length
                length = struct.unpack_from(">H", buf, 0)[0]
                frame_len = 2 + length          # total bytes incl. len prefix
                if len(buf) < frame_len:
                    break                       # partial frame
                frame = bytes(buf[:frame_len])  # immutable copy to echo back
                del buf[:frame_len]             # remove consumed bytes

                # (Optional) log it
                t_byte = frame[2:3]
                print(f"  ↪︎ echo {frame_len} bytes, type {t_byte!r}")

                writer.write(frame)
                await writer.drain()

    except asyncio.CancelledError:
        pass
    except Exception as exc:
        print(f"!! connection {peer} error: {exc}")
    finally:
        writer.close()
        await writer.wait_closed()
        print(f"[{datetime.now().isoformat(timespec='seconds')}] - Connection {peer} closed")


async def main():
    server = await asyncio.start_server(handle, HOST, PORT)
    addr = ", ".join(str(sock.getsockname()) for sock in server.sockets)
    print(f"SoupBinTCP echo server listening on {addr}")
    async with server:
        await server.serve_forever()

if __name__ == "__main__":
    asyncio.run(main())

