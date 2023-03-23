import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { BaseService } from '../base.service';
import { HttpHeaders } from '@angular/common/http';

@Injectable({
	providedIn: 'root'
})
export class FastEdgeService extends BaseService {
	get_google_business_profile(data) {
        let httpOptions = {
            headers: new HttpHeaders({ 'x-api-key': 'kIwFkm6nVF5qYvAQfYKjB6h516yA918w5m1COWZA' })
        };
		return this.getRequest(`${environment.fastedge}${data}`, httpOptions, true, true);
	}
}
