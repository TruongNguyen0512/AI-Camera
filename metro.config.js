const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push("tflite"); // Thêm 'tflite' vào danh sách assetExts

module.exports = config;
