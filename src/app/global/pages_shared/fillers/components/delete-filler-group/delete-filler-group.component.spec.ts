import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteFillerGroupComponent } from './delete-filler-group.component';

describe('DeleteFillerGroupComponent', () => {
    let component: DeleteFillerGroupComponent;
    let fixture: ComponentFixture<DeleteFillerGroupComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [DeleteFillerGroupComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DeleteFillerGroupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
