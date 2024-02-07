import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdvertiserViewComponent } from './advertiser-view.component';

describe('AdvertiserViewComponent', () => {
    let component: AdvertiserViewComponent;
    let fixture: ComponentFixture<AdvertiserViewComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [AdvertiserViewComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AdvertiserViewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
