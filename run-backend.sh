#!/bin/bash
# ==============================================================================
# Examia - Java DAA Backend Server Launcher
# ==============================================================================
set -e

PORT=${1:-8080}

if [ -z "$JAVA_HOME" ]; then
    if [ -d "/Library/Java/JavaVirtualMachines/jdk-21.jdk/Contents/Home" ]; then
        export JAVA_HOME="/Library/Java/JavaVirtualMachines/jdk-21.jdk/Contents/Home"
    elif [ -d "/Library/Java/JavaVirtualMachines/jdk-26.jdk/Contents/Home" ]; then
        export JAVA_HOME="/Library/Java/JavaVirtualMachines/jdk-26.jdk/Contents/Home"
    elif [ -x "$(command -v /usr/libexec/java_home)" ]; then
        export JAVA_HOME=$(/usr/libexec/java_home -v 21 2>/dev/null || /usr/libexec/java_home 2>/dev/null || true)
    fi
fi

JAVA="java"
if [ -n "$JAVA_HOME" ] && [ -x "$JAVA_HOME/bin/java" ]; then
    JAVA="$JAVA_HOME/bin/java"
fi

if [ ! -d "backend/bin" ] || [ ! -f "backend/bin/com/examoptima/server/ExamOptimaServer.class" ]; then
    echo "Class files not found. Compiling first..."
    ./compile-backend.sh
fi

echo "Starting Examia DAA Server on port $PORT..."
$JAVA -cp backend/bin com.examoptima.server.ExamOptimaServer $PORT
