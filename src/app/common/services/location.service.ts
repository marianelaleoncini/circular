import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private apiUrl = 'https://apis.datos.gob.ar/georef/api';

  constructor(private http: HttpClient) {}

  getProvinces(): Observable<{ id: number; name: string }[]> {
    return this.http.get<any>(`${this.apiUrl}/provincias`).pipe(
      map((res) =>
        res.provincias
          .map((p: any) => ({
            id: p.id,
            name: p.nombre,
          }))
          .sort((a: any, b: any) => a.name.localeCompare(b.name))
      )
    );
  }

  getCities(province: string): Observable<{ id: number; name: string }[]> {
    return this.http
      .get<any>(
        `${this.apiUrl}/localidades?provincia=${encodeURIComponent(
          province
        )}&max=1000`
      )
      .pipe(
        map((res) =>
          res.localidades
            .map((m: any) => ({
              id: m.id,
              name: m.nombre,
            }))
            .sort((a: any, b: any) => a.name.localeCompare(b.name))
        )
      );
  }
}
