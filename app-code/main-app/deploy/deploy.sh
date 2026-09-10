#!/usr/bin/env bash
set -euo pipefail

# Compatibility entry point. Deployment logic has one source of truth.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$SCRIPT_DIR/../deploy.sh" "$@"
