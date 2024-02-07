import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CloneScreenComponent } from './clone-screen.component';

describe('CloneScreenComponent', () => {
    let component: CloneScreenComponent;
    let fixture: ComponentFixture<CloneScreenComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [CloneScreenComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(CloneScreenComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
