import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateAdvertiserComponent } from './create-advertiser.component';

describe('CreateAdvertiserComponent', () => {
    let component: CreateAdvertiserComponent;
    let fixture: ComponentFixture<CreateAdvertiserComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [CreateAdvertiserComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(CreateAdvertiserComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
