import { Injectable } from '@angular/core';
import { HttpClient,HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Manufacturer {
  manufacturerId: number;
  name: string;
  address: string;
  email: string;
  phoneNumber: string;
  otherInformation:string;
}

@Injectable({
  providedIn: 'root',
})
export class ManufacturerService {
  constructor(private http: HttpClient) {}

  getManufacturers(): Observable<Manufacturer[]> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<Manufacturer[]>(environment['apiUrl']+"Manufacturer", { headers });
  }

  getManufacturer(id: number): Observable<Manufacturer> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
     return this.http.get<Manufacturer>(environment['apiUrl']+ `Manufacturer/${id}`, { headers });
  }

  createManufacturer(manufacturer: Manufacturer): Observable<any> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
     return this.http.post(environment['apiUrl']+"Manufacturer", manufacturer, { headers });
  }

  updateManufacturer(id: number, manufacturer: Manufacturer): Observable<any> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
      return this.http.post(environment['apiUrl']+ `Manufacturer/UpdateManufacturer?Manufacturerid=${id}`, manufacturer, { headers });
  }

  deleteManufacturer(id: string): Observable<any> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get(environment['apiUrl']+ `Manufacturer/ManufacturerDelete?ManufacturerId=`+id, { headers });
  }
  
  linkSaltwithManufacturer(ManufacturerId:string,SaltId: string): Observable<any> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get(environment['apiUrl']+ `Manufacturer/linkSaltwithManufacturer?ManufacturerId=`+ManufacturerId+`&SaltId=`+SaltId, { headers });
  }
}
