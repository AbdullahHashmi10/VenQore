#!/bin/bash
cd /home/claude/vq/main/public
export VQ_OTP_MAX_SENDS_PER_EMAIL_HOUR=500 VQ_OTP_MAX_SENDS_PER_IP_HOUR=500 VQ_OTP_GLOBAL_DAILY_BUDGET=5000 DB_DATABASE=amd_pos_e2e APP_ENV=local APP_DEBUG=true APP_URL=http://127.0.0.1:8010 MAIL_MAILER=log SESSION_SECURE_COOKIE=false TURNSTILE_SECRET_KEY= TURNSTILE_SITE_KEY= LOG_CHANNEL=single
echo $$ > /tmp/e2e-serve.pid
exec php -d memory_limit=1G -S 127.0.0.1:8010 ../vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php
