import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MediaPlaywhereComponent } from './media-playwhere.component';

describe('MediaPlaywhereComponent', () => {
    let component: MediaPlaywhereComponent;
    let fixture: ComponentFixture<MediaPlaywhereComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [MediaPlaywhereComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(MediaPlaywhereComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
