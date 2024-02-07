import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DataStatisticsCardComponent } from './data-statistics-card.component';

describe('DataStatisticsCardComponent', () => {
    let component: DataStatisticsCardComponent;
    let fixture: ComponentFixture<DataStatisticsCardComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [DataStatisticsCardComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DataStatisticsCardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
