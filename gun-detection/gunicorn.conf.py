# Gunicorn configuration file
import multiprocessing
import os

# Server socket
bind = f"0.0.0.0:{os.getenv('PORT', 5002)}"
backlog = 2048

# Worker processes
workers = min(multiprocessing.cpu_count() * 2 + 1, 4)  # Max 4 workers for starter plan
worker_class = "sync"
worker_connections = 1000
timeout = 300  # 5 minutes for video processing
keepalive = 2

# Restart workers after this many requests, to help prevent memory leaks
max_requests = 1000
max_requests_jitter = 50

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = 'gun-detection-api'

# Server mechanics
daemon = False
pidfile = None
user = None
group = None
tmp_upload_dir = None

# SSL (if needed)
keyfile = None
certfile = None
