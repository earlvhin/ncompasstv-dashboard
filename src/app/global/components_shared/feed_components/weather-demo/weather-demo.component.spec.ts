import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WeatherDemoComponent } from './weather-demo.component';

describe('WeatherDemoComponent', () => {
    let component: WeatherDemoComponent;
    let fixture: ComponentFixture<WeatherDemoComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [WeatherDemoComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(WeatherDemoComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
