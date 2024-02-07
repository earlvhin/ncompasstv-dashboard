import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HostLayoutComponent } from './host-layout.component';

describe('HostLayoutComponent', () => {
    let component: HostLayoutComponent;
    let fixture: ComponentFixture<HostLayoutComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [HostLayoutComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(HostLayoutComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
