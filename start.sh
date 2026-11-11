#!/bin/bash
# ==============================================================================
# Examia - Intelligent Examination Timetable Generator
# College DAA Mini-Project Launcher
# ==============================================================================
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "======================================================================"
echo "  EXAMIA — Intelligent Examination Timetable Generator"
echo "  DAA Algorithms: Welsh-Powell Greedy & Recursive Backtracking"
echo "======================================================================"

# Step 1: Detect Java and compile backend
echo "[1/3] Checking Java Runtime..."
if [ -z "$JAVA_HOME" ]; then
    if [ -d "/Library/Java/JavaVirtualMachines/jdk-21.jdk/Contents/Home" ]; then
        export JAVA_HOME="/Library/Java/JavaVirtualMachines/jdk-21.jdk/Contents/Home"
    elif [ -d "/Library/Java/JavaVirtualMachines/jdk-26.jdk/Contents/Home" ]; then
        export JAVA_HOME="/Library/Java/JavaVirtualMachines/jdk-26.jdk/Contents/Home"
    elif [ -x "$(command -v /usr/libexec/java_home)" ]; then
        export JAVA_HOME=$(/usr/libexec/java_home -v 21 2>/dev/null || /usr/libexec/java_home 2>/dev/null || true)
    fi
fi

if [ -n "$JAVA_HOME" ] && [ -x "$JAVA_HOME/bin/javac" ]; then
    echo "       Found Java at: $JAVA_HOME"
    ./compile-backend.sh
    
    echo "[2/3] Launching Java DAA REST API on port 8080..."
    $JAVA_HOME/bin/java -cp backend/bin com.examoptima.server.ExamOptimaServer 8080 &
    JAVA_PID=$!
    echo "       Java Backend running with PID $JAVA_PID"
    trap "kill $JAVA_PID 2>/dev/null || true" EXIT
else
    echo "       [Note] Java SDK not in default PATH. The frontend will run in high-fidelity standalone browser mode."
fi

# Step 2: Launch React Frontend
echo "[3/3] Starting Vite Frontend on http://localhost:3000..."
cd frontend
npm run dev
