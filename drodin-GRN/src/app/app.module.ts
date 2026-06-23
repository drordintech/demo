import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AdminComponent } from './theme/layout/admin/admin.component';
import { NavigationItem } from './theme/layout/admin/navigation/navigation';
import { NavBarComponent } from './theme/layout/admin/nav-bar/nav-bar.component';
import { NavLeftComponent } from './theme/layout/admin/nav-bar/nav-left/nav-left.component';
import { NavRightComponent } from './theme/layout/admin/nav-bar/nav-right/nav-right.component';
import { NavigationComponent } from './theme/layout/admin/navigation/navigation.component';
import { NavLogoComponent } from './theme/layout/admin/nav-bar/nav-logo/nav-logo.component';
import { NavContentComponent } from './theme/layout/admin/navigation/nav-content/nav-content.component';
import { NavGroupComponent } from './theme/layout/admin/navigation/nav-content/nav-group/nav-group.component';
import { NavCollapseComponent } from './theme/layout/admin/navigation/nav-content/nav-collapse/nav-collapse.component';
import { NavItemComponent } from './theme/layout/admin/navigation/nav-content/nav-item/nav-item.component';
import { SharedModule } from './theme/shared/shared.module';
import { ConfigurationComponent } from './theme/layout/admin/configuration/configuration.component';
import { GuestComponent } from './theme/layout/guest/guest.component';
import { FormsModule } from '@angular/forms';
import { ManufacturerService } from './demo/elements/manufacturer/manufacturer.service'; 
import { saltService } from './demo/elements/salt/salt.service'; 
import { userService } from './demo/elements/user/user.service'; 
import { locationService } from './demo/elements/location/location.service'; 
import { stockbylocationService } from './demo/elements/stockbylocation/stockbylocation.service'; 
import { linkmanufacturesaltService } from './demo/elements/linkmanufacturesalt/linkmanufacturesalt.service'; 
import { HttpClientModule } from '@angular/common/http'; // Import HttpClientModule
import { AuthService } from '../app/demo/pages/authentication/login/auth.service';
import { CustomSwitchComponent } from '../app/custom-switch/custom-switch.component';
import { SupplierService } from './master/supplier/supplier.service';
import { productService } from './master/product/product.service';
import { grnService } from './master/grn/grn.service';
import { GoogleChartsModule } from 'angular-google-charts';

@NgModule({
  declarations: [
    AppComponent,
    AdminComponent,
    NavBarComponent,
    NavLeftComponent,
    NavRightComponent,
    NavigationComponent,
    NavLogoComponent,
    NavContentComponent,
    NavGroupComponent,
    NavItemComponent,
    NavCollapseComponent,
    ConfigurationComponent,
    GuestComponent,
    CustomSwitchComponent
  ],
  imports: [BrowserModule, AppRoutingModule, SharedModule, BrowserAnimationsModule,
    FormsModule,HttpClientModule,GoogleChartsModule],
  providers: [NavigationItem,ManufacturerService,saltService,AuthService,
    locationService,linkmanufacturesaltService,stockbylocationService,
    userService,SupplierService,productService,
    grnService],
  bootstrap: [AppComponent]
})
export class AppModule {}
