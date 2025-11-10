def handler(event, context):
    """
    Simple test handler to verify Vercel function works
    """
    print("=== Simple Handler Called ===")
    print(f"Event: {event}")
    print(f"Context: {context}")

    # Get the path from the event
    path = event.get('path', '/')
    method = event.get('httpMethod', 'GET')

    if path == '/auth/login' and method == 'POST':
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
            },
            "body": '{"message": "Simple test handler works", "path": "' + path + '"}'
        }

    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
        },
        "body": '{"message": "Simple test handler works", "path": "' + path + '"}'
    }