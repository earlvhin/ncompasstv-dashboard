import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SingleAdvertiserComponent } from './single-advertiser.component';

describe('SingleAdvertiserComponent', () => {
    let component: SingleAdvertiserComponent;
    let fixture: ComponentFixture<SingleAdvertiserComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [SingleAdvertiserComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SingleAdvertiserComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
