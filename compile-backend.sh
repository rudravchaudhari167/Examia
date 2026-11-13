#!/bin/bash
# ==============================================================================
# Examia - Java DAA Backend Compiler (Target: Java 21 LTS)
# ==============================================================================
set -e

# Detect JAVA_HOME (Prioritize JDK 21 LTS)
if [ -z "$JAVA_HOME" ]; then
    if [ -d "/Library/Java/JavaVirtualMachines/jdk-21.jdk/Contents/Home" ]; then
        export JAVA_HOME="/Library/Java/JavaVirtualMachines/jdk-21.jdk/Contents/Home"
    elif [ -d "/Library/Java/JavaVirtualMachines/jdk-26.jdk/Contents/Home" ]; then
        export JAVA_HOME="/Library/Java/JavaVirtualMachines/jdk-26.jdk/Contents/Home"
    elif [ -x "$(command -v /usr/libexec/java_home)" ]; then
        export JAVA_HOME=$(/usr/libexec/java_home -v 21 2>/dev/null || /usr/libexec/java_home 2>/dev/null || true)
    fi
fi

JAVAC="javac"
if [ -n "$JAVA_HOME" ] && [ -x "$JAVA_HOME/bin/javac" ]; then
    JAVAC="$JAVA_HOME/bin/javac"
fi

echo "Compiling Examia Java Backend with $JAVAC targeting Java 21 LTS..."
rm -rf backend/bin
mkdir -p backend/bin
$JAVAC --release 21 -d backend/bin $(find backend/src -name "*.java")
echo "Compilation successful! Target bytecode: Java 21 LTS (Major version: 65)."
