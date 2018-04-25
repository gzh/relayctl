import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BasicRelayComponent } from './basic-relay.component';

describe('BasicRelayComponent', () => {
  let component: BasicRelayComponent;
  let fixture: ComponentFixture<BasicRelayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BasicRelayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BasicRelayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
