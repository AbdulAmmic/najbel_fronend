import asyncio
import websockets
import json

async def test():
    try:
        # Connecting to Consultation Room 4 as Doctor
        async with websockets.connect('ws://localhost:8000/api/v1/ws/consultations/4?role=doctor') as ws:
            print("Connected!")
            await ws.send(json.dumps({'text': 'Check your email for offline alerts!', 'senderName': 'Doctor', 'isAiAssisted': False}))
            print("Sent!")
            res = await ws.recv()
            print("Received:", res)
    except Exception as e:
        print("Error:", e)

asyncio.run(test())
