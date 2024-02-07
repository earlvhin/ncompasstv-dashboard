import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewDmaHostComponent } from './view-dma-host.component';

describe('ViewDmaHostComponent', () => {
    let component: ViewDmaHostComponent;
    let fixture: ComponentFixture<ViewDmaHostComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ViewDmaHostComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ViewDmaHostComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
