import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmTemplateModalComponent } from './confirm-template-modal.component';

describe('ConfirmTemplateModalComponent', () => {
    let component: ConfirmTemplateModalComponent;
    let fixture: ComponentFixture<ConfirmTemplateModalComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ConfirmTemplateModalComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ConfirmTemplateModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
