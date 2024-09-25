import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SpacerSetupComponent } from './spacer-setup.component';

describe('SpacerSetupComponent', () => {
    let component: SpacerSetupComponent;
    let fixture: ComponentFixture<SpacerSetupComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [SpacerSetupComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SpacerSetupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
