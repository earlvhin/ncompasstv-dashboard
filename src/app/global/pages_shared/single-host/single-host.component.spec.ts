import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SingleHostComponent } from './single-host.component';

describe('SingleHostComponent', () => {
  let component: SingleHostComponent;
  let fixture: ComponentFixture<SingleHostComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SingleHostComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SingleHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
