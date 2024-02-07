import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MediaLibraryOptionsComponent } from './media-library-options.component';

describe('MediaLibraryOptionsComponent', () => {
    let component: MediaLibraryOptionsComponent;
    let fixture: ComponentFixture<MediaLibraryOptionsComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [MediaLibraryOptionsComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(MediaLibraryOptionsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
