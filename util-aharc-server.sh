#!/bin/bash

# Serve GitHub Pages-like site locally

# 1. Remove old temp folder
rm -rf .devserver

# 2. Copy everything into a temp folder that mirrors production
mkdir -p .devserver/aharc
cp -r * .devserver/aharc/

# 3. Move into temp folder
cd .devserver/aharc || exit

# 4. Start Python HTTP server on port 8001
echo "Serving at http://localhost:8001/aharc/"
python3 -m http.server 8001
