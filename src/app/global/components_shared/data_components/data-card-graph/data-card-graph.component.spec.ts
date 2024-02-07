import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DataCardGraphComponent } from './data-card-graph.component';

describe('DataCardGraphComponent', () => {
    let component: DataCardGraphComponent;
    let fixture: ComponentFixture<DataCardGraphComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [DataCardGraphComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DataCardGraphComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
