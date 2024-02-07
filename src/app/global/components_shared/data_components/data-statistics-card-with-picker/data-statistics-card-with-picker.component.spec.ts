import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DataStatisticsCardWithPickerComponent } from './data-statistics-card-with-picker.component';

describe('DataStatisticsCardWithPickerComponent', () => {
    let component: DataStatisticsCardWithPickerComponent;
    let fixture: ComponentFixture<DataStatisticsCardWithPickerComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [DataStatisticsCardWithPickerComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DataStatisticsCardWithPickerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
