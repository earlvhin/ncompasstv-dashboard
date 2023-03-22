import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { BaseService } from '../base.service';

@Injectable({
	providedIn: 'root'
})
export class FastEdgeService extends BaseService {
	get_google_business_profile(data) {
		return this.getRequest(`${environment.fastedge}${data}`, { 'x-api-key': 'kIwFkm6nVF5qYvAQfYKjB6h516yA918w5m1COWZA' }, true, false, true);
	}
}
