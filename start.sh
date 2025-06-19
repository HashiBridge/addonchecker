#!/bin/bash

echo "Starting AddonChecker application..."

echo "Starting backend..."
cd addonchecker-backend
poetry install
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

sleep 3

echo "Starting frontend..."
cd addonchecker-frontend
npm install
npm run dev &
FRONTEND_PID=$!
cd ..

echo "Application started successfully!"
echo "Frontend: http://localhost:5173"
echo "Backend API: http://localhost:8000"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "To stop: kill $BACKEND_PID $FRONTEND_PID"
