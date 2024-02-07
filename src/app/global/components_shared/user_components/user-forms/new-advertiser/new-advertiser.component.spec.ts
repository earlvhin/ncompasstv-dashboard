import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewAdvertiserComponent } from './new-advertiser.component';

describe('NewAdvertiserComponent', () => {
    let component: NewAdvertiserComponent;
    let fixture: ComponentFixture<NewAdvertiserComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [NewAdvertiserComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(NewAdvertiserComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
