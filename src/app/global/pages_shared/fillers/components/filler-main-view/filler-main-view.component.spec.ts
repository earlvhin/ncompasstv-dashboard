import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FillerMainViewComponent } from './filler-main-view.component';

describe('FillerMainViewComponent', () => {
    let component: FillerMainViewComponent;
    let fixture: ComponentFixture<FillerMainViewComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [FillerMainViewComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(FillerMainViewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
