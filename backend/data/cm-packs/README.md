# Content Manager Pack Imports

Place your Content Manager server preset packs in this folder to import them.

## How to Export from Content Manager

1. Open Content Manager
2. Go to Server presets
3. Right-click a preset and select "Pack"
4. Save the archive file
5. Place it in this folder
6. Use the import feature in the AC Server Manager

## Pack Structure

CM packs typically contain:

- `server_cfg.ini` - Main server configuration
- `entry_list.ini` - List of car/driver entries
- `cm_content/` - Additional CM-specific files
- Car/track data references

## Supported Formats

- `.zip` files exported from Content Manager
- `.tar.gz` or `.tgz` compressed archives
- Must contain at minimum `server_cfg.ini`
