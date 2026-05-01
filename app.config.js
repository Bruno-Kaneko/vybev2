const appJson = require('./app.json');

module.exports = ({ config }) => {
  const base = { ...appJson.expo, ...config };
  return {
    ...base,
    plugins: [
      'expo-router',
      'expo-camera',
      'expo-web-browser',
      'expo-apple-authentication',
      [
        'expo-image-picker',
        {
          photosPermission: 'O VYBE precisa acessar suas fotos para você postar na festa.',
          cameraPermission: 'O VYBE precisa da câmera para você capturar o momento.',
        },
      ],
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission:
            'O VYBE usa sua localização para mostrar onde as pessoas estão e conectar você com quem está perto.',
          locationWhenInUsePermission:
            'O VYBE usa sua localização para mostrar onde as pessoas estão.',
        },
      ],
    ],
  };
};
