#!/bin/bash
cd "$(dirname "$0")"
(sleep 1; open http://127.0.0.1:8930/ 2>/dev/null || xdg-open http://127.0.0.1:8930/ 2>/dev/null) &
python3 serve.py 8930
