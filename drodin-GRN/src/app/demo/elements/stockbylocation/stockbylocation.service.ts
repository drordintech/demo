import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';


export interface salt {
  saltId: number;
  name: string;
  address: string;
  email: string;
  phoneNumber: string;
  otherInfo:string;
}

@Injectable({
  providedIn: 'root',
})
export class stockbylocationService {

  constructor(private http: HttpClient) {}

  getsalts(): Observable<salt[]> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<salt[]>(environment['apiUrl'] + "salt", { headers });
  }

  getsalt(id: number): Observable<salt> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<salt>(environment['apiUrl'] + `salt/${id}`, { headers });
  }

  createsalt(salt: salt): Observable<any> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.post(environment['apiUrl'] + "salt", salt, { headers });
  }

  updatesalt(id: number, salt: salt): Observable<any> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.put(environment['apiUrl'] + `salt/${id}`, salt, { headers });
  }

  deletesalt(id: number): Observable<any> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.delete(environment['apiUrl'] + `salt/${id}`, { headers });
  }
}
