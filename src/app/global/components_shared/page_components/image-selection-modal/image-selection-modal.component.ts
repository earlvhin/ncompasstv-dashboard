import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { HostService } from 'src/app/global/services';

@Component({
	selector: 'app-image-selection-modal',
	templateUrl: './image-selection-modal.component.html',
	styleUrls: ['./image-selection-modal.component.scss']
})
export class ImageSelectionModalComponent implements OnInit, OnDestroy {

	@Input() placeId: string;

	hasNoData = false;
	images: string[];
	isLoadingPhotos = true;
	selectedImageIndex: number;
	selectedImageUrl: string;

	protected _unsubscribe = new Subject<void>();
	
	constructor(
		private _host: HostService,
	) { }
	
	ngOnInit() {
		this.getHostPlaceImages();
	}

	ngOnDestroy() {
		this._unsubscribe.next();
		this._unsubscribe.complete();
	}

	onSelectImage(index: number, url: string) {

		if (index === this.selectedImageIndex) {
			this.selectedImageIndex = null;
			return;
		}

		this.selectedImageIndex = index;
		this.selectedImageUrl = url; 
	}

	returnSelectedImageData() {
		return { images: this.images, logo: this.selectedImageUrl };
	}

	private getHostPlaceImages(): void {
		this._host.get_host_place_images(this.placeId)
			.pipe(
				takeUntil(this._unsubscribe),
				map(response => response.images)
			)
			.subscribe(
				response => {

					if (!response) {
						this.hasNoData = true;
						return;
					}

					this.images = response;
				},
				error => console.log('Error get host place images ', error)
			)
			.add(() => this.isLoadingPhotos = false);
	}
	
}
