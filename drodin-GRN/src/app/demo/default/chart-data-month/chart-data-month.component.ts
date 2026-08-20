// angular import
import { Component, OnInit, ViewChild } from '@angular/core';

// project import
import { SharedModule } from '../../../theme/shared/shared.module';

// third party
import {
  NgApexchartsModule,
  ApexChart,
  ChartComponent,
  ApexDataLabels,
  ApexAxisChartSeries,
  ApexStroke,
  ApexXAxis,
  ApexYAxis,
  ApexTheme,
  ApexTooltip,
  ApexGrid,
  ApexFill
} from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  xaxis: ApexXAxis;
  colors: string[];
  stroke: ApexStroke;
  yaxis: ApexYAxis;
  tooltip: ApexTooltip;
  theme: ApexTheme;
  grid: ApexGrid;
  fill: ApexFill;
};

@Component({
  selector: 'app-chart-data-month',
  standalone: true,
  imports: [SharedModule, NgApexchartsModule],
  templateUrl: './chart-data-month.component.html',
  styleUrl: './chart-data-month.component.scss'
})
export class ChartDataMonthComponent implements OnInit {
  // public props
  @ViewChild('chart') chart!: ChartComponent;
  chartOptions!: Partial<ChartOptions>;
  amount: number = 961;
  btnActive!: string;

  // life cycle event
  ngOnInit() {
    this.btnActive = 'year';
    this.chartOptions = {
      chart: {
        type: 'area',
        height: 200,
        sparkline: {
          enabled: false
        },
        background: 'transparent',
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800,
          animateGradually: {
            enabled: true,
            delay: 150
          },
          dynamicAnimation: {
            enabled: true,
            speed: 350
          }
        }
      },
      dataLabels: {
        enabled: false
      },
      colors: ['#667eea'],
      stroke: {
        curve: 'smooth',
        width: 3
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.2,
          stops: [0, 90, 100]
        }
      },
      series: [
        {
          name: 'Performance Score',
          data: [35, 44, 9, 54, 45, 66, 41, 69, 52, 48, 61, 73]
        }
      ],
      xaxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        labels: {
          style: {
            colors: '#666',
            fontSize: '12px',
            fontFamily: 'Inter, sans-serif'
          }
        },
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        }
      },
      yaxis: {
        min: 0,
        max: 100,
        labels: {
          style: {
            colors: '#666',
            fontSize: '12px',
            fontFamily: 'Inter, sans-serif'
          }
        }
      },
      grid: {
        borderColor: '#f1f1f1',
        strokeDashArray: 5,
        xaxis: {
          lines: {
            show: true
          }
        },
        yaxis: {
          lines: {
            show: true
          }
        }
      },
      tooltip: {
        theme: 'light',
        style: {
          fontSize: '12px',
          fontFamily: 'Inter, sans-serif'
        },
        y: {
          formatter: function (val) {
            return val + "%"
          }
        }
      }
    };
  }

  // public method
  toggleActive(value: string) {
    this.btnActive = value;
    if (value === 'month') {
      this.chartOptions.series = [
        {
          name: 'Performance Score',
          data: [45, 66, 41, 89, 25, 44, 9, 54, 38, 62, 71, 83]
        }
      ];
      this.amount = 108;
    } else {
      this.chartOptions.series = [
        {
          name: 'Performance Score',
          data: [35, 44, 9, 54, 45, 66, 41, 69, 52, 48, 61, 73]
        }
      ];
      this.amount = 961;
    }
  }
}
