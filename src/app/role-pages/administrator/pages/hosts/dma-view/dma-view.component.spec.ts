import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DmaViewComponent } from './dma-view.component';

describe('DmaViewComponent', () => {
    let component: DmaViewComponent;
    let fixture: ComponentFixture<DmaViewComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [DmaViewComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DmaViewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
