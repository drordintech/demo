# GRN Project — DrOdin GRN Management System

A full-stack **Goods Received Note (GRN)** management and reporting system for DrOdin. It manages suppliers, products, salts, responsible persons, GRN entries (with line items and challans), and provides several reporting views.

The project has two parts:

| Part | Folder | Stack | Runs on |
|------|--------|-------|---------|
| Backend API | [APIDRODIN/](APIDRODIN/) | .NET 8.0 Web API (C#) + SQL Server | `http://localhost:5296` / `https://localhost:7075` |
| Frontend | [drodin-GRN/](drodin-GRN/) | Angular 18 (admin dashboard) | `http://localhost:4200` |

---

## Ports

| Service | Protocol | Port |
|---------|----------|------|
| Backend API (HTTP)  | HTTP  | **5296** |
| Backend API (HTTPS) | HTTPS | **7075** |
| Frontend dev server | HTTP  | **4200** |

The Angular app calls the API over HTTPS at `https://localhost:7075/api/` (configured in `drodin-GRN/src/environments/environment.ts`).

---

## Backend — APIDRODIN (.NET 8 Web API)

- **Framework:** .NET 8.0
- **Database:** SQL Server, database name `Drodin` (connection string in `appsettings.json`)
- **Auth:** JWT bearer tokens, 60-minute validity
- **CORS:** `AllowAll` policy (open for all origins — development setting)
- **Key packages:** `System.Data.SqlClient`, `System.IdentityModel.Tokens.Jwt`

### Run the backend

```bash
cd APIDRODIN/APIDRODIN/APIDRODIN
dotnet run
```

Then browse to `https://localhost:7075/swagger` (Swagger UI in development).

> Update the connection string in `appsettings.json` to point to your own SQL Server instance before running.

### API Endpoints

All routes are prefixed with `/api/{controller}` unless noted.

#### Account — `/api/account`
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/account/Authenticate` | Login, returns JWT token (valid 60 min) |

#### GRN — `/api/grn`
| Method | Route | Description |
|--------|-------|-------------|
| GET  | `/api/grn/top-rejected-products` | Top 10 rejected products |
| GET  | `/api/grn/rejectedquantitybystate` | Rejected quantity by supplier state |
| POST | `/api/grn/SaveGRN` | Create a GRN with details (transactional) |
| POST | `/api/grn/SaveChallan` | Create a return-goods challan |
| GET  | `/api/grn/getGrnByDate` | GRN filtered by supplier and date |
| POST | `/api/grn/UpdateGRN/{grnId}` | Update an existing GRN |
| POST | `/api/grn/updateChallan/{challanId}` | Update a challan |
| GET  | `/api/grn/getGrnReport` | Detailed GRN report (date range + supplier) |
| GET  | `/api/grn/GetResponsiblePersons` | List responsible persons |
| GET  | `/api/grn/generateGrnNumber` | Next GRN number (format `GRN-XXXX`) |
| GET  | `/api/grn/genratechallanNumber` | Next challan number |
| GET  | `/api/grn/getDistinctStates` | Distinct supplier states |
| GET  | `/api/grn/getGrnReportByState` | GRN report by state + date |
| GET  | `/api/grn/getGrnReportByResponsiblePerson` | GRN report by responsible person |

#### Product — `/api/product`
| Method | Route | Description |
|--------|-------|-------------|
| GET    | `/api/product/GetProduct` | List all products |
| GET    | `/api/product/{id}` | Get product by ID |
| POST   | `/api/product` | Create product |
| PUT    | `/api/product/{id}` | Update product |
| DELETE | `/api/product/{id}` | Delete product |
| GET    | `/api/product/GetBrands` | List all brands |

#### Supplier — `/api/supplier`
| Method | Route | Description |
|--------|-------|-------------|
| GET  | `/api/supplier` | List all suppliers |
| GET  | `/api/supplier/{id}` | Get supplier by ID |
| POST | `/api/supplier` | Create supplier |
| POST | `/api/supplier/UpdateSupplier` | Update supplier |
| GET  | `/api/supplier/DeleteSuppliers` | Delete supplier (query param) |
| GET  | `/api/supplier/SupplierDelete` | Delete supplier (string ID) |

#### Responsible Person — `/api/responsibleperson`
| Method | Route | Description |
|--------|-------|-------------|
| GET    | `/api/responsibleperson/GetResponsibleperson` | List all |
| GET    | `/api/responsibleperson/{id}` | Get by ID |
| POST   | `/api/responsibleperson` | Create |
| PUT    | `/api/responsibleperson/{id}` | Update |
| DELETE | `/api/responsibleperson/{id}` | Delete |

#### Salt — `/api/salt`
| Method | Route | Description |
|--------|-------|-------------|
| GET    | `/api/salt/GetSalts` | List all salts |
| POST   | `/api/salt/insertsalt` | Create salt |
| PUT    | `/api/salt/UpdateSalt/{SaltID}` | Update salt |
| DELETE | `/api/salt/{id}` | Delete salt |

#### WeatherForecast — `/weatherforecast`
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/weatherforecast` | Default template sample endpoint |

---

## Frontend — drodin-GRN (Angular 18)

- **Framework:** Angular 18.0.5, TypeScript 5.4, RxJS 7.8
- **UI:** Bootstrap 5.3, ng-bootstrap 17, ApexCharts + angular-google-charts
- **Title:** "DrOdin Admin" — admin dashboard for GRN management & reporting
- **API base URL:** `https://localhost:7075/api/` (`src/environments/environment.ts`)

### Run the frontend

```bash
cd drodin-GRN
npm install
npm start          # ng serve → http://localhost:4200
```

Build scripts:
```bash
npm run build        # development build
npm run build-prod   # production build (output in dist/)
```

### Main routes
All app routes live under `/admin`:

| Route | Page |
|-------|------|
| `/admin/login` | Login (auth) |
| `/admin/default` | Dashboard |
| `/admin/supplier` | Supplier master |
| `/admin/product` | Product catalog |
| `/admin/manufacturer` | Manufacturer management |
| `/admin/manufacturersalt` | Manufacturer–salt linking |
| `/admin/stockbylocation` | Stock by location |
| `/admin/responsibleperson` | Responsible person master |
| `/admin/user` | User management |
| `/admin/grn` | GRN entry/management |
| `/admin/grnreportsupplierwise` | GRN report — by supplier |
| `/admin/grnreportstatewise` | GRN report — by state |
| `/admin/grnreportPersonwise` | GRN report — by responsible person |

---

## Getting started (full stack)

1. **Database:** Restore/create the `Drodin` SQL Server database and update the connection string in `APIDRODIN/APIDRODIN/APIDRODIN/appsettings.json`.
2. **Backend:** `cd APIDRODIN/APIDRODIN/APIDRODIN && dotnet run` → API at `https://localhost:7075`.
3. **Frontend:** `cd drodin-GRN && npm install && npm start` → app at `http://localhost:4200`.
4. Open `http://localhost:4200`, you'll be redirected to the login page.

---

## Tech stack summary

**Backend:** .NET 8 · ASP.NET Core Web API · SQL Server · JWT auth · Swagger
**Frontend:** Angular 18 · TypeScript 5.4 · Bootstrap 5 · ng-bootstrap · ApexCharts
