import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ScreenCreatedModalComponent } from './screen-created-modal.component';

describe('ScreenCreatedModalComponent', () => {
    let component: ScreenCreatedModalComponent;
    let fixture: ComponentFixture<ScreenCreatedModalComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ScreenCreatedModalComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ScreenCreatedModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
