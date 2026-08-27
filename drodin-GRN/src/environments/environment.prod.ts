import packageInfo from '../../package.json';

export const environment = {
  appVersion: packageInfo.version,
  production: true,
  apiUrl: `${window.location.protocol}//${window.location.hostname}:7075/api/`,
  //apiUrl : 'https://localhost:7075/api/',
  // apiUrl : 'https://webapidrodin.gsonssolutions.com/api/',
};
