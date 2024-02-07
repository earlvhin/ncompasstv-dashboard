import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewFillersGroupComponent } from './view-fillers-group.component';

describe('ViewFillersGroupComponent', () => {
    let component: ViewFillersGroupComponent;
    let fixture: ComponentFixture<ViewFillersGroupComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ViewFillersGroupComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ViewFillersGroupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
