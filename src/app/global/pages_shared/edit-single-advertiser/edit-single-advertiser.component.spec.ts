import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditSingleAdvertiserComponent } from './edit-single-advertiser.component';

describe('EditSingleAdvertiserComponent', () => {
    let component: EditSingleAdvertiserComponent;
    let fixture: ComponentFixture<EditSingleAdvertiserComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [EditSingleAdvertiserComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(EditSingleAdvertiserComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
