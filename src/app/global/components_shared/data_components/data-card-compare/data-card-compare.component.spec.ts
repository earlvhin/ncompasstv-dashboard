import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DataCardCompareComponent } from './data-card-compare.component';

describe('DataCardCompareComponent', () => {
    let component: DataCardCompareComponent;
    let fixture: ComponentFixture<DataCardCompareComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [DataCardCompareComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DataCardCompareComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
