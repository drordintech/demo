import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GrnreportPersonwiseComponent } from './grnreportPersonwise.component';

describe('GrnreportsupplierwiseComponent', () => {
  let component: GrnreportPersonwiseComponent;
  let fixture: ComponentFixture<GrnreportPersonwiseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GrnreportPersonwiseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GrnreportPersonwiseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
