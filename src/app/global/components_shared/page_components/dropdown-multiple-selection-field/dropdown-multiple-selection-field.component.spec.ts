import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DropdownMultipleSelectionFieldComponent } from './dropdown-multiple-selection-field.component';

describe('DropdownMultipleSelectionFieldComponent', () => {
  let component: DropdownMultipleSelectionFieldComponent;
  let fixture: ComponentFixture<DropdownMultipleSelectionFieldComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DropdownMultipleSelectionFieldComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DropdownMultipleSelectionFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
