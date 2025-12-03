# Deprecated Files

This directory contains files that are no longer actively used but kept for reference.

## Files

### `ac-setup-wizard.service`

- **Purpose**: Systemd service file for the old setup wizard
- **Status**: Replaced by manual PM2 setup
- **Date Deprecated**: December 2025
- **Safe to Delete**: After confirming PM2 setup works on all deployments

### `setup-wizard.html`

- **Purpose**: Original standalone setup wizard UI
- **Status**: Replaced by integrated Settings page in React app
- **Date Deprecated**: December 2025
- **Safe to Delete**: Yes, functionality moved to `/frontend/src/pages/Settings.jsx`

### `git-cache-server.sh`

- **Purpose**: Git cache server for faster clones (unclear original purpose)
- **Status**: Not used in current deployment workflow
- **Date Deprecated**: December 2025
- **Safe to Delete**: After verifying no scripts reference it

## Cleanup Policy

Files in this directory should be:

1. Reviewed after 3 months
2. Deleted if confirmed unused
3. Documented if they contain unique logic worth preserving

Last Review: December 3, 2025
