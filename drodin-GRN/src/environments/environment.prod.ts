import packageInfo from '../../package.json';

export const environment = {
  appVersion: packageInfo.version,
  production: true,
  apiUrl: `${window.location.protocol}//${window.location.hostname}:8093/api/`,
  //apiUrl : 'http://192.168.0.194:8093/api/',
  // // apiUrl : 'https://webapidrodin.gsonssolutions.com/api/',
};
