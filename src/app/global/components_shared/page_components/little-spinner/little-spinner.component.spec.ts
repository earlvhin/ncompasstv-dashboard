import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LittleSpinnerComponent } from './little-spinner.component';

describe('LittleSpinnerComponent', () => {
    let component: LittleSpinnerComponent;
    let fixture: ComponentFixture<LittleSpinnerComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [LittleSpinnerComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(LittleSpinnerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
