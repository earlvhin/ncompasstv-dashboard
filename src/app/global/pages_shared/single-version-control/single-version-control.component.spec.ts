import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SingleVersionControlComponent } from './single-version-control.component';

describe('SingleVersionControlComponent', () => {
    let component: SingleVersionControlComponent;
    let fixture: ComponentFixture<SingleVersionControlComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [SingleVersionControlComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SingleVersionControlComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
