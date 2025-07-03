# sample 
import json

# Received event: {
#    type: 'Type: A',
#    payload: {
#      ts_ns: 1751544073564577000,
#      order_token: 'ORD440682629HZ',
#      order_book_id: 1232,
#      side: 'S',
#      order_id: 10001,
#      qty: 123,
#      price: 2200,
#      time_in_force: 0,
#      open_close: 0,
#      client_account: '334',
#      order_state: 1,
#      customer_info: '',
#      exchange_info: '',
#      pretrade_qty: 123,
#      display_qty: 0,
#      client_category: 1,
#      off_hours: 1
#    }

# Order sent to backend: {
#    type: 'EnterOrder',
#    order_token: 'ORD44075547BS4',
#    order_book_id: 12,
#    side: 'B',
#    qty: 123,
#    price: 22,
#    time_in_force: 0,
#    open_close: 0,
#    client_account: '3',
#    customer_info: '',
#    exchange_info: '',
#    display_qty: 0,
#    client_category: 1,
#    off_hours: 1
#  }

def lambda_handler(event, context):
    """
    Lambda function to create a daily report.
    No real use for now, needs persistent session storage for real use.
    """
    try:
        print("Creating daily report...")
        

        
        # Simulate successful report creation
        print("Daily report created successfully.")
        
        # return a list of OUCH messages passed during the session
        list_of_messages = [
            {
                'type': 'EnterOrder',
                'order_token': 'ORD44075547BS4',
                'order_book_id': 12,
                'side': 'B',
                'qty': 123,
                'price': 22,    
                'time_in_force': 0,
                'open_close': 0,    
                'client_account': '3',
                'customer_info': '',
                'exchange_info': '',
                'display_qty': 0,
                'client_category': 1,
                'off_hours': 1
            },
            {
                'type': 'EnterOrder',
                'order_token': 'ORD440682629HZ',
                'order_book_id': 1232,
                'side': 'S',
                'order_id': 10001,
                'qty': 123,
                'price': 2200,
                'time_in_force': 0, 
                'open_close': 0,
                'client_account': '334',
                'order_state': 1,
                'customer_info': '',
                'exchange_info': '',
                'display_qty': 0,
                'client_category': 1,
                'off_hours': 1
            }
        ]
        # Convert the list of messages to JSON
        messages_json = json.dumps(list_of_messages)    

        return {
            'statusCode': 200,
            'body': messages_json
        }
    
    except Exception as e:
        print(f"Error creating daily report: {e}")
        return {
            'statusCode': 500,
            'body': f"Error creating daily report: {str(e)}"
        }