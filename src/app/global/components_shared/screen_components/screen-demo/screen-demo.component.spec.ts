import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ScreenDemoComponent } from './screen-demo.component';

describe('ScreenDemoComponent', () => {
    let component: ScreenDemoComponent;
    let fixture: ComponentFixture<ScreenDemoComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ScreenDemoComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ScreenDemoComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
