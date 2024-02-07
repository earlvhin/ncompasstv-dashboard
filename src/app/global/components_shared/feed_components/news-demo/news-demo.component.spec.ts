import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewsDemoComponent } from './news-demo.component';

describe('NewsDemoComponent', () => {
    let component: NewsDemoComponent;
    let fixture: ComponentFixture<NewsDemoComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [NewsDemoComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(NewsDemoComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
