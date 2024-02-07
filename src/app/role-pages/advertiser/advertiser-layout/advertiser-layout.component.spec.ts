import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdvertiserLayoutComponent } from './advertiser-layout.component';

describe('AdvertiserLayoutComponent', () => {
    let component: AdvertiserLayoutComponent;
    let fixture: ComponentFixture<AdvertiserLayoutComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [AdvertiserLayoutComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AdvertiserLayoutComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
