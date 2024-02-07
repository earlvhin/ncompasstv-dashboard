import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DataTotalComponent } from './data-total.component';

describe('DataTotalComponent', () => {
    let component: DataTotalComponent;
    let fixture: ComponentFixture<DataTotalComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [DataTotalComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DataTotalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
