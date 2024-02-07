import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DataQuickStatsComponent } from './data-quick-stats.component';

describe('DataQuickStatsComponent', () => {
    let component: DataQuickStatsComponent;
    let fixture: ComponentFixture<DataQuickStatsComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [DataQuickStatsComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DataQuickStatsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
