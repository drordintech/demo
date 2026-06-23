import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface responsibleperson {
  id: number;
  name: string;
}

@Injectable({
  providedIn: 'root',
})

export class responsiblepersonService {
  constructor(private http: HttpClient) { }
  getresponsiblepersons(): Observable<responsibleperson[]> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<responsibleperson[]>(environment['apiUrl'] + "responsibleperson/Getresponsibleperson", { headers });
  }

 

  createresponsibleperson(responsibleperson: responsibleperson): Observable<any> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.post(environment['apiUrl'] + "responsibleperson", responsibleperson, { headers });
  }

  updateresponsibleperson(id: number, responsibleperson: responsibleperson): Observable<any> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.put(environment['apiUrl'] + `responsibleperson/${id}`, responsibleperson, { headers });
  }

  deleteresponsibleperson(id: number): Observable<any> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.delete(environment['apiUrl'] + `responsibleperson/${id}`, { headers });
  }
}
