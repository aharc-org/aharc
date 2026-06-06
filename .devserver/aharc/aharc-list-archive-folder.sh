#!/bin/bash

TARGET="/home/rex/github/aharc/archive"
OUTPUT="dir.txt"

# List only directories (not files) and save to dir.txt
find "$TARGET" -maxdepth 1 -type d -printf "%f\n" | sort > "$OUTPUT"

echo "Folder names saved to $OUTPUT"

