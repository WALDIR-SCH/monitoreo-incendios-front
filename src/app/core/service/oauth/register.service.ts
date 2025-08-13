import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RegisterService {
  private apiUrl = environment.apiUser;

  constructor(private http: HttpClient) { }

  registerUser(dto: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, dto, {
      headers: {
        'enctype': 'multipart/form-data'
      }
    });
  }

}
