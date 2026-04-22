#!/bin/bash
set -e
# Remove persisted sessions and temporary files to free disk and avoid stale state
rm -rf sessions/* || true
rm -rf /tmp/* || true
echo "sessions and /tmp cleaned"
