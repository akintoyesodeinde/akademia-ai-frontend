#!/bin/sh
set -eu

API_BASE_URL="${VITE_API_BASE_URL:-}"
ESCAPED_API_BASE_URL=$(printf '%s' "$API_BASE_URL" | sed 's/\\/\\\\/g; s/"/\\"/g')

cat > /usr/share/nginx/html/config.js <<EOF
window.__AKADEMIA_CONFIG__ = {
  VITE_API_BASE_URL: "${ESCAPED_API_BASE_URL}"
};
EOF

cat > /etc/nginx/conf.d/security-headers.inc <<'EOF'
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' http: https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';" always;
EOF

PROXY_BLOCK=""
if [ -n "${API_UPSTREAM:-}" ]; then
  UPSTREAM_CLEAN=$(printf '%s' "$API_UPSTREAM" | sed 's:/*$::')
  PROXY_BLOCK="
    location /api/ {
        proxy_pass ${UPSTREAM_CLEAN}/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        client_max_body_size 25m;
        proxy_read_timeout 120s;
    }
"
fi

cat > /etc/nginx/conf.d/default.conf <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name _;
    server_tokens off;

    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;

    include /etc/nginx/conf.d/security-headers.inc;

    location = /healthz {
        access_log off;
        default_type application/json;
        return 200 '{"status":"healthy","service":"akademia-ai-frontend"}';
    }

    location = /health {
        access_log off;
        default_type application/json;
        return 200 '{"status":"healthy","service":"akademia-ai-frontend"}';
    }
${PROXY_BLOCK}
    location = /config.js {
        add_header Cache-Control "no-store, no-cache, must-revalidate" always;
        include /etc/nginx/conf.d/security-headers.inc;
        try_files \$uri =404;
    }

    location = /index.html {
        add_header Cache-Control "no-store, no-cache, must-revalidate" always;
        include /etc/nginx/conf.d/security-headers.inc;
    }

    location ^~ /assets/ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable" always;
        include /etc/nginx/conf.d/security-headers.inc;
        try_files \$uri =404;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF
