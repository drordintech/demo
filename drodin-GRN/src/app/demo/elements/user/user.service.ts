import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface user {
  userId: number;
  emailAddress: string;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class userService {
  constructor(private http: HttpClient) { }
  getusers(): Observable<user[]> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<user[]>(environment['apiUrl'] + "user", { headers });
  }

    updateUser(id: number, status: boolean): Observable<any> {
      const token = localStorage.getItem('logintoken');
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });
        return this.http.post(environment['apiUrl']+ `User/UpdateUser?Userid=`+id+`&Status=`+status, { headers });
    }
  

  getuser(id: number): Observable<user> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<user>(environment['apiUrl'] + `user/${id}`, { headers });
  }

  createuser(user: user): Observable<any> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.post(environment['apiUrl'] + "user", user, { headers });
  }

  updateuser(id: number, user: user): Observable<any> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.put(environment['apiUrl'] + `user/${id}`, user, { headers });
  }

  deleteuser(id: number): Observable<any> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.delete(environment['apiUrl'] + `user/${id}`, { headers });
  }
}
