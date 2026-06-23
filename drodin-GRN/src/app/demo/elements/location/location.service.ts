import { Injectable } from '@angular/core';
import { HttpClient,HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface location {
  locationId: number;
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class locationService {
  constructor(private http: HttpClient) {}
  getlocations(): Observable<location[]> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<location[]>(environment['apiUrl']+"location", { headers });
  }

  getlocation(id: number): Observable<location> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<location>(environment['apiUrl']+`location/${id}`, { headers });
  }

  createlocation(location: location): Observable<any> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.post(environment['apiUrl']+"location", location, { headers });
  }

  updatelocation(id: number, location: location): Observable<any> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.put(environment['apiUrl']+`location/${id}`, location, { headers });
  }

  deletelocation(id: number): Observable<any> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.delete(environment['apiUrl']+`location/${id}`, { headers });
  }
}
