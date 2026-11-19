const { validateApiUrl } = require("./config/api-url.cjs");

module.exports = ({ config }) => {
  const profile = process.env.EAS_BUILD_PROFILE;
  const isApk = profile === "apk-lan" || profile === "apk";
  if (isApk)
    validateApiUrl(process.env.EXPO_PUBLIC_API_URL, {
      allowHttp: profile === "apk-lan",
    });
  return {
    ...config,
    plugins: [
      ...(config.plugins || []),
      [
        "expo-build-properties",
        { android: { usesCleartextTraffic: profile === "apk-lan" } },
      ],
    ],
  };
};
