import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GrnreportstatewiseComponent } from './grnreportstatewise.component';

describe('GrnreportsupplierwiseComponent', () => {
  let component: GrnreportstatewiseComponent;
  let fixture: ComponentFixture<GrnreportstatewiseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GrnreportstatewiseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GrnreportstatewiseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
