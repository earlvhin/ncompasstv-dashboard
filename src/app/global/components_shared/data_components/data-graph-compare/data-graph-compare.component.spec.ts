import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DataGraphCompareComponent } from './data-graph-compare.component';

describe('DataGraphCompareComponent', () => {
    let component: DataGraphCompareComponent;
    let fixture: ComponentFixture<DataGraphCompareComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [DataGraphCompareComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DataGraphCompareComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
