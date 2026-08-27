import packageInfo from '../../package.json';

export const environment = {
  appVersion: packageInfo.version,
  //production: true,
  //apiUrl : 'https://192.168.0.194:8093/api/',
  apiUrl: 'http://localhost:5000/api/',
  // apiUrl: `${window.location.protocol}//${window.location.hostname}:7075/api/`,
  // apiUrl : 'https://webapidrodin.gsonssolutions.com/api/',
};

