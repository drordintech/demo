import { Injectable } from '@angular/core';

export interface NavigationItem {
  id: string;
  title: string;
  type: 'item' | 'collapse' | 'group';
  icon?: string;
  url?: string;
  classes?: string;
  external?: boolean;
  target?: boolean;
  breadcrumbs?: boolean;
  children?: Navigation[];
}

export interface Navigation extends NavigationItem {
  children?: NavigationItem[];
}
const NavigationItems = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'default',
        title: 'Dashboard',
        type: 'item',
        classes: 'nav-item',
        url: '/default',
        icon: 'ti ti-dashboard',
        breadcrumbs: false
      }
    ]
  },
  // {
  //   id: 'page',
  //   title: 'Pages',
  //   type: 'group',
  //   icon: 'icon-navigation',
  //   children: [
  //     {
  //       id: 'Authentication',
  //       title: 'Authentication',
  //       type: 'collapse',
  //       icon: 'ti ti-key',
  //       children: [
  //         {
  //           id: 'login',
  //           title: 'Login',
  //           type: 'item',
  //           url: '/guest/login',
  //           target: true,
  //           breadcrumbs: false
  //         },
  //         {
  //           id: 'register',
  //           title: 'Register',
  //           type: 'item',
  //           url: '/guest/register',
  //           target: true,
  //           breadcrumbs: false
  //         }
  //       ]
  //     }
  //   ]
  // },
  
  {
    id: 'elements',
    title: 'Transaction',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'grn',
        title: 'Setup GRN',
        type: 'item',
        classes: 'nav-item',
        url: '/grn',
        icon: 'ti ti-hexagons'
      },
    ]
  },
   {
    id: 'elements',
    title: 'Setup Master',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'supplier',
        title: 'Setup Supplier',
        type: 'item',
        classes: 'nav-item',
        url: '/supplier',
        icon: 'ti ti-building-store'
      },
      {
        id: 'product',
        title: 'Setup Product',
        type: 'item',
        classes: 'nav-item',
        url: '/product',
        icon: 'ti ti-shopping-cart'
      },
      {
        id: 'user',
        title: 'Setup User',
        type: 'item',
        classes: 'nav-item',
        url: '/user',
        icon: 'ti ti-user'
      },
      
      
      {
        id: 'responsibleperson',
        title: 'Setup Responsible Person',
        type: 'item',
        classes: 'nav-item',
        url: '/responsibleperson',
        icon: 'ti ti-brush'
      },
      // {
      //   id: 'tabler',
      //   title: 'Setup Location',
      //   type: 'item',
      //   classes: 'nav-item',
      //   url: 'https://tabler-icons.io/',
      //   icon: 'ti ti-plant-2',
      //   target: true,
      //   external: true
      // }
    ]
  },
  {
    id: 'elements',
    title: 'Reports',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'grnrptSupplierwise',
        title: 'GRN Report Supplier Wise',
        type: 'item',
        classes: 'nav-item',
        url: '/grnreportsupplierwise',
        icon: 'ti ti-report-analytics'
      },
      {
        id: 'grnreportstatewise',
        title: 'State Wise GRN Report ',
        type: 'item',
        classes: 'nav-item',
        url: '/grnreportstatewise',
        icon: 'ti ti-report-analytics'
      },
      {
        id: 'grnreportPersonwise',
        title: 'Responsible Person Wise GRN Report ',
        type: 'item',
        classes: 'nav-item',
        url: '/grnreportPersonwise',
        icon: 'ti ti-report-analytics'
      }
              ]
  },

  // ,
  // {
  //   id: 'other',
  //   title: 'Other',
  //   type: 'group',
  //   icon: 'icon-navigation',
  //   children: [
  //     {
  //       id: 'sample-page',
  //       title: 'Sample Page',
  //       type: 'item',
  //       url: '/sample-page',
  //       classes: 'nav-item',
  //       icon: 'ti ti-brand-chrome'
  //     },
  //     {
  //       id: 'document',
  //       title: 'Document',
  //       type: 'item',
  //       classes: 'nav-item',
  //       url: 'https://codedthemes.gitbook.io/berry-angular/',
  //       icon: 'ti ti-vocabulary',
  //       target: true,
  //       external: true
  //     }
  //   ]
  // }
];

@Injectable()
export class NavigationItem {
  get() {
    return NavigationItems;
  }
}
