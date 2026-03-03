#!/bin/sh
# Replaces placeholder values in config.js with environment variables at container startup.
# This runs ONCE when the container starts, before Nginx serves the files.

CONFIG="/usr/share/nginx/html/js/config.js"

sed -i "s|__PORTAL_DOMAIN__|${PORTAL_DOMAIN:-portal.example.com}|g" "$CONFIG"
sed -i "s|__PORTAL_URL__|${PORTAL_URL:-http://portal.example.com:8888}|g" "$CONFIG"
sed -i "s|__APP1_URL__|${APP1_URL:-http://localhost:3000}|g" "$CONFIG"
sed -i "s|__APP2_URL__|${APP2_URL:-http://localhost:8080}|g" "$CONFIG"
sed -i "s|__APP3_URL__|${APP3_URL:-http://localhost:9090}|g" "$CONFIG"
sed -i "s|__APP4_URL__|${APP4_URL:-http://localhost:7860}|g" "$CONFIG"

echo "Portal config updated:"
grep '"url":' "$CONFIG"

# Start Nginx
exec nginx -g 'daemon off;'
