import packageInfo from '../../package.json';

export const environment = {
  appVersion: packageInfo.version,
  //production: true,
  //apiUrl : 'https://192.168.0.194:8093/api/',
  // apiUrl : 'https://localhost:7075/api/',
  apiUrl: 'http://localhost:5000/api/',
  //apiUrl: `${window.location.protocol}//${window.location.hostname}:8093/api/`, 
  //  // https://localhost:5001/
  // apiUrl : 'https://webapidrodin.gsonssolutions.com/api/',
};

