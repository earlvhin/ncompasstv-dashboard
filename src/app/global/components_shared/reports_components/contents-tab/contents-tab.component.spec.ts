import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentsTabComponent } from './contents-tab.component';

describe('ContentsTabComponent', () => {
    let component: ContentsTabComponent;
    let fixture: ComponentFixture<ContentsTabComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ContentsTabComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ContentsTabComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
