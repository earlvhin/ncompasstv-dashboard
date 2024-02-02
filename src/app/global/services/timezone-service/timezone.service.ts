import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { BaseService } from '../base.service';
import { TIMEZONE_MAPPING } from '../../constants/timezone-mapping';

@Injectable({
    providedIn: 'root',
})
export class TimezoneService extends BaseService {
    private readonly apiKey = environment.timezone_key;
    private timezoneMappings: { [key: string]: string } = TIMEZONE_MAPPING;

    getTimezoneByCoordinates(lat: number, lng: number): Observable<any> {
        const apiUrl = `${this.getters.api_get_timezoneByCoordinate}/get-time-zone?key=${this.apiKey}&format=json&by=position&lat=${lat}&lng=${lng}`;

        return this.getRequest(apiUrl, null, false, false, false, true).pipe(
            map((data: any) => {
                const timezoneIdentifier = data.zoneName || 'UTC';
                return this.mapToTimezone(timezoneIdentifier);
            }),
            catchError((error) => {
                console.error('Error fetching timezone:', error);
                return of('UTC'); // Default to UTC in case of error
            })
        );
    }

    private mapToTimezone(timezoneIdentifier: string): string {
        return this.timezoneMappings[timezoneIdentifier] || 'Unknown Timezone';
    }
}
