import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewTechrepComponent } from './new-techrep.component';

describe('NewTechrepComponent', () => {
    let component: NewTechrepComponent;
    let fixture: ComponentFixture<NewTechrepComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [NewTechrepComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(NewTechrepComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
