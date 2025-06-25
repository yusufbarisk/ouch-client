import time
import zmq

context = zmq.Context()
socket = context.socket(zmq.REP)
socket.bind("tcp://*:5555")





class SoupBinPacket:
    def __init__(self, data):
        self.data = data

    def __str__(self):
        return f"SoupBinPacket(data={self.data})"

