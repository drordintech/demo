import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})

export class grnService {
  constructor(private http: HttpClient) { }
  /** Blank/invalid expiry is sent as null — never "" or a dummy date. */
  private toOptionalExpiryDate(value: any): string | null {
    if (value === null || value === undefined) {
      return null;
    }
    const text = String(value).trim();
    if (!text || text.startsWith('0001-01-01') || text.startsWith('1900-01-01')) {
      return null;
    }
    const parsed = new Date(text);
    if (isNaN(parsed.getTime())) {
      return null;
    }
    return parsed.toISOString();
  }

  private sanitizeGrnPayload(payload: any): any {
    if (!payload || !Array.isArray(payload.grnDetails)) {
      return payload;
    }
    return {
      ...payload,
      grnDetails: payload.grnDetails.map((detail: any) => ({
        ...detail,
        expiryDate: this.toOptionalExpiryDate(detail?.expiryDate ?? detail?.ExpiryDate)
      }))
    };
  }

  saveGrn(payload: any): Observable<any> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.post(environment['apiUrl'] + "GRN/SaveGRN", this.sanitizeGrnPayload(payload), { headers });
  }

  getStockRepairDefaults(payload: any): Observable<any> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.post(environment['apiUrl'] + "GRN/stock-repair-defaults", payload, { headers });
  }

  SaveChallan(payload: any): Observable<any> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.post(environment['apiUrl'] + "GRN/SaveChallan", payload, { headers });
  }
  
  genrateGRN(): Observable<any> {
      const token = localStorage.getItem('logintoken');
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });
      return this.http.get<any>(environment['apiUrl'] + "GRN/generateGrnNumber", { headers });
    }

    genratechallanNumber(): Observable<any> {
      const token = localStorage.getItem('logintoken');
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });
      return this.http.get<any>(environment['apiUrl'] + "GRN/genratechallanNumber", { headers });
    }

  getGrnReport(payload: any): Observable<any> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get(environment.apiUrl + "GRN/getGrnReport", { headers, params: payload });
  }

  getGrnReportByState(payload: any): Observable<any> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get(environment.apiUrl + "GRN/getGrnReportByState", { headers, params: payload });
  }

  getGrnReportByResponsiblePerson(payload: any): Observable<any> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get(environment.apiUrl + "GRN/getGrnReportByResponsiblePerson", { headers, params: payload });
  }

  gettoprejectedproducts(): Observable<any[]> {
      const token = localStorage.getItem('logintoken');
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });
      return this.http.get<any[]>(environment['apiUrl']+"GRN/top-rejected-products", { headers });
    }
    
    rejectedquantitybystate(): Observable<any[]> {
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<any[]>(environment['apiUrl']+"GRN/rejectedquantitybystate", { headers });
  }

  
  getGRN(payload: any): Observable<any> {
    const token = localStorage.getItem('logintoken');
    const params = new URLSearchParams();

    Object.entries(payload || {}).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        return;
      }
      // All Suppliers: never send supplierId=0 (older APIs treat 0 as a real ID and return no rows).
      if (String(key).toLowerCase() === 'supplierid' && Number(value) <= 0) {
        return;
      }
      params.append(key, String(value));
    });

    const url = `${environment.apiUrl}GRN/getGrnByDate?${params.toString()}`;

    return new Observable((observer) => {
      fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(async (response) => {
          const rawText = await response.text();
          if (!response.ok) {
            throw new Error(rawText || `Request failed: ${response.status}`);
          }

          const data = rawText ? JSON.parse(rawText) : [];
          observer.next(data);
          observer.complete();
        })
        .catch((error) => {
          observer.error(error);
        });
    });
  }

  UpdateGrn(grnId: number, payload: any): Observable<any> {
    
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  
    return this.http.post(`${environment.apiUrl}GRN/UpdateGRN/${grnId}`, this.sanitizeGrnPayload(payload), { headers });
  }

  updateChallan(challanId: number, payload: any): Observable<any> {
    
    const token = localStorage.getItem('logintoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  
    return this.http.post(`${environment.apiUrl}GRN/updateChallan/${challanId}`, payload, { headers });
  }
 }

 export interface GrnDetail {
  productId: number;
  packSize: string;
  productName: string;
  quantityAsPerParty: number;
  receivedQuantity: number;
  rejectedQuantity: number;
  passedQuantity: number;
  status: string;
  demandedbyparty: string;
  approvedbycompany: string;
    mrp: number;
  batchNumber: string;
  expiryDate?: string | null;
  remarks1?: string | null;
  remarks2?: string | null;
}

export interface Grn {
  id: number;
  grnNumber: string;
  supplierId: number;
  supplierName:string;
  createdAt: string;
  grndetails: GrnDetail[];
}
