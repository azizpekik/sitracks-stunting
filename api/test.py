def handler(event, context):
    """
    Ultra-simple test handler
    """
    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
        },
        "body": '{"message": "Vercel Python function works!"}'
    }