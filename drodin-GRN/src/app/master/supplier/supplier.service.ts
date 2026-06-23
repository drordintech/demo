import { Injectable } from '@angular/core';
import { HttpClient,HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Supplier {
  supplierID: number;
  name: string;
  address: string;
  email: string;
  phoneNumber: string;
  otherInformation:string;
  state:string;
}

@Injectable({
  providedIn: 'root',
})
export class SupplierService {
  constructor(private http: HttpClient) {}

  getSuppliers(): Observable<Supplier[]> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<Supplier[]>(environment['apiUrl']+"Supplier", { headers });
  }
  getDistinctStates(): Observable<Supplier[]> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<Supplier[]>(environment['apiUrl']+"GRN/getDistinctStates", { headers });
  }

  getloadResponsiblePerson(): Observable<any> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<any>(environment['apiUrl']+"GRN/GetResponsiblePersons", { headers });
  }
  
  getSupplier(id: number): Observable<Supplier> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
     return this.http.get<Supplier>(environment['apiUrl']+ `Supplier/${id}`, { headers });
  }

  createSupplier(Supplier: Supplier): Observable<any> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
     return this.http.post(environment['apiUrl']+"Supplier", Supplier, { headers });
  }

  updateSupplier(id: number, Supplier: Supplier): Observable<any> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
      return this.http.post(environment['apiUrl']+ `Supplier/UpdateSupplier?Supplierid=${id}`, Supplier, { headers });
  }

  deleteSupplier(id: string): Observable<any> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get(environment['apiUrl']+ `Supplier/SupplierDelete?SupplierId=`+id, { headers });
  }
  
  linkSaltwithSupplier(SupplierId:string,SaltId: string): Observable<any> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get(environment['apiUrl']+ `Supplier/linkSaltwithSupplier?SupplierId=`+SupplierId+`&SaltId=`+SaltId, { headers });
  }
}
