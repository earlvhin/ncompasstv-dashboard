import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DataCardCountComponent } from './data-card-count.component';

describe('DataCardCountComponent', () => {
    let component: DataCardCountComponent;
    let fixture: ComponentFixture<DataCardCountComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [DataCardCountComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DataCardCountComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
