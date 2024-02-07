import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BulkPlaywhereComponent } from './bulk-playwhere.component';

describe('BulkPlaywhereComponent', () => {
    let component: BulkPlaywhereComponent;
    let fixture: ComponentFixture<BulkPlaywhereComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [BulkPlaywhereComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(BulkPlaywhereComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
