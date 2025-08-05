#!/bin/bash

# Start the server
echo "Starting server..."
cd server
node simple-server.js &
SERVER_PID=$!

# Start the client
echo "Starting client..."
cd ../client
npm start &
CLIENT_PID=$!

echo "Server started with PID: $SERVER_PID"
echo "Client started with PID: $CLIENT_PID"
echo "Press Ctrl+C to stop both processes"

# Wait for Ctrl+C
trap "kill $SERVER_PID $CLIENT_PID; exit" INT
wait 