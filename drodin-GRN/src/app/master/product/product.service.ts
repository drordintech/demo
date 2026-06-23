import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface product {
  productId: number;
  ProductCode: string;
  name: string;
  description:string;
  BrandId:number;
}

@Injectable({
  providedIn: 'root',
})

export class productService {
  constructor(private http: HttpClient) { }
  getproducts(): Observable<product[]> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<product[]>(environment['apiUrl'] + "Product/GetProduct", { headers });
  }

 

  getbrands(): Observable<product[]> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<product[]>(environment['apiUrl'] + "product/GetBrands", { headers });
  }

  getsalt(id: number): Observable<product> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<product>(environment['apiUrl'] + `product/${id}`, { headers });
  }

  createproduct(product: product): Observable<any> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.post(environment['apiUrl'] + "product", product, { headers });
  }

  updateproduct(id: number, salt: product): Observable<any> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.put(environment['apiUrl'] + `product/${id}`, salt, { headers });
  }

  deleteproduct(id: number): Observable<any> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.delete(environment['apiUrl'] + `product/${id}`, { headers });
  }
}
