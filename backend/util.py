
from ouch_msgs import *
import logging



def create_ouch_message_from_json(req):
    logging.debug(f"Creating OUCH message from JSON: {req}")
    msg_type = req.get("type")
    try:
        if not msg_type:
            raise ValueError("Message type is required")
        else:
            # req["TYPE_ID"] = b'O'
            req.pop("type", None)

        if msg_type == "EnterOrder":
            return EnterOrder(**req)
        elif msg_type == "CancelOrder":
            return CancelOrder(**req)
        elif msg_type == "CancelOrderByID":
            return CancelOrderByID(**req)
        elif msg_type == "ReplaceOrder":
            return ReplaceOrder(**req)
    except Exception as e:
        import traceback
        logging.error(f"Exception in create_ouch_message_from_json: {e}")
        logging.error(traceback.format_exc())  
        return None
        
def pad_str(s: str, length: int) -> bytes:
    b = s.encode('ascii')[:length]
    return b.ljust(length, b'\x00')