import { Injectable } from '@angular/core';
import { HttpClient,HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';


export interface linkmanufacturesalt {
  linkmanufacturesaltId: number;
  name: string;
  address: string;
  email: string;
  phoneNumber: string;
  otherInfo:string;
}

export interface Manufacturer {
  manufacturerId: number;
  name: string;
  address: string;
  email: string;
  phoneNumber: string;
  checked: boolean; 
  otherInformation:string;
}

export interface saltByManufacId {
  saltId: number;
  name: string;
}

export interface saltStockLocationWise {
  saltID: number;
  saltName: string;
  locationID: number;
  locationName: string;
  stockQuantity: number;
}

@Injectable({
  providedIn: 'root',
})
export class linkmanufacturesaltService {
  constructor(private http: HttpClient) {}
  getManufacturers(): Observable<Manufacturer[]> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<Manufacturer[]>(environment['apiUrl']+"Manufacturer", { headers });
  }

  getlinkmanufacturesalts(): Observable<linkmanufacturesalt[]> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<linkmanufacturesalt[]>(environment['apiUrl']+"LinkSaltManufacturer", { headers });
  }

  getlinkmanufacturesalt(id: number): Observable<linkmanufacturesalt> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<linkmanufacturesalt>(environment['apiUrl']+`LinkSaltManufacturer"/${id}`, { headers });
  }

  createlinkmanufacturesalt(linkmanufacturesalt: linkmanufacturesalt): Observable<any> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.post(environment['apiUrl']+"LinkSaltManufacturer", linkmanufacturesalt, { headers });
  }

  updatelinkmanufacturesalt(id: number, linkmanufacturesalt: linkmanufacturesalt): Observable<any> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.put(environment['apiUrl']+`LinkSaltManufacturer/${id}`, linkmanufacturesalt, { headers });
  }

  deletelinkmanufacturesalt(id: number): Observable<any> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.delete(environment['apiUrl']+`LinkSaltManufacturer/${id}`, { headers });
  }

  fetchSaltDetailsbyManufacturer(name: string): Observable<any> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get(environment['apiUrl']+`LinkSaltManufacturer/fetchSaltDetailsbyManufacturer?manufacturerId=`+name, { headers });
  }

  fetchManufacturerDetailsbySalt(name: string): Observable<any> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get(environment['apiUrl']+`LinkSaltManufacturer/fetchManufacturerDetailsbySaltId?saltId=`+name, { headers });
  }

  GetStockBySaltId(name: string): Observable<any> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get(environment['apiUrl']+`LinkSaltManufacturer/GetStockBySaltId?saltId=`+name, { headers });
  }
}
