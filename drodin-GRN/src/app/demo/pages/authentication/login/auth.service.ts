import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private http: HttpClient) {}
  login(UserName: string, Password: string): Observable<any> {
    
    const payload = { UserName, Password };
    return this.http.post<any>(environment['apiUrl']+"Account/Authenticate", payload);
  }
}
