import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewZoneModalComponent } from './new-zone-modal.component';

describe('NewZoneModalComponent', () => {
    let component: NewZoneModalComponent;
    let fixture: ComponentFixture<NewZoneModalComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [NewZoneModalComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(NewZoneModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
