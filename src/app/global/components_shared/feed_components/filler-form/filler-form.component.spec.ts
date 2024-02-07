import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FillerFormComponent } from './filler-form.component';

describe('FillerFormComponent', () => {
    let component: FillerFormComponent;
    let fixture: ComponentFixture<FillerFormComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [FillerFormComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(FillerFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
