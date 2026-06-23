import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common'; 
@Component({
  selector: 'app-stockbylocation',
  standalone: true,
  imports: [FormsModule,CommonModule],
  templateUrl: './stockbylocation.component.html',
  styleUrls: ['./stockbylocation.component.scss']
})
export class stockbylocationComponent implements OnInit {
 
  constructor() {}
  ngOnInit() {}
 
}
