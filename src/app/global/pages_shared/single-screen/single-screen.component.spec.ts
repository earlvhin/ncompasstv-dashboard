import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SingleScreenComponent } from './single-screen.component';

describe('SingleScreenComponent', () => {
  let component: SingleScreenComponent;
  let fixture: ComponentFixture<SingleScreenComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SingleScreenComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SingleScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
