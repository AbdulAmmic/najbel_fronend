import asyncio
import websockets
import json

async def test_ws():
    uri = "ws://localhost:8000/api/v1/ws/consultations/5?role=patient"
    print(f"Connecting to {uri}...")
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected!")
            
            # Send message
            msg = {"text": "Hello from test script", "senderName": "Tester"}
            await websocket.send(json.dumps(msg))
            print(f"Sent: {msg}")
            
            # Receive echo
            response = await websocket.recv()
            print(f"Received: {response}")
            
    except websockets.exceptions.InvalidStatusCode as e:
        print(f"Connection Failed: Status {e.status_code}")
        if e.status_code == 403:
            print("Server rejected connection (Forbidden).")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_ws())
