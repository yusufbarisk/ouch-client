from dataclasses import dataclass
from enum import Enum
from typing import ClassVar, List, Optional

class OUCH_INBOUND_MSG_TYPE(Enum):
    ENTER_ORDER = b'O'
    REPLACE_ORDER = b'U'
    CANCEL_ORDER = b'X'
    CANCEL_ORDER_BY_ID = b'Y'
    MASS_QUOTE = b'Q'

class OUCH_OUTBOUND_MSG_TYPE(Enum):
    ORDER_ACK = b'A'
    ORDER_REJECT = b'J' # Used for enter replace and cancel
    ORDER_REPLACE_ACK = b'U'
    ORDER_CANCEL_ACK = b'C'
    ORDER_EXECUTED = b'E' # ???
    MASS_QUOTE_ACK = b'K'
    MASS_QUOTE_REJECT = b'R'


@dataclass
class EnterOrder:
    TYPE_ID: ClassVar[bytes] = OUCH_INBOUND_MSG_TYPE.ENTER_ORDER.value
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
    reserved_bits: str = "0000000"




@dataclass
class ReplaceOrder:
    TYPE_ID: ClassVar[bytes] = OUCH_INBOUND_MSG_TYPE.REPLACE_ORDER.value
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

@dataclass
class CancelOrder:
    TYPE_ID: ClassVar[bytes] = OUCH_INBOUND_MSG_TYPE.CANCEL_ORDER.value
    order_token: str                          # 14 bytes from original Enter :contentReference[oaicite:12]{index=12}

@dataclass
class CancelOrderByID:
    TYPE_ID: ClassVar[bytes] = OUCH_INBOUND_MSG_TYPE.CANCEL_ORDER_BY_ID.value
    order_book_id: int
    side: str                                 # 'B' or 'S'                 :contentReference[oaicite:13]{index=13}
    order_id: int

# helper for MassQuote repeating block
@dataclass
class QuoteEntry:
    order_book_id: int
    bid_px: int
    offer_px: int
    bid_size: int
    offer_size: int

@dataclass
class MassQuote:
    TYPE_ID: ClassVar[bytes] = OUCH_INBOUND_MSG_TYPE.MASS_QUOTE.value
    order_token: str
    client_category: int
    client_account: str
    exchange_info: str
    quote_entries: List[QuoteEntry]           # 1-5 entries, each 28 bytes  :contentReference[oaicite:14]{index=14}

# ── outbound (exchange → client) ────────────────────────────────────────

@dataclass
class OrderAck:
    TYPE_ID: ClassVar[bytes] = OUCH_OUTBOUND_MSG_TYPE.ORDER_ACK.value
    ts_ns: int
    order_token: str
    order_book_id: int
    side: str
    order_id: int
    qty: int
    price: int
    time_in_force: int
    open_close: int
    order_state: int                          # 1=on book, 2=not on book … :contentReference[oaicite:15]{index=15}
    client_account: str
    customer_info: str
    exchange_info: str
    display_qty: int
    client_category: int
    off_hours: int
    reserved_bits: bytes

@dataclass
class OrderReject:
    TYPE_ID: ClassVar[bytes] = OUCH_OUTBOUND_MSG_TYPE.ORDER_REJECT.value
    ts_ns: int
    order_token: str
    reject_code: int                          # signed int                 :contentReference[oaicite:16]{index=16}

@dataclass
class OrderReplaceAck:
    TYPE_ID: ClassVar[bytes] = OUCH_OUTBOUND_MSG_TYPE.ORDER_REPLACE_ACK.value
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
    order_state: int
    client_account: str
    customer_info: str
    exchange_info: str
    display_qty: int
    client_category: int
    reserved_bits: bytes

@dataclass
class OrderCancelAck:
    TYPE_ID: ClassVar[bytes] = OUCH_OUTBOUND_MSG_TYPE.ORDER_CANCEL_ACK.value
    ts_ns: int
    order_token: str
    order_book_id: int
    side: str
    order_id: int
    reason: int                               # see CancelReason enum      :contentReference[oaicite:17]{index=17}

@dataclass
class OrderExecuted:
    TYPE_ID: ClassVar[bytes] = OUCH_OUTBOUND_MSG_TYPE.ORDER_EXECUTED.value
    ts_ns: int
    order_token: str
    order_book_id: Optional[int]              # only for combo fills
    traded_qty: int
    leaves_qty: int
    trade_price: int
    match_id: int
    client_category: int
    reserved_bits: bytes                      # 16-byte reserved           :contentReference[oaicite:18]{index=18}

@dataclass
class MassQuoteAck:
    TYPE_ID: ClassVar[bytes] = OUCH_OUTBOUND_MSG_TYPE.MASS_QUOTE_ACK.value
    ts_ns: int
    order_token: str
    order_book_id: int
    side: str
    quote_status: int                         # 0=accept,1=updated,2=canceled,5=traded
    quantity: int
    traded_quantity: int
    price: int                                # traded price if status 5   :contentReference[oaicite:19]{index=19}

@dataclass
class MassQuoteReject:
    TYPE_ID: ClassVar[bytes] = OUCH_OUTBOUND_MSG_TYPE.MASS_QUOTE_REJECT.value
    ts_ns: int
    order_token: str
    order_book_id: Optional[int]              # blank when “all quotes rejected”
    reject_code: int                          # see error-code catalogue   :contentReference[oaicite:20]{index=20}