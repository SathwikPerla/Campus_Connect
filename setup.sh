#!/bin/bash

# WhisprNet Setup Script
echo "🚀 Setting up WhisprNet - Anonymous Social Hub with AI Moderation"
echo "=================================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js (v16 or higher) first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Create environment files if they don't exist
echo "📝 Setting up environment files..."

# Server environment
if [ ! -f "server/.env" ]; then
    echo "Creating server/.env from template..."
    cp server/env.example server/.env
    echo "✅ Server environment file created"
else
    echo "✅ Server environment file already exists"
fi

# Client environment
if [ ! -f "client/.env" ]; then
    echo "Creating client/.env from template..."
    cp client/env.example client/.env
    echo "✅ Client environment file created"
else
    echo "✅ Client environment file already exists"
fi

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
if [ ! -d "node_modules" ]; then
    npm install
    echo "✅ Server dependencies installed"
else
    echo "✅ Server dependencies already installed"
fi
cd ..

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client
if [ ! -d "node_modules" ]; then
    npm install
    echo "✅ Client dependencies installed"
else
    echo "✅ Client dependencies already installed"
fi
cd ..

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update environment variables in server/.env and client/.env"
echo "2. Start the backend: cd server && npm start"
echo "3. Start the frontend: cd client && npm run dev"
echo ""
echo "🌐 Access the application:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:5000"
echo ""
echo "📚 For detailed setup instructions, see README.md"
echo ""
echo "Happy coding! 🚀"




