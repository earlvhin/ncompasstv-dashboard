import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddFillerContentComponent } from './add-filler-content.component';

describe('AddFillerContentComponent', () => {
    let component: AddFillerContentComponent;
    let fixture: ComponentFixture<AddFillerContentComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [AddFillerContentComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AddFillerContentComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
