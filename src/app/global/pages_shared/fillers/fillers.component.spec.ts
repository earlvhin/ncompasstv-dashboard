import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FillersComponent } from './fillers.component';

describe('FillersComponent', () => {
  let component: FillersComponent;
  let fixture: ComponentFixture<FillersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FillersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FillersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
