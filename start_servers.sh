#!/bin/bash

# Kill any existing servers on port 8000
echo "Stopping any existing servers on port 8000..."
lsof -ti:8000 | xargs kill -9 2>/dev/null

# Wait a moment for ports to be released
sleep 2

# Start Django backend server
echo "Starting Django backend server on port 8000..."
cd /Users/kuwatataiga/Downloads/resume_truemee_backup/back
./venv_new/bin/python3.13 manage.py runserver 0.0.0.0:8000 &
DJANGO_PID=$!

echo "Django server started with PID: $DJANGO_PID"

# Wait a moment for Django to start
sleep 3

# Start Next.js frontend server (if not already running)
echo "Starting Next.js frontend server..."
cd /Users/kuwatataiga/Downloads/resume_truemee_backup/frontend

# Check if Next.js is already running
if ! lsof -ti:3000 > /dev/null; then
    npm run dev &
    NEXT_PID=$!
    echo "Next.js server started with PID: $NEXT_PID"
else
    echo "Next.js server is already running on port 3000"
fi

echo ""
echo "========================================="
echo "Servers are running:"
echo "Django backend: http://localhost:8000"
echo "Next.js frontend: http://localhost:3000"
echo "========================================="
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for user to press Ctrl+C
trap 'echo "Stopping servers..."; kill $DJANGO_PID 2>/dev/null; exit' INT
wait