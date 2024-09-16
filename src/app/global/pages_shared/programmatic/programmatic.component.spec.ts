import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgrammaticComponent } from './programmatic.component';

describe('ToolsComponent', () => {
    let component: ProgrammaticComponent;
    let fixture: ComponentFixture<ProgrammaticComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ProgrammaticComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ProgrammaticComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
