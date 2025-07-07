from dataclasses import dataclass
from enum import Enum
from typing import ClassVar, Optional
from soupbin_msgs import *
import struct


class OUCH_OUTBOUND_MSG_TYPE(Enum):
    ENTER_ORDER = b'O'
    REPLACE_ORDER = b'U'
    CANCEL_ORDER = b'X'
    CANCEL_ORDER_BY_ID = b'Y'
    MASS_QUOTE = b'Q'

class OUCH_INBOUND_MSG_TYPE(Enum):
    ORDER_ACK = b'A'
    ORDER_REJECT = b'J' # Used for enter replace and cancel
    ORDER_REPLACE_ACK = b'U'
    ORDER_CANCEL_ACK = b'C'
    ORDER_EXECUTED = b'E' # ???
    MASS_QUOTE_ACK = b'K'
    MASS_QUOTE_REJECT = b'R'


@dataclass
class EnterOrder:
    TYPE_ID: ClassVar[bytes] = OUCH_OUTBOUND_MSG_TYPE.ENTER_ORDER.value
    order_token: str
    order_book_id: int
    side: str # 'B' for buy, 'S' for sell 'T' for short sell
    qty: int
    price: float
    time_in_force: int  # 0 for day 3 for Immediate or cancel 4 for fill or kill
    open_close: int
    client_account: str
    customer_info: str
    exchange_info: str
    display_qty: int # Default to 0 if not reserve order
    client_category: int
    off_hours: int
    reserved_bits: bytes = b"\x00"*7

    def to_soupbin(self) -> bytes:
        """Convert to SoupBin format using struct.pack."""
        return b"".join([
            self.order_token.encode().ljust(14, b'\x00'),
            struct.pack(">I", self.order_book_id),
            self.side.encode()[:1],
            struct.pack(">Q", self.qty),
            struct.pack(">i", int(self.price * 100)),  # price in cents as signed int
            struct.pack(">B", self.time_in_force),
            struct.pack(">B", self.open_close),
            self.client_account.encode().ljust(16, b'\x00'),
            self.customer_info.encode().ljust(15, b'\x00'),
            self.exchange_info.encode().ljust(32, b'\x00'),
            struct.pack(">Q", self.display_qty),
            struct.pack(">B", self.client_category),
            struct.pack(">B", self.off_hours),
            self.reserved_bits[:7].ljust(7, b'\x00')
        ])

    @classmethod
    def from_soupbin(cls, data: bytes) -> "EnterOrder":
        """Create from SoupBin format using struct.unpack."""
        order_token = data[0:14].decode().strip('\x00')
        order_book_id = struct.unpack(">I", data[14:18])[0]
        side = data[18:19].decode()
        qty = struct.unpack(">Q", data[19:27])[0]
        price = struct.unpack(">i", data[27:31])[0] / 100.0
        time_in_force = struct.unpack(">B", data[31:32])[0]
        open_close = struct.unpack(">B", data[32:33])[0]
        client_account = data[33:49].decode().strip('\x00')
        customer_info = data[49:64].decode().strip('\x00')
        exchange_info = data[64:96].decode().strip('\x00')
        display_qty = struct.unpack(">Q", data[96:104])[0]
        client_category = struct.unpack(">B", data[104:105])[0]
        off_hours = struct.unpack(">B", data[105:106])[0]
        reserved_bits = data[106:113]

        return cls(order_token=order_token, order_book_id=order_book_id, side=side,
                   qty=qty, price=price, time_in_force=time_in_force,
                   open_close=open_close, client_account=client_account,
                   customer_info=customer_info, exchange_info=exchange_info,
                   display_qty=display_qty, client_category=client_category,
                   off_hours=off_hours, reserved_bits=reserved_bits)

@dataclass
class ReplaceOrder:
    TYPE_ID: ClassVar[bytes] = OUCH_OUTBOUND_MSG_TYPE.REPLACE_ORDER.value
    existing_order_token: str                 # 14 bytes  :contentReference[oaicite:11]{index=11}
    replacement_order_token: str              # 14 bytes
    qty: int                                  # desired TOTAL quantity
    price: int                                # signed int price (0 = no-change)
    open_close: int                           # 0/1/2/4
    client_account: str                       # 16-byte AFK
    customer_info: str                        # 15-byte free text
    exchange_info: str                        # 32-byte acct (only first 16 used)
    display_qty: int                          # 0 = unchanged
    client_category: int                      # 1/2/7/9/10/11/12
    reserved_bits: bytes = b"\x00"*8          # spec: 8-byte reserved field

    def to_soupbin(self) -> bytes:
        """Convert to SoupBin format."""
        return b"".join([
            self.existing_order_token.encode().ljust(14, b'\x00'),
            self.replacement_order_token.encode().ljust(14, b'\x00'),
            str(self.qty).encode().ljust(8, b'\x00'),
            str(self.price).encode().ljust(4, b'\x00'),
            str(self.open_close).encode().ljust(1, b'\x00'),
            self.client_account.encode().ljust(16, b'\x00'),
            self.customer_info.encode().ljust(15, b'\x00'),
            self.exchange_info.encode().ljust(32, b'\x00'),
            str(self.display_qty).encode().ljust(8, b'\x00'),
            str(self.client_category).encode().ljust(1, b'\x00'),
            self.reserved_bits.ljust(8, b'\x00')
        ])
    
    @classmethod
    def from_soupbin(cls, data: bytes) -> "ReplaceOrder":
        """Create from SoupBin format."""
        existing_order_token = data[0:14].decode().strip('\x00')
        replacement_order_token = data[14:28].decode().strip('\x00')
        qty = int(data[28:36].decode().strip('\x00'))
        price = int(data[36:40].decode().strip('\x00'))
        open_close = int(data[40:41].decode().strip('\x00'))
        client_account = data[41:57].decode().strip('\x00')
        customer_info = data[57:72].decode().strip('\x00')
        exchange_info = data[72:104].decode().strip('\x00')
        display_qty = int(data[104:112].decode().strip('\x00'))
        client_category = int(data[112:113].decode().strip('\x00'))
        reserved_bits = data[113:121]

        return cls(existing_order_token=existing_order_token, 
                   replacement_order_token=replacement_order_token, 
                   qty=qty, price=price, open_close=open_close, 
                   client_account=client_account, customer_info=customer_info, 
                   exchange_info=exchange_info, display_qty=display_qty, 
                   client_category=client_category, reserved_bits=reserved_bits)


@dataclass
class CancelOrder:
    TYPE_ID: ClassVar[bytes] = OUCH_OUTBOUND_MSG_TYPE.CANCEL_ORDER.value
    order_token: str                          # 14 bytes from original Enter :contentReference[oaicite:12]{index=12}

    def to_soupbin(self) -> bytes:
        """Convert to SoupBin format."""
        return self.order_token.encode().ljust(14, b'\x00')
    
    @classmethod
    def from_soupbin(cls, data: bytes) -> "CancelOrder":
        """Create from SoupBin format."""
        order_token = data.decode().strip('\x00')
        return cls(order_token=order_token)

@dataclass
class CancelOrderByID:
    TYPE_ID: ClassVar[bytes] = OUCH_OUTBOUND_MSG_TYPE.CANCEL_ORDER_BY_ID.value
    order_book_id: int
    side: str                                 # 'B' or 'S'                 :contentReference[oaicite:13]{index=13}
    order_id: int

    def to_soupbin(self) -> bytes:
        """Convert to SoupBin format."""
        return b"".join([
            str(self.order_book_id).encode().ljust(4, b'\x00'),
            self.side.encode().ljust(1, b'\x00'),
            str(self.order_id).encode().ljust(8, b'\x00')
        ])
    
    @classmethod
    def from_soupbin(cls, data: bytes) -> "CancelOrderByID":
        """Create from SoupBin format."""
        order_book_id = int(data[0:4].decode().strip('\x00'))
        side = data[4:5].decode().strip('\x00')
        order_id = int(data[5:13].decode().strip('\x00'))

        return cls(order_book_id=order_book_id, side=side, order_id=order_id)


## Turns out MassQuote is a bit more complex, it has multiple entries
## will look into this later ignore for now
@dataclass
class MassQuote:
    TYPE_ID: ClassVar[bytes] = OUCH_OUTBOUND_MSG_TYPE.MASS_QUOTE.value
    order_token: str
    client_category: int
    client_account: str
    exchange_info: str
    no_quote_entries: int
    order_book_id: int 
    bid_px: float
    offer_px: float
    bid_size: int
    offer_size: int

    def to_soupbin(self) -> bytes:
        """Convert to SoupBin format."""
        return b"".join([
            self.order_token.encode().ljust(14, b'\x00'),
            str(self.client_category).encode().ljust(1, b'\x00'),
            self.client_account.encode().ljust(16, b'\x00'),
            self.exchange_info.encode().ljust(16, b'\x00'),
            str(self.no_quote_entries).encode().ljust(2, b'\x00'),
            str(self.order_book_id).encode().ljust(4, b'\x00'),
            str(self.bid_px).encode().ljust(4, b'\x00'),
            str(self.offer_px).encode().ljust(4, b'\x00'),
            str(self.bid_size).encode().ljust(8, b'\x00'),
            str(self.offer_size).encode().ljust(8, b'\x00')
        ])
    
    @classmethod
    def from_soupbin(cls, data: bytes) -> "MassQuote":
        """Create from SoupBin format."""
        order_token = data[0:14].decode().strip('\x00')
        client_category = int(data[14:15].decode().strip('\x00'))
        client_account = data[15:31].decode().strip('\x00')
        exchange_info = data[31:47].decode().strip('\x00')
        no_quote_entries = int(data[47:49].decode().strip('\x00'))
        order_book_id = int(data[49:53].decode().strip('\x00'))
        bid_px = float(data[53:57].decode().strip('\x00'))
        offer_px = float(data[57:61].decode().strip('\x00'))
        bid_size = int(data[61:69].decode().strip('\x00'))
        offer_size = int(data[69:77].decode().strip('\x00'))

        return cls(order_token=order_token, client_category=client_category, 
                   client_account=client_account, exchange_info=exchange_info, 
                   no_quote_entries=no_quote_entries, order_book_id=order_book_id, 
                   bid_px=bid_px, offer_px=offer_px, bid_size=bid_size, 
                   offer_size=offer_size)

# ── outbound (exchange → client) ────────────────────────────────────────

@dataclass
class OrderAck:
    TYPE_ID: ClassVar[bytes] = OUCH_INBOUND_MSG_TYPE.ORDER_ACK.value
    ts_ns: int
    order_token: str
    order_book_id: int
    side: str
    order_id: int
    qty: int
    price: int
    time_in_force: int
    open_close: int
    client_account: str
    order_state: int
    customer_info: str
    exchange_info: str
    pretrade_qty: int
    display_qty: int
    client_category: int
    off_hours: int
    reserved_bits: bytes

    def to_soupbin(self) -> bytes:
        return b"".join([
            struct.pack(">Q", self.ts_ns),  # 8 bytes unsigned long long
            self.order_token.encode().ljust(14, b'\x00'),
            struct.pack(">I", self.order_book_id),  # 4 bytes unsigned int
            self.side.encode()[:1],
            struct.pack(">Q", self.order_id),  # 8 bytes unsigned long long
            struct.pack(">Q", self.qty),       # 8 bytes unsigned long long
            struct.pack(">i", self.price),     # 4 bytes signed int
            struct.pack(">B", self.time_in_force),
            struct.pack(">B", self.open_close),
            self.client_account.encode().ljust(16, b'\x00'),
            struct.pack(">B", self.order_state),
            self.customer_info.encode().ljust(15, b'\x00'),
            self.exchange_info.encode().ljust(32, b'\x00'),
            struct.pack(">Q", self.pretrade_qty),
            struct.pack(">Q", self.display_qty),
            struct.pack(">B", self.client_category),
            struct.pack(">B", self.off_hours),
            self.reserved_bits[:3].ljust(3, b'\x00'),
        ])
    
    @classmethod
    def from_soupbin(cls, data: bytes) -> "OrderAck":
        """Create from SoupBin format."""
        ts_ns = struct.unpack(">Q", data[0:8])[0]
        order_token = data[8:22].decode().strip('\x00')
        order_book_id = struct.unpack(">I", data[22:26])[0]
        side = data[26:27].decode()
        order_id = struct.unpack(">Q", data[27:35])[0]
        qty = struct.unpack(">Q", data[35:43])[0]
        price = struct.unpack(">i", data[43:47])[0]
        time_in_force = struct.unpack(">B", data[47:48])[0]
        open_close = struct.unpack(">B", data[48:49])[0]
        client_account = data[49:65].decode().strip('\x00')
        order_state = struct.unpack(">B", data[65:66])[0]
        customer_info = data[66:81].decode().strip('\x00')
        exchange_info = data[81:113].decode().strip('\x00')
        pretrade_qty = struct.unpack(">Q", data[113:121])[0]
        display_qty = struct.unpack(">Q", data[121:129])[0]
        client_category = struct.unpack(">B", data[129:130])[0]
        off_hours = struct.unpack(">B", data[130:131])[0]
        reserved_bits = data[131:134]
        return cls(
            ts_ns, order_token, order_book_id, side, order_id, qty, price,
            time_in_force, open_close, client_account, order_state,
            customer_info, exchange_info, pretrade_qty, display_qty,
            client_category, off_hours, reserved_bits
        )

@dataclass
class OrderReject:
    TYPE_ID: ClassVar[bytes] = OUCH_INBOUND_MSG_TYPE.ORDER_REJECT.value
    ts_ns: int
    order_token: str
    reject_code: int                          # signed int                 :contentReference[oaicite:16]{index=16}

    def to_soupbin(self) -> bytes:
        """Convert to SoupBin format."""
        return b"".join([
            struct.pack(">Q", self.ts_ns),
            self.order_token.encode().ljust(14, b'\x00'),
            struct.pack(">i", self.reject_code),
        ])

    @classmethod
    def from_soupbin(cls, data: bytes) -> "OrderReject":
        """Create from SoupBin format."""
        ts_ns = struct.unpack(">Q", data[0:8])[0]
        order_token = data[8:22].decode().strip('\x00')
        reject_code = struct.unpack(">i", data[22:26])[0]
        return cls(ts_ns=ts_ns, order_token=order_token, reject_code=reject_code)

@dataclass
class OrderReplaceAck:
    TYPE_ID: ClassVar[bytes] = OUCH_INBOUND_MSG_TYPE.ORDER_REPLACE_ACK.value
    ts_ns: int
    replacement_order_token: str
    previous_order_token: str
    order_book_id: int
    side: str
    order_id: int
    qty: int
    price: int
    time_in_force: int
    open_close: int
    client_account: str
    order_state: int
    customer_info: str
    exchange_info: str
    pretrade_qty: int
    display_qty: int
    client_category: int
    reserved_bits: bytes = b"\x00"*3

    def to_soupbin(self) -> bytes:
        """Convert to SoupBin format."""
        return b"".join([
            struct.pack(">Q", self.ts_ns),
            self.replacement_order_token.encode().ljust(14, b'\x00'),
            self.previous_order_token.encode().ljust(14, b'\x00'),
            struct.pack(">I", self.order_book_id),
            self.side.encode()[:1],
            struct.pack(">Q", self.order_id),
            struct.pack(">Q", self.qty),
            struct.pack(">i", self.price),
            struct.pack(">B", self.time_in_force),
            struct.pack(">B", self.open_close),
            self.client_account.encode().ljust(16, b'\x00'),
            struct.pack(">B", self.order_state),
            self.customer_info.encode().ljust(15, b'\x00'),
            self.exchange_info.encode().ljust(32, b'\x00'),
            struct.pack(">Q", self.pretrade_qty),
            struct.pack(">Q", self.display_qty),
            struct.pack(">B", self.client_category),
            self.reserved_bits[:3].ljust(3, b'\x00'),
        ])
    
    @classmethod
    def from_soupbin(cls, data: bytes) -> "OrderReplaceAck":
        """Create from SoupBin format."""
        ts_ns = struct.unpack(">Q", data[0:8])[0]
        replacement_order_token = data[8:22].decode().strip('\x00')
        previous_order_token = data[22:36].decode().strip('\x00')
        order_book_id = struct.unpack(">I", data[36:40])[0]
        side = data[40:41].decode()
        order_id = struct.unpack(">Q", data[41:49])[0]
        qty = struct.unpack(">Q", data[49:57])[0]
        price = struct.unpack(">i", data[57:61])[0]
        time_in_force = struct.unpack(">B", data[61:62])[0]
        open_close = struct.unpack(">B", data[62:63])[0]
        client_account = data[63:79].decode().strip('\x00')
        order_state = struct.unpack(">B", data[79:80])[0]
        customer_info = data[80:95].decode().strip('\x00')
        exchange_info = data[95:127].decode().strip('\x00')
        pretrade_qty = struct.unpack(">Q", data[127:135])[0]
        display_qty = struct.unpack(">Q", data[135:143])[0]
        client_category = struct.unpack(">B", data[143:144])[0]
        reserved_bits = data[144:147] if len(data) >= 147 else b'\x00' * 3

        return cls(ts_ns=ts_ns, replacement_order_token=replacement_order_token, 
                   previous_order_token=previous_order_token, order_book_id=order_book_id, 
                   side=side, order_id=order_id, qty=qty, price=price, 
                   time_in_force=time_in_force, open_close=open_close, 
                   client_account=client_account, order_state=order_state, 
                   customer_info=customer_info, exchange_info=exchange_info, 
                   pretrade_qty=pretrade_qty, display_qty=display_qty, 
                   client_category=client_category, reserved_bits=reserved_bits)


@dataclass
class OrderCancelAck:
    TYPE_ID: ClassVar[bytes] = OUCH_INBOUND_MSG_TYPE.ORDER_CANCEL_ACK.value
    ts_ns: int
    order_token: str
    order_book_id: int
    side: str
    order_id: int
    reason: int                               # see CancelReason enum      :contentReference[oaicite:17]{index=17}

    def to_soupbin(self) -> bytes:
        """Convert to SoupBin format."""
        return b"".join([
            struct.pack(">Q", self.ts_ns),
            self.order_token.encode().ljust(14, b'\x00'),
            struct.pack(">I", self.order_book_id),
            self.side.encode()[:1],
            struct.pack(">Q", self.order_id),
            struct.pack(">B", self.reason),
        ])

    @classmethod
    def from_soupbin(cls, data: bytes) -> "OrderCancelAck":
        """Create from SoupBin format."""
        ts_ns = struct.unpack(">Q", data[0:8])[0]
        order_token = data[8:22].decode().strip('\x00')
        order_book_id = struct.unpack(">I", data[22:26])[0]
        side = data[26:27].decode()
        order_id = struct.unpack(">Q", data[27:35])[0]
        reason = struct.unpack(">B", data[35:36])[0]
        return cls(ts_ns=ts_ns, order_token=order_token, order_book_id=order_book_id, 
                   side=side, order_id=order_id, reason=reason)
    


@dataclass
class OrderExecuted:
    TYPE_ID: ClassVar[bytes] = OUCH_INBOUND_MSG_TYPE.ORDER_EXECUTED.value
    ts_ns: int
    order_token: str
    order_book_id: Optional[int]              # only for combo fills
    traded_qty: int
    trade_price: int
    match_id: int
    client_category: int
    reserved_bits: bytes                      # 16-byte reserved           :contentReference[oaicite:18]{index=18}

    def to_soupbin(self) -> bytes:
        """Convert to SoupBin format."""
        return b"".join([
            struct.pack(">Q", self.ts_ns),
            self.order_token.encode().ljust(14, b'\x00'),
            struct.pack(">I", self.order_book_id or 0),
            struct.pack(">Q", self.traded_qty),
            struct.pack(">i", self.trade_price),
            struct.pack(">Q", self.match_id),
            struct.pack(">B", self.client_category),
            self.reserved_bits[:16].ljust(16, b'\x00'),
        ])

    @classmethod
    def from_soupbin(cls, data: bytes) -> "OrderExecuted":
        """Create from SoupBin format."""
        ts_ns = struct.unpack(">Q", data[0:8])[0]
        order_token = data[8:22].decode().strip('\x00')
        order_book_id = struct.unpack(">I", data[22:26])[0]
        traded_qty = struct.unpack(">Q", data[26:34])[0]
        trade_price = struct.unpack(">i", data[34:38])[0]
        match_id = struct.unpack(">Q", data[38:46])[0]
        client_category = struct.unpack(">B", data[46:47])[0]
        reserved_bits = data[47:63]
        return cls(ts_ns=ts_ns, order_token=order_token, order_book_id=order_book_id, 
                   traded_qty=traded_qty, trade_price=trade_price, match_id=match_id, 
                   client_category=client_category, reserved_bits=reserved_bits)


@dataclass
class MassQuoteAck:
    TYPE_ID: ClassVar[bytes] = OUCH_INBOUND_MSG_TYPE.MASS_QUOTE_ACK.value
    ts_ns: int
    order_token: str
    order_book_id: int
    side: str
    quote_status: int                         # 0=accept,1=updated,2=canceled,5=traded
    quantity: int
    traded_quantity: int
    price: int                                # traded price if status 5   :contentReference[oaicite:19]{index=19}

    def to_soupbin(self) -> bytes:
        """Convert to SoupBin format."""
        return b"".join([
            struct.pack(">Q", self.ts_ns),
            self.order_token.encode().ljust(14, b'\x00'),
            struct.pack(">I", self.order_book_id),
            self.side.encode()[:1],
            struct.pack(">I", self.quote_status),
            struct.pack(">Q", self.quantity),
            struct.pack(">Q", self.traded_quantity),
            struct.pack(">i", self.price),
        ])
    
    @classmethod
    def from_soupbin(cls, data: bytes) -> "MassQuoteAck":
        """Create from SoupBin format."""
        ts_ns = struct.unpack(">Q", data[0:8])[0]
        order_token = data[8:22].decode().strip('\x00')
        order_book_id = struct.unpack(">I", data[22:26])[0]
        side = data[26:27].decode()
        quote_status = struct.unpack(">I", data[27:31])[0]
        quantity = struct.unpack(">Q", data[31:39])[0]
        traded_quantity = struct.unpack(">Q", data[39:47])[0]
        price = struct.unpack(">i", data[47:51])[0]
        return cls(ts_ns=ts_ns, order_token=order_token, order_book_id=order_book_id, 
                   side=side, quote_status=quote_status, quantity=quantity, 
                   traded_quantity=traded_quantity, price=price)

@dataclass
class MassQuoteReject:
    TYPE_ID: ClassVar[bytes] = OUCH_INBOUND_MSG_TYPE.MASS_QUOTE_REJECT.value
    ts_ns: int
    order_token: str
    order_book_id: Optional[int]              # blank when "all quotes rejected"
    reject_code: int                          # see error-code catalogue   :contentReference[oaicite:20]{index=20}

    def to_soupbin(self) -> bytes:
        """Convert to SoupBin format."""
        return b"".join([
            struct.pack(">Q", self.ts_ns),
            self.order_token.encode().ljust(14, b'\x00'),
            struct.pack(">I", self.order_book_id or 0),
            struct.pack(">i", self.reject_code),
        ])
    
    @classmethod
    def from_soupbin(cls, data: bytes) -> "MassQuoteReject":
        """Create from SoupBin format."""
        ts_ns = struct.unpack(">Q", data[0:8])[0]
        order_token = data[8:22].decode().strip('\x00')
        order_book_id = struct.unpack(">I", data[22:26])[0]
        reject_code = struct.unpack(">i", data[26:30])[0]
        return cls(ts_ns=ts_ns, order_token=order_token, order_book_id=order_book_id, reject_code=reject_code)



class OUCH_MessageFactory:
    PACKET_TYPES: ClassVar[dict] = {
        OUCH_OUTBOUND_MSG_TYPE.ENTER_ORDER.value: EnterOrder,
        OUCH_OUTBOUND_MSG_TYPE.REPLACE_ORDER.value: ReplaceOrder,
        OUCH_OUTBOUND_MSG_TYPE.CANCEL_ORDER.value: CancelOrder,
        OUCH_OUTBOUND_MSG_TYPE.CANCEL_ORDER_BY_ID.value: CancelOrderByID,
        OUCH_OUTBOUND_MSG_TYPE.MASS_QUOTE.value: MassQuote,

        OUCH_INBOUND_MSG_TYPE.ORDER_ACK.value: OrderAck,
        OUCH_INBOUND_MSG_TYPE.ORDER_REJECT.value: OrderReject,
        OUCH_INBOUND_MSG_TYPE.ORDER_REPLACE_ACK.value: OrderReplaceAck,
        OUCH_INBOUND_MSG_TYPE.ORDER_CANCEL_ACK.value: OrderCancelAck,
        OUCH_INBOUND_MSG_TYPE.ORDER_EXECUTED.value: OrderExecuted,
        OUCH_INBOUND_MSG_TYPE.MASS_QUOTE_ACK.value: MassQuoteAck,
        OUCH_INBOUND_MSG_TYPE.MASS_QUOTE_REJECT.value: MassQuoteReject,
    }

    @staticmethod
    def create_message(data: bytes):
        if not data:
            return None
        
        type_id = data[0:1]
        
        if type_id == OUCH_OUTBOUND_MSG_TYPE.ENTER_ORDER.value:
            return EnterOrder.from_soupbin(data[1:])
        elif type_id == OUCH_OUTBOUND_MSG_TYPE.REPLACE_ORDER.value:
            return ReplaceOrder.from_soupbin(data[1:])
        elif type_id == OUCH_OUTBOUND_MSG_TYPE.CANCEL_ORDER.value:
            return CancelOrder.from_soupbin(data[1:])
        elif type_id == OUCH_OUTBOUND_MSG_TYPE.CANCEL_ORDER_BY_ID.value:
            return CancelOrderByID.from_soupbin(data[1:])
        elif type_id == OUCH_OUTBOUND_MSG_TYPE.MASS_QUOTE.value:
            return MassQuote.from_soupbin(data[1:])
        
        elif type_id == OUCH_INBOUND_MSG_TYPE.ORDER_ACK.value:
            return OrderAck.from_soupbin(data[1:])
        elif type_id == OUCH_INBOUND_MSG_TYPE.ORDER_REJECT.value:
            return OrderReject.from_soupbin(data[1:])
        elif type_id == OUCH_INBOUND_MSG_TYPE.ORDER_REPLACE_ACK.value:
            return OrderReplaceAck.from_soupbin(data[1:])
        elif type_id == OUCH_INBOUND_MSG_TYPE.ORDER_CANCEL_ACK.value:
            return OrderCancelAck.from_soupbin(data[1:])
        elif type_id == OUCH_INBOUND_MSG_TYPE.ORDER_EXECUTED.value:
            return OrderExecuted.from_soupbin(data[1:])
        elif type_id == OUCH_INBOUND_MSG_TYPE.MASS_QUOTE_ACK.value:
            return MassQuoteAck.from_soupbin(data[1:])
        elif type_id == OUCH_INBOUND_MSG_TYPE.MASS_QUOTE_REJECT.value:
            return MassQuoteReject.from_soupbin(data[1:])
        else:
            raise ValueError(f"Unknown OUCH message type: {type_id}")    


    @classmethod
    def serialize(cls, pkt) -> bytes:
        body = pkt.to_bytes()
        length = len(body) + 1
        return length.to_bytes(2, "big") + pkt.TYPE_ID + body

