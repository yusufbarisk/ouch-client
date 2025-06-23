from dataclasses import dataclass
from enum import Enum
from typing import ClassVar

class PacketType(Enum):
    LOGIN_REQUEST = b'L'
    LOGIN_ACCEPTED = b'A'
    LOGIN_REJECTED = b'J'
    SEQUENCED_DATA = b'S'
    UNSEQUENCED_DATA = b'U'
    CLIENT_HEARTBEAT = b'R'
    SERVER_HEARTBEAT = b'H'


@dataclass
class LoginRequest:
    TYPE_ID: ClassVar[bytes] = PacketType.LOGIN_REQUEST.value
    username: str
    password: str
    requested_session: str = ""
    requested_sequence_number: int = 0

    
    def to_bytes(self) -> bytes:
        u = self.username.encode().ljust(6, b" ")[:6]
        p = self.password.encode().ljust(10, b" ")[:10]
        s = self.requested_session.encode().ljust(10, b"\x00")[:10]
        seq = str(self.requested_sequence_number).encode().ljust(20, b"\x00")[:20]
        return u + p + s + seq

    @classmethod
    def from_bytes(cls, data: bytes) -> "LoginRequest":
        u = data[0:6].rstrip(b" ").decode()
        p = data[6:16].rstrip(b" ").decode()
        s = data[16:20].rstrip(b"\x00").decode()
        return cls(username=u, password=p, requested_session=s)


@dataclass  
class LoginAccepted:
    TYPE_ID: ClassVar[bytes] = PacketType.LOGIN_ACCEPTED.value
    session: str
    sequence_number: int

    def to_bytes(self) -> bytes:
        s = self.session.encode().ljust(10, b"\x00")[:10]
        seq = str(self.sequence_number).encode().ljust(20, b"\x00")[:20]
        return s + seq
    
    @classmethod
    def from_bytes(cls, data: bytes) -> "LoginAccepted":
        s = data[0:10].rstrip(b"\x00").decode()
        seq = int(data[10:30].rstrip(b"\x00").decode())
        return cls(session=s, sequence_number=seq)

@dataclass
class LoginRejected:
    TYPE_ID: ClassVar[bytes] = PacketType.LOGIN_REJECTED.value
    reason: str

    def to_bytes(self) -> bytes:
        r = self.reason.encode().ljust(1, b"\x00")[:1]
        return r

    @classmethod
    def from_bytes(cls, data: bytes) -> "LoginRejected":
        reason = data.rstrip(b"\x00").decode()
        return cls(reason=reason)

@dataclass
class SequencedData:
    TYPE_ID: ClassVar[bytes] = PacketType.SEQUENCED_DATA.value
    message: bytes

    def to_bytes(self) -> bytes:
        return self.message
    
    @classmethod
    def from_bytes(cls, data: bytes) -> "SequencedData":
        return cls(message=data)

@dataclass
class UnsequencedData:
    TYPE_ID: ClassVar[bytes] = PacketType.UNSEQUENCED_DATA.value
    message: bytes

    def to_bytes(self) -> bytes:
        return self.message
    
    @classmethod
    def from_bytes(cls, data: bytes) -> "UnsequencedData":
        return cls(message=data)


@dataclass
class ClientHeartbeat:
    TYPE_ID: ClassVar[bytes] = PacketType.CLIENT_HEARTBEAT.value
    
    def to_bytes(self) -> bytes:
        return PacketType.CLIENT_HEARTBEAT.value
    
    @classmethod
    def from_bytes(cls, data: bytes) -> "ClientHeartbeat":
        return cls()

@dataclass
class ServerHeartbeat:
    TYPE_ID: ClassVar[bytes] = PacketType.SERVER_HEARTBEAT.value

    def to_bytes(self) -> bytes:
        return PacketType.SERVER_HEARTBEAT.value
    
    @classmethod
    def from_bytes(cls, data: bytes) -> "ServerHeartbeat":
        return cls()


# factory.py
class SoupPacketFactory:
    PACKET_TYPES = {
        PacketType.LOGIN_REQUEST.value: LoginRequest,
        PacketType.LOGIN_ACCEPTED.value: LoginAccepted,
        PacketType.LOGIN_REJECTED.value: LoginRejected,
        PacketType.SEQUENCED_DATA.value: SequencedData,
        PacketType.UNSEQUENCED_DATA.value: UnsequencedData,
        PacketType.CLIENT_HEARTBEAT.value: ClientHeartbeat,
        PacketType.SERVER_HEARTBEAT.value: ServerHeartbeat,
    }

    @classmethod
    def parse(cls, data: bytes):

        payload = data[3:]  
        typ = data[2:3]
        pkt_cls = cls.PACKET_TYPES.get(typ)
        if not pkt_cls:
            raise ValueError(f"Unknown packet type {typ!r}")
        return pkt_cls.from_bytes(payload)

    @classmethod
    def serialize(cls, pkt) -> bytes:
        body = pkt.to_bytes()
        length = len(body) + 1
        return length.to_bytes(2, "big") + pkt.TYPE_ID + body
