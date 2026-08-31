import packageInfo from '../../package.json';

export const environment = {
  appVersion: packageInfo.version,
  production: true,
  apiUrl: (() => {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port;
    if (port === '8094') {
      return `${protocol}//${hostname}:8093/api/`;
    }
    return `${protocol}//${hostname}:7075/api/`;
  })(),
  //apiUrl : 'https://localhost:7075/api/',
  // apiUrl : 'https://webapidrodin.gsonssolutions.com/api/',
};
