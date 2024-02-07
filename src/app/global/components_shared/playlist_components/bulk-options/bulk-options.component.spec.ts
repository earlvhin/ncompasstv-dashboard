import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BulkOptionsComponent } from './bulk-options.component';

describe('BulkOptionsComponent', () => {
    let component: BulkOptionsComponent;
    let fixture: ComponentFixture<BulkOptionsComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [BulkOptionsComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(BulkOptionsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
