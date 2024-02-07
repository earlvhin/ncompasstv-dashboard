import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FillerDemoComponent } from './filler-demo.component';

describe('FillerDemoComponent', () => {
    let component: FillerDemoComponent;
    let fixture: ComponentFixture<FillerDemoComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [FillerDemoComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(FillerDemoComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
