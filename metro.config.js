const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite on web ships its SQLite engine as a .wasm file.
config.resolver.assetExts.push('wasm');

module.exports = config;
