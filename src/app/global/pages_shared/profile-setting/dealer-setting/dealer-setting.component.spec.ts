import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DealerSettingComponent } from './dealer-setting.component';

describe('DealerSettingComponent', () => {
    let component: DealerSettingComponent;
    let fixture: ComponentFixture<DealerSettingComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [DealerSettingComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DealerSettingComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
