import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RemoteTerminalComponent } from './remote-terminal.component';

describe('RemoteTerminalComponent', () => {
  let component: RemoteTerminalComponent;
  let fixture: ComponentFixture<RemoteTerminalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RemoteTerminalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RemoteTerminalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
