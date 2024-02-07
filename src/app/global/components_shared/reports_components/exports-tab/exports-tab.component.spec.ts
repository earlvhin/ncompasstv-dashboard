import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportsTabComponent } from './exports-tab.component';

describe('ExportsTabComponent', () => {
    let component: ExportsTabComponent;
    let fixture: ComponentFixture<ExportsTabComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ExportsTabComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ExportsTabComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
