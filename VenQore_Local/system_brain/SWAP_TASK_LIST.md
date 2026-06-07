# VenQore ERP — V3 Engine Swap Task List

## SUMMARY
  Total methods needing swap:     137
  Total methods swapped (done):   0
  Total methods not needed:       218
  Total pages affected:           126
  Total widgets affected:         0
  Total reports affected:         43
  CRITICAL RISKS found:           4 (direct DB writes bypassing V3)

## CRITICAL RISKS (Fix These First)
  [ ] DashboardController@home — Direct write to DB bypassing V3 services
  [ ] FundController@getCashHistory — Direct write to DB bypassing V3 services
  [ ] PosController@checkout — Direct write to DB bypassing V3 services
  [ ] ReturnController@store — Direct write to DB bypassing V3 services

## CONTROLLERS — SWAP STATUS
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: AccountingController                        │
  │ FILE: app/Http/Controllers/AccountingController.php     │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: dashboard()                                     │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: profitAndLoss()                                 │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: balanceSheet()                                  │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: apiIndex()                                      │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: ActivityLogController                       │
  │ FILE: app/Http/Controllers/ActivityLogController.php    │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: SystemResetController                       │
  │ FILE: app/Http/Controllers/Admin/SystemResetController.php │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: factoryReset()                                  │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: deleteEntity()                                  │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: AdminController                             │
  │ FILE: app/Http/Controllers/AdminController.php          │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: dashboard()                                     │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: users()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: settings()                                      │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: updateSettings()                                │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: logs()                                          │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: database()                                      │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: storeUser()                                     │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: updateUser()                                    │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: staffSummaries()                                │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: destroyUser()                                   │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: AiController                                │
  │ FILE: app/Http/Controllers/AiController.php             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: query()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: testConnection()                                │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: BankAccountController                       │
  │ FILE: app/Http/Controllers/Api/BankAccountController.php │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: __invoke()                                      │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: HeartbeatController                         │
  │ FILE: app/Http/Controllers/Api/HeartbeatController.php  │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: store()                                         │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: ManufacturingRuleController                 │
  │ FILE: app/Http/Controllers/Api/ManufacturingRuleController.php │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: store()                                         │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: update()                                        │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: destroy()                                       │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: SyncController                              │
  │ FILE: app/Http/Controllers/Api/SyncController.php       │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: users()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: products()                                      │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: customers()                                     │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: suppliers()                                     │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: inventory()                                     │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: taxes()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: batchOrders()                                   │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: checkConnection()                               │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: AttendanceController                        │
  │ FILE: app/Http/Controllers/AttendanceController.php     │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: status()                                        │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: checkIn()                                       │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: heartbeat()                                     │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: checkOut()                                      │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: logGap()                                        │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: BackupController                            │
  │ FILE: app/Http/Controllers/BackupController.php         │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: __construct()                                   │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: store()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: download()                                      │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: delete()                                        │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: restore()                                       │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: email()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: importData()                                    │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: progress()                                      │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: BankReconciliationController                │
  │ FILE: app/Http/Controllers/BankReconciliationController.php │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: import()                                        │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: BatchTrackingController                     │
  │ FILE: app/Http/Controllers/BatchTrackingController.php  │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: show()                                          │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: CharityController                           │
  │ FILE: app/Http/Controllers/CharityController.php        │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: stats()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: add()                                           │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: updateDefault()                                 │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: CommunicationController                     │
  │ FILE: app/Http/Controllers/CommunicationController.php  │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: sendEmail()                                     │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: sendWhatsApp()                                  │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: CookbookController                          │
  │ FILE: app/Http/Controllers/CookbookController.php       │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: simulate()                                      │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: create()                                        │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: store()                                         │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: edit()                                          │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: update()                                        │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: destroy()                                       │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: CustomerController                          │
  │ FILE: app/Http/Controllers/CustomerController.php       │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: search()                                        │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: store()                                         │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: update()                                        │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: destroy()                                       │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: DashboardController                         │
  │ FILE: app/Http/Controllers/DashboardController.php      │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: home()                                          │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:YES                   │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   YES                   │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: DataManagementController                    │
  │ FILE: app/Http/Controllers/DataManagementController.php │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: export()                                        │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: import()                                        │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: template()                                      │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: headings()                                      │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: headings()                                      │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: registerEvents()                                │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: headings()                                      │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: headings()                                      │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: headings()                                      │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: headings()                                      │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: DebitNoteController                         │
  │ FILE: app/Http/Controllers/DebitNoteController.php      │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: create()                                        │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: store()                                         │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: show()                                          │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: EInvoicingController                        │
  │ FILE: app/Http/Controllers/EInvoicingController.php     │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: generate()                                      │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: ExpenseController                           │
  │ FILE: app/Http/Controllers/ExpenseController.php        │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: store()                                         │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: update()                                        │
  │   Uses old AccountingService:     YES                   │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: destroy()                                       │
  │   Uses old AccountingService:     YES                   │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: quickAdd()                                      │
  │   Uses old AccountingService:     YES                   │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: storeCategory()                                 │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: FinanceController                           │
  │ FILE: app/Http/Controllers/FinanceController.php        │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: receivables()                                   │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: payables()                                      │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: bankAccounts()                                  │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: storeBankAccount()                              │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: updateBankAccount()                             │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: destroyBankAccount()                            │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: bankAccountTransactions()                       │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: FundController                              │
  │ FILE: app/Http/Controllers/FundController.php           │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: addFunds()                                      │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: removeFunds()                                   │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: transfer()                                      │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: adjust()                                        │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: getCashHistory()                                │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  YES                   │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: GrowthEngineController                      │
  │ FILE: app/Http/Controllers/GrowthEngineController.php   │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: dashboard()                                     │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: markRead()                                      │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: dismiss()                                       │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: generateWhatsApp()                              │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: settings()                                      │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: updateSettings()                                │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: customerLoyalty()                               │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: awardPoints()                                   │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: redeemPoints()                                  │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: createGiftCard()                                │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: checkGiftCard()                                 │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: useGiftCard()                                   │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: addStoreCredit()                                │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: useStoreCredit()                                │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: ImportExportController                      │
  │ FILE: app/Http/Controllers/ImportExportController.php   │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: export()                                        │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: import()                                        │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: exportParties()                                 │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: importParties()                                 │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: downloadTemplate()                              │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: collection()                                    │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: headings()                                      │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: collection()                                    │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: headings()                                      │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: ImportMappingController                     │
  │ FILE: app/Http/Controllers/ImportMappingController.php  │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: uploadForMapping()                              │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: processImport()                                 │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: InstallerController                         │
  │ FILE: app/Http/Controllers/InstallerController.php      │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: checkRequirements()                             │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: restartServer()                                 │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: checkLicense()                                  │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: testDatabase()                                  │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: install()                                       │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: InventoryController                         │
  │ FILE: app/Http/Controllers/InventoryController.php      │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: dashboard()                                     │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: store()                                         │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: update()                                        │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            YES → SWAPPED         │
  │   Uses other V3 class:            V3\FifoService        │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: destroy()                                       │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: bulkDestroy()                                   │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: checkDependencies()                             │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: stats()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: search()                                        │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: stockLevels()                                   │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: categories()                                    │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: storeCategory()                                 │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: updateCategory()                                │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: destroyCategory()                               │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: getReservations()                               │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: getHistory()                                    │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: InvoiceController                           │
  │ FILE: app/Http/Controllers/InvoiceController.php        │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: print()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: InvoiceReminderController                   │
  │ FILE: app/Http/Controllers/InvoiceReminderController.php │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: create()                                        │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: store()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: send()                                          │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: LabelController                             │
  │ FILE: app/Http/Controllers/LabelController.php          │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: print()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: MarketingCampaignController                 │
  │ FILE: app/Http/Controllers/MarketingCampaignController.php │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: create()                                        │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: store()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: MigrationController                         │
  │ FILE: app/Http/Controllers/MigrationController.php      │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: analyze()                                       │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: execute()                                       │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: NotificationController                      │
  │ FILE: app/Http/Controllers/NotificationController.php   │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: markAllRead()                                   │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: markAsRead()                                    │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: destroy()                                       │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: OnlineStoreController                       │
  │ FILE: app/Http/Controllers/OnlineStoreController.php    │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: update()                                        │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: ParkedSaleController                        │
  │ FILE: app/Http/Controllers/ParkedSaleController.php     │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: destroy()                                       │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: PartyController                             │
  │ FILE: app/Http/Controllers/PartyController.php          │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: search()                                        │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: store()                                         │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: update()                                        │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: destroy()                                       │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: ledger()                                        │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: PaymentController                           │
  │ FILE: app/Http/Controllers/PaymentController.php        │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: createIn()                                      │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: createOut()                                     │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: store()                                         │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: show()                                          │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: PosController                               │
  │ FILE: app/Http/Controllers/PosController.php            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: getCategories()                                 │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: store()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: checkout()                                      │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:YES                 │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: ProductAttributeController                  │
  │ FILE: app/Http/Controllers/ProductAttributeController.php │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: store()                                         │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: update()                                        │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: destroy()                                       │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: ProductionController                        │
  │ FILE: app/Http/Controllers/ProductionController.php     │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: create()                                        │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: store()                                         │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: show()                                          │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: complete()                                      │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: ProductVariantController                    │
  │ FILE: app/Http/Controllers/ProductVariantController.php │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: store()                                         │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: update()                                        │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: destroy()                                       │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: ProfileController                           │
  │ FILE: app/Http/Controllers/ProfileController.php        │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: edit()                                          │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: update()                                        │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: destroy()                                       │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: updatePasscode()                                │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: ProposalController                          │
  │ FILE: app/Http/Controllers/ProposalController.php       │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: create()                                        │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: edit()                                          │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: update()                                        │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: store()                                         │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: show()                                          │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: destroy()                                       │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: convertToSale()                                 │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: convertToPreSale()                              │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: print()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: PurchaseController                          │
  │ FILE: app/Http/Controllers/PurchaseController.php       │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: create()                                        │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: store()                                         │
  │   Uses old AccountingService:     YES                   │
  │   Uses old FifoService:           YES                   │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: show()                                          │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: edit()                                          │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: update()                                        │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           YES                   │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: receive()                                       │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: storeReceive()                                  │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           YES                   │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: destroy()                                       │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: PurchaseOrderController                     │
  │ FILE: app/Http/Controllers/PurchaseOrderController.php  │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: create()                                        │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: store()                                         │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: edit()                                          │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: update()                                        │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: show()                                          │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: receive()                                       │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: print()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: RecurringInvoiceController                  │
  │ FILE: app/Http/Controllers/RecurringInvoiceController.php │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: create()                                        │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: store()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: edit()                                          │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: update()                                        │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: destroy()                                       │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: toggle()                                        │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: RecycleBinController                        │
  │ FILE: app/Http/Controllers/RecycleBinController.php     │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: restore()                                       │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: forceDelete()                                   │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: ReportController                            │
  │ FILE: app/Http/Controllers/ReportController.php         │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: dashboard()                                     │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: sales()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: purchases()                                     │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: dayBook()                                       │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: profitLoss()                                    │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: accountLedger()                                 │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: partyStatement()                                │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: transactions()                                  │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: stockValuation()                                │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: lowStock()                                      │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: movementHistory()                               │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: expenses()                                      │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: tax()                                           │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: bankStatement()                                 │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: expiryReport()                                  │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: balanceSheet()                                  │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: allParties()                                    │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: trialBalance()                                  │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: itemWiseProfit()                                │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: partyWiseProfitLoss()                           │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: discountReport()                                │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: cashFlow()                                      │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: saleAging()                                     │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: saleOrders()                                    │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: billWiseProfit()                                │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: expenseByCategory()                             │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: expenseByItem()                                 │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: stockSummaryByCategory()                        │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: salePurchaseByParty()                           │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: salePurchaseByItemCategory()                    │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: itemCategoryWiseProfitLoss()                    │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: itemWiseDiscount()                              │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: saleOrderItems()                                │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: stockAging()                                    │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: salePurchaseByPartyGroup()                      │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: itemReportByParty()                             │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: partyReportByItem()                             │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: taxRateReport()                                 │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: graphAnalytics()                                │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: ReturnController                            │
  │ FILE: app/Http/Controllers/ReturnController.php         │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: create()                                        │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: show()                                          │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: store()                                         │
  │   Uses old AccountingService:     YES                   │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:YES                   │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: SaleController                              │
  │ FILE: app/Http/Controllers/SaleController.php           │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: __construct()                                   │
  │   Uses old AccountingService:     YES                   │
  │   Uses old FifoService:           YES                   │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: store()                                         │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: dashboard()                                     │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: show()                                          │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: printReceipt()                                  │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: returnSale()                                    │
  │   Uses old AccountingService:     YES                   │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: park()                                          │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: getParkedSales()                                │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: recall()                                        │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: deleteParked()                                  │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: edit()                                          │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: update()                                        │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: cancel()                                        │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: bulkDestroy()                                   │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: destroy()                                       │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: export()                                        │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: SalesAnalyticsController                    │
  │ FILE: app/Http/Controllers/SalesAnalyticsController.php │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: SalesOrderController                        │
  │ FILE: app/Http/Controllers/SalesOrderController.php     │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: create()                                        │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: store()                                         │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: show()                                          │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: update()                                        │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: convertToSale()                                 │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: cancel()                                        │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: print()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: export()                                        │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: SearchController                            │
  │ FILE: app/Http/Controllers/SearchController.php         │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: search()                                        │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: SerialTrackingController                    │
  │ FILE: app/Http/Controllers/SerialTrackingController.php │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: show()                                          │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: SettingsController                          │
  │ FILE: app/Http/Controllers/SettingsController.php       │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: update()                                        │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: storeCharge()                                   │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: updateCharge()                                  │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: deleteCharge()                                  │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: SetupController                             │
  │ FILE: app/Http/Controllers/SetupController.php          │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: store()                                         │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: StaffAttendanceController                   │
  │ FILE: app/Http/Controllers/StaffAttendanceController.php │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: show()                                          │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: approveGap()                                    │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: rejectGap()                                     │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: StockOperationsController                   │
  │ FILE: app/Http/Controllers/StockOperationsController.php │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: transfer()                                      │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: adjust()                                        │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: audit()                                         │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: storeWarehouse()                                │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: updateWarehouse()                               │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: StockTakeController                         │
  │ FILE: app/Http/Controllers/StockTakeController.php      │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: create()                                        │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: store()                                         │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: show()                                          │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: StockTransferController                     │
  │ FILE: app/Http/Controllers/StockTransferController.php  │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: create()                                        │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: store()                                         │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: show()                                          │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: SupplierController                          │
  │ FILE: app/Http/Controllers/SupplierController.php       │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: search()                                        │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: store()                                         │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: update()                                        │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: destroy()                                       │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: TransactionController                       │
  │ FILE: app/Http/Controllers/TransactionController.php    │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: UpdaterController                           │
  │ FILE: app/Http/Controllers/UpdaterController.php        │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: info()                                          │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: run()                                           │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ CONTROLLER: WooCommerceController                       │
  │ FILE: app/Http/Controllers/WooCommerceController.php    │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: __construct()                                   │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: index()                                         │
  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │
  ├─────────────────────────────────────────────────────────┤
  │ METHOD: webhook()                                       │
  │   Uses old AccountingService:     NO                    │
  │   Uses old FifoService:           NO                    │
  │   Uses V3 AccountingService:      NO                    │
  │   Uses V3 FifoService:            NO                    │
  │   Writes journal_entries direct:  NO                    │
  │   Writes inventory_batches direct:NO                    │
  │   Writes payment_allocations direct:NO                  │
  │   Updates payment_status direct:  NO                    │
  │   Updates remaining_qty direct:   NO                    │
  │   V3 SWAP STATUS: ⏳ NEEDS SWAP                            │
  └─────────────────────────────────────────────────────────┘

## REACT PAGES — SWAP STATUS
  PAGE: resources/js/Pages/Accounting/BalanceSheet.jsx
  HTTP CALLS:
    CALL  route('accounting.balance-sheet') → App\Http\Controllers\AccountingController@balanceSheet [UNKNOWN]
    CALL  route('accounting.balance-sheet') → App\Http\Controllers\AccountingController@balanceSheet [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Accounting/Dashboard.jsx
  HTTP CALLS:
    CALL  route('accounting.index') → App\Http\Controllers\AccountingController@index [UNKNOWN]
    CALL  route('accounting.index') → App\Http\Controllers\AccountingController@index [UNKNOWN]
    CALL  route('accounting.pnl') → App\Http\Controllers\AccountingController@profitAndLoss [UNKNOWN]
    CALL  route('accounting.balance-sheet') → App\Http\Controllers\AccountingController@balanceSheet [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Admin/Database.jsx
  HTTP CALLS:
    CALL  route('backups.store') → App\Http\Controllers\BackupController@store [UNKNOWN]
    CALL  route('backups.delete') → App\Http\Controllers\BackupController@delete [UNKNOWN]
    CALL  route('backups.download') → App\Http\Controllers\BackupController@download [UNKNOWN]
    CALL  route('backups.email') → App\Http\Controllers\BackupController@email [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Admin/DataManagement.jsx
  HTTP CALLS:
    CALL  route('admin.data.export') → App\Http\Controllers\DataManagementController@export [UNKNOWN]
    CALL  route('admin.data.upload-mapping') → App\Http\Controllers\ImportMappingController@uploadForMapping [UNKNOWN]
    CALL  route('admin.data.template') → App\Http\Controllers\DataManagementController@template [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Admin/DataMapping.jsx
  HTTP CALLS:
    CALL  route('admin.data.process-import') → App\Http\Controllers\ImportMappingController@processImport [UNKNOWN]
    CALL  route('admin.data') → App\Http\Controllers\DataManagementController@index [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Admin/ExecutiveDashboard.jsx
  HTTP CALLS:
    CALL  route('admin.users') → App\Http\Controllers\AdminController@users [UNKNOWN]
    CALL  route('reports.index') → App\Http\Controllers\ReportController@index [UNKNOWN]
    CALL  route('activity-log.index') → App\Http\Controllers\ActivityLogController@index [UNKNOWN]
    CALL  route('activity-log.index') → App\Http\Controllers\ActivityLogController@index [UNKNOWN]
    CALL  route('admin.settings') → App\Http\Controllers\AdminController@settings [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Admin/Migration.jsx
  HTTP CALLS:
    CALL  route('admin.migration.analyze') → App\Http\Controllers\MigrationController@analyze [UNKNOWN]
    CALL  route('admin.migration.execute') → App\Http\Controllers\MigrationController@execute [UNKNOWN]
    CALL  route('parties.index') → App\Http\Controllers\PartyController@index [UNKNOWN]
    CALL  route('products.index') → Unknown [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Admin/Settings.jsx
  HTTP CALLS:
    CALL  route('ai.test') → App\Http\Controllers\AiController@testConnection [UNKNOWN]
    CALL  route('admin.settings.update') → App\Http\Controllers\AdminController@updateSettings [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Admin/Users.jsx
  HTTP CALLS:
    CALL  route('admin.users.update') → App\Http\Controllers\AdminController@updateUser [UNKNOWN]
    CALL  route('admin.users.store') → App\Http\Controllers\AdminController@storeUser [UNKNOWN]
    CALL  route('admin.users.destroy') → App\Http\Controllers\AdminController@destroyUser [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Auth/ConfirmPassword.jsx
  HTTP CALLS:
    CALL  route('password.confirm') → Unknown [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Auth/ForgotPassword.jsx
  HTTP CALLS:
    CALL  route('password.email') → Unknown [UNKNOWN]
    CALL  route('login') → Unknown [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Auth/Login.jsx
  HTTP CALLS:
    CALL  route('login.passcode') → Unknown [UNKNOWN]
    CALL  route('login') → Unknown [UNKNOWN]
    CALL  route('password.request') → Unknown [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Auth/Register.jsx
  HTTP CALLS:
    CALL  route('login') → Unknown [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Auth/ResetPassword.jsx
  HTTP CALLS:
    CALL  route('password.store') → Unknown [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Auth/VerifyEmail.jsx
  HTTP CALLS:
    CALL  route('verification.send') → Unknown [UNKNOWN]
    CALL  route('logout') → Unknown [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/BankAccounts/BankAccountsList.jsx
  HTTP CALLS:
    CALL  route('bank-accounts.destroy') → App\Http\Controllers\FinanceController@destroyBankAccount [UNKNOWN]
    CALL  route('bank-accounts.update') → App\Http\Controllers\FinanceController@updateBankAccount [UNKNOWN]
    CALL  route('bank-accounts.store') → App\Http\Controllers\FinanceController@storeBankAccount [UNKNOWN]
    CALL  route('bank-accounts.transactions') → App\Http\Controllers\FinanceController@bankAccountTransactions [UNKNOWN]
    CALL  route('bank-accounts.transactions') → App\Http\Controllers\FinanceController@bankAccountTransactions [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/BankAccounts/Transactions.jsx
  HTTP CALLS:
    CALL  route('bank-accounts.index') → App\Http\Controllers\FinanceController@bankAccounts [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/BatchTracking/BatchTracking.jsx
  HTTP CALLS:
    CALL  route('batches.index') → App\Http\Controllers\BatchTrackingController@index [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Cookbook/Create.jsx
  HTTP CALLS:
    CALL  route('cookbook.update') → App\Http\Controllers\CookbookController@update [UNKNOWN]
    CALL  route('cookbook.store') → App\Http\Controllers\CookbookController@store [UNKNOWN]
    CALL  route('cookbook.index') → App\Http\Controllers\CookbookController@index [UNKNOWN]
    CALL  route('inventory.store') → InventoryController@store [NEEDS SWAP]
  DIRECT MANIPULATIONS: NO
  STATUS: PARTIAL

  PAGE: resources/js/Pages/Cookbook/RecipesList.jsx
  HTTP CALLS:
    CALL  route('cookbook.destroy') → App\Http\Controllers\CookbookController@destroy [UNKNOWN]
    CALL  route('cookbook.simulate') → App\Http\Controllers\CookbookController@simulate [UNKNOWN]
    CALL  route('cookbook.create') → App\Http\Controllers\CookbookController@create [UNKNOWN]
    CALL  route('cookbook.create') → App\Http\Controllers\CookbookController@create [UNKNOWN]
    CALL  route('cookbook.edit') → App\Http\Controllers\CookbookController@edit [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Dashboard.jsx
  HTTP CALLS:
    CALL  route('sales.index') → App\Http\Controllers\SaleController@index [UNKNOWN]
    CALL  route('reports.dashboard') → App\Http\Controllers\ReportController@dashboard [UNKNOWN]
    CALL  route('finance.receivables') → App\Http\Controllers\FinanceController@receivables [UNKNOWN]
    CALL  route('finance.payables') → App\Http\Controllers\FinanceController@payables [UNKNOWN]
    CALL  route('reports.profit-loss') → App\Http\Controllers\ReportController@profitLoss [UNKNOWN]
    CALL  route('purchases.create') → App\Http\Controllers\PurchaseController@create [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/DebitNotes/Create.jsx
  HTTP CALLS:
    CALL  route('debit-notes.index') → App\Http\Controllers\DebitNoteController@index [UNKNOWN]
    CALL  route('api.categories') → App\Http\Controllers\PosController@getCategories [UNKNOWN]
    CALL  route('api.warehouses') → Unknown [UNKNOWN]
    CALL  route('accounting.accounts.api') → App\Http\Controllers\AccountingController@apiIndex [UNKNOWN]
    CALL  route('api.bank-accounts') → Unknown [UNKNOWN]
    CALL  route('inventory.store') → InventoryController@store [NEEDS SWAP]
    CALL  route('inventory.update') → InventoryController@update [NEEDS SWAP]
    CALL  route('suppliers.search') → App\Http\Controllers\PartyController@search [UNKNOWN]
    CALL  route('inventory.search') → InventoryController@search [NOT NEEDED]
    CALL  route('suppliers.search') → App\Http\Controllers\PartyController@search [UNKNOWN]
    CALL  route('inventory.search') → InventoryController@search [NOT NEEDED]
    CALL  route('inventory.search') → InventoryController@search [NOT NEEDED]
    CALL  route('inventory.search') → InventoryController@search [NOT NEEDED]
    CALL  route('debit-notes.update') → Unknown [UNKNOWN]
    CALL  route('debit-notes.store') → App\Http\Controllers\DebitNoteController@store [UNKNOWN]
    CALL  route('debit-notes.print') → Unknown [UNKNOWN]
    CALL  route('debit-notes.index') → App\Http\Controllers\DebitNoteController@index [UNKNOWN]
    CALL  route('debit-notes.index') → App\Http\Controllers\DebitNoteController@index [UNKNOWN]
    CALL  route('debit-notes.index') → App\Http\Controllers\DebitNoteController@index [UNKNOWN]
    CALL  route('debit-notes.index') → App\Http\Controllers\DebitNoteController@index [UNKNOWN]
    CALL  route('sales.print') → App\Http\Controllers\SaleController@printReceipt [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: PARTIAL

  PAGE: resources/js/Pages/DebitNotes/DebitNotes.jsx
  HTTP CALLS:
    CALL  route('debit-notes.index') → App\Http\Controllers\DebitNoteController@index [UNKNOWN]
    CALL  route('debit-notes.create') → App\Http\Controllers\DebitNoteController@create [UNKNOWN]
    CALL  route('debit-notes.create') → App\Http\Controllers\DebitNoteController@create [UNKNOWN]
    CALL  route('debit-notes.show') → App\Http\Controllers\DebitNoteController@show [UNKNOWN]
    CALL  route('debit-notes.show') → App\Http\Controllers\DebitNoteController@show [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Expenses/ExpensesList.jsx
  HTTP CALLS:
    CALL  route('expenses.index') → App\Http\Controllers\ExpenseController@index [UNKNOWN]
    CALL  route('expenses.destroy') → App\Http\Controllers\ExpenseController@destroy [UNKNOWN]
    CALL  route('expenses.update') → App\Http\Controllers\ExpenseController@update [UNKNOWN]
    CALL  route('expenses.store') → App\Http\Controllers\V3\ExpenseController@store [UNKNOWN]
    POST  /expenses/category
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Finance/FinanceDashboard.jsx
  HTTP CALLS:
    CALL  route('finance.receivables') → App\Http\Controllers\FinanceController@receivables [UNKNOWN]
    CALL  route('finance.payables') → App\Http\Controllers\FinanceController@payables [UNKNOWN]
    CALL  route('accounting.index') → App\Http\Controllers\AccountingController@index [UNKNOWN]
    CALL  route('finance.receivables') → App\Http\Controllers\FinanceController@receivables [UNKNOWN]
    CALL  route('finance.payables') → App\Http\Controllers\FinanceController@payables [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Finance/Payables.jsx
  HTTP CALLS:
    CALL  route('parties.ledger') → App\Http\Controllers\PartyController@ledger [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Finance/Receivables.jsx
  HTTP CALLS:
    CALL  route('parties.ledger') → App\Http\Controllers\PartyController@ledger [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Home.jsx
  HTTP CALLS:
    CALL  route('sales.index') → App\Http\Controllers\SaleController@index [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/ImportExport/DataManager.jsx
  HTTP CALLS:
    CALL  route('import.template') → App\Http\Controllers\ImportExportController@downloadTemplate [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Installer/Index.jsx
  HTTP CALLS:
    CALL  route('setup.index') → App\Http\Controllers\SetupController@index [UNKNOWN]
    GET  /api/installer/requirements
    POST  /api/installer/run
    POST  /api/installer/check-license
    POST  /api/installer/run
    POST  /api/installer/run
    POST  /api/installer/run
    POST  /api/installer/run
    POST  /api/installer/run
    POST  /api/installer/test-db
    POST  /api/installer/run
    POST  /api/installer/run
    POST  /api/installer/run
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Inventory/Attributes/AttributesList.jsx
  HTTP CALLS:
    CALL  route('attributes.update') → App\Http\Controllers\ProductAttributeController@update [UNKNOWN]
    CALL  route('attributes.store') → App\Http\Controllers\ProductAttributeController@store [UNKNOWN]
    CALL  route('attributes.destroy') → App\Http\Controllers\ProductAttributeController@destroy [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Inventory/Categories.jsx
  HTTP CALLS:
    CALL  route('categories.index') → App\Http\Controllers\InventoryController@categories [UNKNOWN]
    CALL  route('categories.destroy') → App\Http\Controllers\InventoryController@destroyCategory [UNKNOWN]
    CALL  route('categories.update') → App\Http\Controllers\InventoryController@updateCategory [UNKNOWN]
    CALL  route('categories.store') → App\Http\Controllers\InventoryController@storeCategory [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Inventory/Dashboard.jsx
  HTTP CALLS:
    CALL  route('reports.index') → App\Http\Controllers\ReportController@index [UNKNOWN]
    CALL  route('inventory.index') → InventoryController@index [NOT NEEDED]
    CALL  route('stock-operations') → App\Http\Controllers\StockOperationsController@index [UNKNOWN]
    CALL  route('purchase-orders.create') → Unknown [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Inventory/InventoryList.jsx
  HTTP CALLS:
    CALL  route('inventory.index') → InventoryController@index [NOT NEEDED]
    CALL  route('inventory.destroy') → InventoryController@destroy [NEEDS SWAP]
    CALL  route('inventory.bulk-destroy') → InventoryController@bulkDestroy [NEEDS SWAP]
    CALL  route('import-export.index') → App\Http\Controllers\ImportExportController@index [UNKNOWN]
    CALL  route('products.variants.index') → App\Http\Controllers\ProductVariantController@index [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: PARTIAL

  PAGE: resources/js/Pages/Inventory/Production/Create.jsx
  HTTP CALLS:
    CALL  route('production.store') → App\Http\Controllers\ProductionController@store [UNKNOWN]
    CALL  route('production.index') → App\Http\Controllers\ProductionController@index [UNKNOWN]
    CALL  route('production.index') → App\Http\Controllers\ProductionController@index [UNKNOWN]
    CALL  route('production.index') → App\Http\Controllers\ProductionController@index [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Inventory/Production/ProductionRuns.jsx
  HTTP CALLS:
    CALL  route('production.index') → App\Http\Controllers\ProductionController@index [UNKNOWN]
    CALL  route('production.create') → App\Http\Controllers\ProductionController@create [UNKNOWN]
    CALL  route('production.create') → App\Http\Controllers\ProductionController@create [UNKNOWN]
    CALL  route('production.show') → App\Http\Controllers\ProductionController@show [UNKNOWN]
    CALL  route('production.edit') → Unknown [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Inventory/Variants/VariantsList.jsx
  HTTP CALLS:
    CALL  route('variants.update') → App\Http\Controllers\ProductVariantController@update [UNKNOWN]
    CALL  route('products.variants.store') → App\Http\Controllers\ProductVariantController@store [UNKNOWN]
    CALL  route('variants.destroy') → App\Http\Controllers\ProductVariantController@destroy [UNKNOWN]
    CALL  route('inventory') → Unknown [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Labels/LabelPrinter.jsx
  HTTP CALLS:
    CALL  route('labels.print') → App\Http\Controllers\LabelController@print [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Manufacturing/Rules.jsx
  HTTP CALLS:
    CALL  route('inventory.search') → InventoryController@search [NOT NEEDED]
    GET  /api/manufacturing-rules
    POST  /api/manufacturing-rules
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Notifications/NotificationCenter.jsx
  HTTP CALLS:
    CALL  route('notifications.mark-all-read') → App\Http\Controllers\NotificationController@markAllRead [UNKNOWN]
    CALL  route('notifications.mark-read') → App\Http\Controllers\NotificationController@markAsRead [UNKNOWN]
    CALL  route('notifications.destroy') → App\Http\Controllers\NotificationController@destroy [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Parties/PartiesList.jsx
  HTTP CALLS:
    CALL  route('parties.index') → App\Http\Controllers\PartyController@index [UNKNOWN]
    CALL  route('parties.index') → App\Http\Controllers\PartyController@index [UNKNOWN]
    CALL  route('parties.ledger') → App\Http\Controllers\PartyController@ledger [UNKNOWN]
    CALL  route('parties.destroy') → App\Http\Controllers\V3\PartyController@destroy [UNKNOWN]
    CALL  route('parties.update') → App\Http\Controllers\V3\PartyController@update [UNKNOWN]
    CALL  route('parties.store') → App\Http\Controllers\V3\PartyController@store [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Payments/In.jsx
  HTTP CALLS:
    CALL  route('payments.store') → App\Http\Controllers\PaymentController@store [UNKNOWN]
    CALL  route('payments.index') → App\Http\Controllers\PaymentController@index [UNKNOWN]
    CALL  route('payments.index') → App\Http\Controllers\PaymentController@index [UNKNOWN]
    CALL  route('payments.index') → App\Http\Controllers\PaymentController@index [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Payments/Out.jsx
  HTTP CALLS:
    CALL  route('payments.store') → App\Http\Controllers\PaymentController@store [UNKNOWN]
    CALL  route('payments.index') → App\Http\Controllers\PaymentController@index [UNKNOWN]
    CALL  route('payments.index') → App\Http\Controllers\PaymentController@index [UNKNOWN]
    CALL  route('payments.index') → App\Http\Controllers\PaymentController@index [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Payments/PaymentsList.jsx
  HTTP CALLS:
    CALL  route('payments.index') → App\Http\Controllers\PaymentController@index [UNKNOWN]
    CALL  route('payments.in') → App\Http\Controllers\PaymentController@createIn [UNKNOWN]
    CALL  route('payments.out') → App\Http\Controllers\PaymentController@createOut [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Pos.jsx
  HTTP CALLS:
    CALL  route('sales.index') → App\Http\Controllers\SaleController@index [UNKNOWN]
    CALL  route('inventory.search') → InventoryController@search [NOT NEEDED]
    CALL  route('inventory.search') → InventoryController@search [NOT NEEDED]
    CALL  route('sales.store') → App\Http\Controllers\V3\SaleController@store [UNKNOWN]
    CALL  route('customers.index') → Unknown [UNKNOWN]
    CALL  route('customers.index') → Unknown [UNKNOWN]
    CALL  route('sales.parked') → App\Http\Controllers\SaleController@getParkedSales [UNKNOWN]
    CALL  route('sales.park') → App\Http\Controllers\SaleController@park [UNKNOWN]
    CALL  route('sales.recall') → App\Http\Controllers\SaleController@recall [UNKNOWN]
    CALL  route('sales.parked.delete') → App\Http\Controllers\SaleController@deleteParked [UNKNOWN]
    CALL  route('api.categories') → App\Http\Controllers\PosController@getCategories [UNKNOWN]
    CALL  route('inventory.search') → InventoryController@search [NOT NEEDED]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/PreSales/BestPreSales.jsx
  HTTP CALLS:
    CALL  route('sales.presale.create') → Unknown [UNKNOWN]
    CALL  route('sales.presale.create') → Unknown [UNKNOWN]
    CALL  route('sales.presale.show') → Unknown [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Profile/Edit.jsx
  HTTP CALLS:
    CALL  route('profile.update') → ProfileController@update [NEEDS SWAP]
    CALL  route('password.update') → Unknown [UNKNOWN]
    CALL  route('profile.passcode') → ProfileController@updatePasscode [NEEDS SWAP]
    CALL  route('profile.destroy') → ProfileController@destroy [NEEDS SWAP]
    CALL  route('settings.update') → App\Http\Controllers\SettingsController@update [UNKNOWN]
    CALL  route('home') → App\Http\Controllers\DashboardController@home [UNKNOWN]
    CALL  route('verification.send') → Unknown [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: PARTIAL

  PAGE: resources/js/Pages/Proposals/Create.jsx
  HTTP CALLS:
    CALL  route('api.categories') → App\Http\Controllers\PosController@getCategories [UNKNOWN]
    CALL  route('api.warehouses') → Unknown [UNKNOWN]
    CALL  route('accounting.accounts.api') → App\Http\Controllers\AccountingController@apiIndex [UNKNOWN]
    CALL  route('api.bank-accounts') → Unknown [UNKNOWN]
    CALL  route('inventory.store') → InventoryController@store [NEEDS SWAP]
    CALL  route('inventory.update') → InventoryController@update [NEEDS SWAP]
    CALL  route('customers.search') → App\Http\Controllers\PartyController@search [UNKNOWN]
    CALL  route('inventory.search') → InventoryController@search [NOT NEEDED]
    CALL  route('inventory.search') → InventoryController@search [NOT NEEDED]
    CALL  route('inventory.search') → InventoryController@search [NOT NEEDED]
    CALL  route('proposals.update') → Unknown [UNKNOWN]
    CALL  route('proposals.store') → Unknown [UNKNOWN]
    CALL  route('proposals.print') → App\Http\Controllers\ProposalController@print [UNKNOWN]
    CALL  route('proposals.index') → Unknown [UNKNOWN]
    CALL  route('proposals.index') → Unknown [UNKNOWN]
    CALL  route('proposals.index') → Unknown [UNKNOWN]
    CALL  route('proposals.index') → Unknown [UNKNOWN]
    CALL  route('proposals.convert-to-sale') → App\Http\Controllers\ProposalController@convertToSale [UNKNOWN]
    CALL  route('proposals.convert-to-presale') → App\Http\Controllers\ProposalController@convertToPreSale [UNKNOWN]
    CALL  route('proposals.print') → App\Http\Controllers\ProposalController@print [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: PARTIAL

  PAGE: resources/js/Pages/Proposals/ProposalsList.jsx
  HTTP CALLS:
    CALL  route('proposals.show') → Unknown [UNKNOWN]
    CALL  route('proposals.index') → Unknown [UNKNOWN]
    CALL  route('proposals.convert') → App\Http\Controllers\ProposalController@convertToSale [UNKNOWN]
    CALL  route('proposals.destroy') → Unknown [UNKNOWN]
    CALL  route('proposals.create') → Unknown [UNKNOWN]
    CALL  route('proposals.create') → Unknown [UNKNOWN]
    CALL  route('proposals.print') → App\Http\Controllers\ProposalController@print [UNKNOWN]
    CALL  route('proposals.show') → Unknown [UNKNOWN]
    CALL  route('proposals.print') → App\Http\Controllers\ProposalController@print [UNKNOWN]
    CALL  route('proposals.show') → Unknown [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Proposals/Show.jsx
  HTTP CALLS:
    CALL  route('proposals.print') → App\Http\Controllers\ProposalController@print [UNKNOWN]
    CALL  route('proposals.convert-to-sale') → App\Http\Controllers\ProposalController@convertToSale [UNKNOWN]
    CALL  route('proposals.convert-to-presale') → App\Http\Controllers\ProposalController@convertToPreSale [UNKNOWN]
    CALL  route('proposals.index') → Unknown [UNKNOWN]
    CALL  route('proposals.edit') → Unknown [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/PurchaseOrders/Create.jsx
  HTTP CALLS:
    CALL  route('api.categories') → App\Http\Controllers\PosController@getCategories [UNKNOWN]
    CALL  route('api.warehouses') → Unknown [UNKNOWN]
    CALL  route('accounting.accounts.api') → App\Http\Controllers\AccountingController@apiIndex [UNKNOWN]
    CALL  route('api.bank-accounts') → Unknown [UNKNOWN]
    CALL  route('inventory.store') → InventoryController@store [NEEDS SWAP]
    CALL  route('inventory.update') → InventoryController@update [NEEDS SWAP]
    CALL  route('suppliers.search') → App\Http\Controllers\PartyController@search [UNKNOWN]
    CALL  route('inventory.search') → InventoryController@search [NOT NEEDED]
    CALL  route('suppliers.search') → App\Http\Controllers\PartyController@search [UNKNOWN]
    CALL  route('inventory.search') → InventoryController@search [NOT NEEDED]
    CALL  route('inventory.search') → InventoryController@search [NOT NEEDED]
    CALL  route('inventory.search') → InventoryController@search [NOT NEEDED]
    CALL  route('purchase-orders.update') → Unknown [UNKNOWN]
    CALL  route('purchase-orders.store') → Unknown [UNKNOWN]
    CALL  route('purchase-orders.index') → Unknown [UNKNOWN]
    CALL  route('purchase-orders.index') → Unknown [UNKNOWN]
    CALL  route('purchase-orders.index') → Unknown [UNKNOWN]
    CALL  route('purchase-orders.print') → App\Http\Controllers\PurchaseOrderController@print [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: PARTIAL

  PAGE: resources/js/Pages/PurchaseOrders/PurchaseOrdersList.jsx
  HTTP CALLS:
    CALL  route('purchase-orders.show') → Unknown [UNKNOWN]
    CALL  route('purchase-orders.index') → Unknown [UNKNOWN]
    CALL  route('purchase-orders.create') → Unknown [UNKNOWN]
    CALL  route('purchase-orders.edit') → Unknown [UNKNOWN]
    CALL  route('purchase-orders.show') → Unknown [UNKNOWN]
    CALL  route('purchase-orders.show') → Unknown [UNKNOWN]
    CALL  route('purchase-orders.receive') → App\Http\Controllers\PurchaseOrderController@receive [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/PurchaseOrders/Show.jsx
  HTTP CALLS:
    CALL  route('purchase-orders.receive') → App\Http\Controllers\PurchaseOrderController@receive [UNKNOWN]
    CALL  route('purchase-orders.index') → Unknown [UNKNOWN]
    CALL  route('purchase-orders.edit') → Unknown [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Purchases/Create.jsx
  HTTP CALLS:
    CALL  route('api.categories') → App\Http\Controllers\PosController@getCategories [UNKNOWN]
    CALL  route('api.warehouses') → Unknown [UNKNOWN]
    CALL  route('accounting.accounts.api') → App\Http\Controllers\AccountingController@apiIndex [UNKNOWN]
    CALL  route('api.bank-accounts') → Unknown [UNKNOWN]
    CALL  route('inventory.store') → InventoryController@store [NEEDS SWAP]
    CALL  route('inventory.update') → InventoryController@update [NEEDS SWAP]
    CALL  route('inventory.search') → InventoryController@search [NOT NEEDED]
    CALL  route('suppliers.search') → App\Http\Controllers\PartyController@search [UNKNOWN]
    CALL  route('suppliers.search') → App\Http\Controllers\PartyController@search [UNKNOWN]
    CALL  route('inventory.search') → InventoryController@search [NOT NEEDED]
    CALL  route('inventory.search') → InventoryController@search [NOT NEEDED]
    CALL  route('inventory.search') → InventoryController@search [NOT NEEDED]
    CALL  route('purchases.update') → App\Http\Controllers\PurchaseController@update [UNKNOWN]
    CALL  route('purchases.store') → App\Http\Controllers\PurchaseController@store [UNKNOWN]
    CALL  route('purchases.print') → Unknown [UNKNOWN]
    CALL  route('purchases.index') → App\Http\Controllers\PurchaseController@index [UNKNOWN]
    CALL  route('purchases.index') → App\Http\Controllers\PurchaseController@index [UNKNOWN]
    CALL  route('purchases.index') → App\Http\Controllers\PurchaseController@index [UNKNOWN]
    CALL  route('purchases.print') → Unknown [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: PARTIAL

  PAGE: resources/js/Pages/Purchases/PurchasesList.jsx
  HTTP CALLS:
    CALL  route('purchases.edit') → App\Http\Controllers\PurchaseController@edit [UNKNOWN]
    CALL  route('purchases.index') → App\Http\Controllers\PurchaseController@index [UNKNOWN]
    CALL  route('purchases.destroy') → App\Http\Controllers\PurchaseController@destroy [UNKNOWN]
    CALL  route('purchases.create') → App\Http\Controllers\PurchaseController@create [UNKNOWN]
    CALL  route('purchases.edit') → App\Http\Controllers\PurchaseController@edit [UNKNOWN]
    CALL  route('purchases.edit') → App\Http\Controllers\PurchaseController@edit [UNKNOWN]
  DIRECT MANIPULATIONS: YES
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Purchases/Receive.jsx
  HTTP CALLS:
    CALL  route('purchases.receive.store') → App\Http\Controllers\PurchaseController@storeReceive [UNKNOWN]
    CALL  route('purchases.show') → App\Http\Controllers\PurchaseController@show [UNKNOWN]
    CALL  route('purchases.index') → App\Http\Controllers\PurchaseController@index [UNKNOWN]
    CALL  route('purchases.index') → App\Http\Controllers\PurchaseController@index [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Purchases/Show.jsx
  HTTP CALLS:
    CALL  route('purchases.index') → App\Http\Controllers\PurchaseController@index [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/RecurringInvoices/RecurringInvoices.jsx
  HTTP CALLS:
    CALL  route('recurring-invoices.toggle') → App\Http\Controllers\RecurringInvoiceController@toggle [UNKNOWN]
    CALL  route('recurring-invoices.destroy') → App\Http\Controllers\RecurringInvoiceController@destroy [UNKNOWN]
    CALL  route('recurring-invoices.create') → App\Http\Controllers\RecurringInvoiceController@create [UNKNOWN]
    CALL  route('recurring-invoices.create') → App\Http\Controllers\RecurringInvoiceController@create [UNKNOWN]
    CALL  route('recurring-invoices.edit') → App\Http\Controllers\RecurringInvoiceController@edit [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/RecycleBin.jsx
  HTTP CALLS:
    CALL  route('recycle-bin.restore') → App\Http\Controllers\RecycleBinController@restore [UNKNOWN]
    CALL  route('recycle-bin.force-delete') → App\Http\Controllers\RecycleBinController@forceDelete [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Reminders/InvoiceReminders.jsx
  HTTP CALLS:
    CALL  route('invoice-reminders.index') → App\Http\Controllers\InvoiceReminderController@index [UNKNOWN]
    CALL  route('invoice-reminders.index') → App\Http\Controllers\InvoiceReminderController@index [UNKNOWN]
    CALL  route('invoice-reminders.send') → App\Http\Controllers\InvoiceReminderController@send [UNKNOWN]
    CALL  route('invoice-reminders.create') → App\Http\Controllers\InvoiceReminderController@create [UNKNOWN]
    CALL  route('invoice-reminders.create') → App\Http\Controllers\InvoiceReminderController@create [UNKNOWN]
    CALL  route('sales.show') → App\Http\Controllers\SaleController@show [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Reports/AccountLedger.jsx
  HTTP CALLS:
    CALL  route('reports.account-ledger') → App\Http\Controllers\ReportController@accountLedger [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Reports/BankStatement.jsx
  HTTP CALLS:
    CALL  route('reports.bank-statement') → App\Http\Controllers\ReportController@bankStatement [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Reports/BillWiseProfit.jsx
  HTTP CALLS:
    CALL  route('reports.bill-wise-profit') → App\Http\Controllers\ReportController@billWiseProfit [UNKNOWN]
    CALL  route('reports.bill-wise-profit') → App\Http\Controllers\ReportController@billWiseProfit [UNKNOWN]
    CALL  route('reports.index') → App\Http\Controllers\ReportController@index [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Reports/Components/ReportPage.jsx
  HTTP CALLS:
    CALL  route('reports.index') → App\Http\Controllers\ReportController@index [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Reports/DayBook.jsx
  HTTP CALLS:
    CALL  route('reports.day-book') → App\Http\Controllers\ReportController@dayBook [UNKNOWN]
    CALL  route('reports.day-book') → App\Http\Controllers\ReportController@dayBook [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Reports/DiscountReport.jsx
  HTTP CALLS:
    CALL  route('reports.discount-report') → Unknown [UNKNOWN]
    CALL  route('reports.discount-report') → Unknown [UNKNOWN]
    CALL  route('reports.index') → App\Http\Controllers\ReportController@index [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Reports/Expenses.jsx
  HTTP CALLS:
    CALL  route('reports.expenses') → App\Http\Controllers\ReportController@expenses [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Reports/ExpiryReport.jsx
  HTTP CALLS:
    CALL  route('reports.expiry') → App\Http\Controllers\ReportController@expiryReport [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Reports/GraphAnalytics.jsx
  HTTP CALLS:
    CALL  route('reports.analytics') → App\Http\Controllers\ReportController@graphAnalytics [UNKNOWN]
    CALL  route('reports.analytics') → App\Http\Controllers\ReportController@graphAnalytics [UNKNOWN]
    CALL  route('reports.analytics') → App\Http\Controllers\ReportController@graphAnalytics [UNKNOWN]
    CALL  route('reports.index') → App\Http\Controllers\ReportController@index [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Reports/ItemReportByParty.jsx
  HTTP CALLS:
    CALL  route('reports.item-report-by-party') → App\Http\Controllers\ReportController@itemReportByParty [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Reports/ItemWiseProfit.jsx
  HTTP CALLS:
    CALL  route('reports.item-wise-profit') → App\Http\Controllers\ReportController@itemWiseProfit [UNKNOWN]
    CALL  route('reports.item-wise-profit') → App\Http\Controllers\ReportController@itemWiseProfit [UNKNOWN]
    CALL  route('reports.index') → App\Http\Controllers\ReportController@index [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Reports/LowStock.jsx
  HTTP CALLS:
    CALL  route('reports.low-stock') → App\Http\Controllers\ReportController@lowStock [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Reports/MovementHistory.jsx
  HTTP CALLS:
    CALL  route('reports.movement-history') → App\Http\Controllers\ReportController@movementHistory [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Reports/PartyReportByItem.jsx
  HTTP CALLS:
    CALL  route('reports.party-report-by-item') → App\Http\Controllers\ReportController@partyReportByItem [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Reports/PartyStatement.jsx
  HTTP CALLS:
    CALL  route('reports.party-statement') → App\Http\Controllers\ReportController@partyStatement [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Reports/ProfitLoss.jsx
  HTTP CALLS:
    CALL  route('reports.profit-loss') → App\Http\Controllers\ReportController@profitLoss [UNKNOWN]
    CALL  route('reports.profit-loss') → App\Http\Controllers\ReportController@profitLoss [UNKNOWN]
    CALL  route('reports.index') → App\Http\Controllers\ReportController@index [UNKNOWN]
    CALL  route('reports.account-ledger') → App\Http\Controllers\ReportController@accountLedger [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Reports/Purchases.jsx
  HTTP CALLS:
    CALL  route('reports.purchases') → App\Http\Controllers\ReportController@purchases [UNKNOWN]
    CALL  route('reports.purchases') → App\Http\Controllers\ReportController@purchases [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Reports/ReportsHub.jsx
  HTTP CALLS:
    CALL  route('reports.sales') → App\Http\Controllers\ReportController@sales [UNKNOWN]
    CALL  route('reports.analytics') → App\Http\Controllers\ReportController@graphAnalytics [UNKNOWN]
    CALL  route('reports.profit-loss') → App\Http\Controllers\ReportController@profitLoss [UNKNOWN]
    CALL  route('reports.item-wise-profit') → App\Http\Controllers\ReportController@itemWiseProfit [UNKNOWN]
    CALL  route('reports.bill-wise-profit') → App\Http\Controllers\ReportController@billWiseProfit [UNKNOWN]
    CALL  route('reports.discount') → App\Http\Controllers\ReportController@discountReport [UNKNOWN]
    CALL  route('reports.sale-aging') → App\Http\Controllers\ReportController@saleAging [UNKNOWN]
    CALL  route('reports.sale-orders') → App\Http\Controllers\ReportController@saleOrders [UNKNOWN]
    CALL  route('reports.sale-order-items') → App\Http\Controllers\ReportController@saleOrderItems [UNKNOWN]
    CALL  route('reports.purchases') → App\Http\Controllers\ReportController@purchases [UNKNOWN]
    CALL  route('reports.stock-valuation') → App\Http\Controllers\ReportController@stockValuation [UNKNOWN]
    CALL  route('reports.low-stock') → App\Http\Controllers\ReportController@lowStock [UNKNOWN]
    CALL  route('reports.movement-history') → App\Http\Controllers\ReportController@movementHistory [UNKNOWN]
    CALL  route('reports.stock-aging') → App\Http\Controllers\ReportController@stockAging [UNKNOWN]
    CALL  route('reports.stock-summary-by-category') → App\Http\Controllers\ReportController@stockSummaryByCategory [UNKNOWN]
    CALL  route('reports.item-detail') → App\Http\Controllers\ReportController@itemDetailReport [UNKNOWN]
    CALL  route('reports.expiry') → App\Http\Controllers\ReportController@expiryReport [UNKNOWN]
    CALL  route('reports.balance-sheet') → App\Http\Controllers\ReportController@balanceSheet [UNKNOWN]
    CALL  route('reports.trial-balance') → App\Http\Controllers\ReportController@trialBalance [UNKNOWN]
    CALL  route('reports.cash-flow') → App\Http\Controllers\ReportController@cashFlow [UNKNOWN]
    CALL  route('reports.bank-statement') → App\Http\Controllers\ReportController@bankStatement [UNKNOWN]
    CALL  route('reports.expenses') → App\Http\Controllers\ReportController@expenses [UNKNOWN]
    CALL  route('reports.expense-by-category') → App\Http\Controllers\ReportController@expenseByCategory [UNKNOWN]
    CALL  route('reports.tax') → App\Http\Controllers\ReportController@tax [UNKNOWN]
    CALL  route('reports.tax-rate') → App\Http\Controllers\ReportController@taxRateReport [UNKNOWN]
    CALL  route('accounting.index') → App\Http\Controllers\AccountingController@index [UNKNOWN]
    CALL  route('reports.account-ledger') → App\Http\Controllers\ReportController@accountLedger [UNKNOWN]
    CALL  route('reports.day-book') → App\Http\Controllers\ReportController@dayBook [UNKNOWN]
    CALL  route('reports.transactions') → App\Http\Controllers\ReportController@transactions [UNKNOWN]
    CALL  route('reports.all-parties') → App\Http\Controllers\ReportController@allParties [UNKNOWN]
    CALL  route('reports.party-statement') → App\Http\Controllers\ReportController@partyStatement [UNKNOWN]
    CALL  route('reports.party-wise-profit-loss') → App\Http\Controllers\ReportController@partyWiseProfitLoss [UNKNOWN]
    CALL  route('reports.sale-purchase-by-party') → App\Http\Controllers\ReportController@salePurchaseByParty [UNKNOWN]
    CALL  route('reports.item-report-by-party') → App\Http\Controllers\ReportController@itemReportByParty [UNKNOWN]
    CALL  route('reports.party-report-by-item') → App\Http\Controllers\ReportController@partyReportByItem [UNKNOWN]
    CALL  route('reports.loan-statement') → App\Http\Controllers\ReportController@loanStatement [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Reports/SaleAging.jsx
  HTTP CALLS:
    CALL  route('reports.index') → App\Http\Controllers\ReportController@index [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Reports/SaleOrderItems.jsx
  HTTP CALLS:
    CALL  route('reports.sale-order-items') → App\Http\Controllers\ReportController@saleOrderItems [UNKNOWN]
    CALL  route('reports.sale-order-items') → App\Http\Controllers\ReportController@saleOrderItems [UNKNOWN]
    CALL  route('reports.index') → App\Http\Controllers\ReportController@index [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Reports/SaleOrders.jsx
  HTTP CALLS:
    CALL  route('reports.sale-orders') → App\Http\Controllers\ReportController@saleOrders [UNKNOWN]
    CALL  route('reports.sale-orders') → App\Http\Controllers\ReportController@saleOrders [UNKNOWN]
    CALL  route('reports.index') → App\Http\Controllers\ReportController@index [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Reports/Sales.jsx
  HTTP CALLS:
    CALL  route('reports.sales') → App\Http\Controllers\ReportController@sales [UNKNOWN]
    CALL  route('reports.sales') → App\Http\Controllers\ReportController@sales [UNKNOWN]
    CALL  route('reports.index') → App\Http\Controllers\ReportController@index [UNKNOWN]
    CALL  route('sales.print') → App\Http\Controllers\SaleController@printReceipt [UNKNOWN]
    CALL  route('sales.edit') → App\Http\Controllers\SaleController@edit [UNKNOWN]
  DIRECT MANIPULATIONS: YES
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Reports/StockAging.jsx
  HTTP CALLS:
    CALL  route('reports.stock-aging') → App\Http\Controllers\ReportController@stockAging [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Reports/StockValuation.jsx
  HTTP CALLS:
    CALL  route('reports.stock-valuation') → App\Http\Controllers\ReportController@stockValuation [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Reports/Tax.jsx
  HTTP CALLS:
    CALL  route('reports.tax') → App\Http\Controllers\ReportController@tax [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Reports/Transactions.jsx
  HTTP CALLS:
    CALL  route('reports.transactions') → App\Http\Controllers\ReportController@transactions [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Reports/TrialBalance.jsx
  HTTP CALLS:
    CALL  route('reports.trial-balance') → App\Http\Controllers\ReportController@trialBalance [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Returns/Create.jsx
  HTTP CALLS:
    CALL  route('api.categories') → App\Http\Controllers\PosController@getCategories [UNKNOWN]
    CALL  route('api.warehouses') → Unknown [UNKNOWN]
    CALL  route('accounting.accounts.api') → App\Http\Controllers\AccountingController@apiIndex [UNKNOWN]
    CALL  route('api.bank-accounts') → Unknown [UNKNOWN]
    CALL  route('inventory.store') → InventoryController@store [NEEDS SWAP]
    CALL  route('inventory.update') → InventoryController@update [NEEDS SWAP]
    CALL  route('customers.search') → App\Http\Controllers\PartyController@search [UNKNOWN]
    CALL  route('inventory.search') → InventoryController@search [NOT NEEDED]
    CALL  route('customers.search') → App\Http\Controllers\PartyController@search [UNKNOWN]
    CALL  route('inventory.search') → InventoryController@search [NOT NEEDED]
    CALL  route('inventory.search') → InventoryController@search [NOT NEEDED]
    CALL  route('inventory.search') → InventoryController@search [NOT NEEDED]
    CALL  route('returns.store') → App\Http\Controllers\ReturnController@store [UNKNOWN]
    CALL  route('returns-history.index') → App\Http\Controllers\ReturnController@index [UNKNOWN]
    CALL  route('sales.index') → App\Http\Controllers\SaleController@index [UNKNOWN]
    CALL  route('sales.index') → App\Http\Controllers\SaleController@index [UNKNOWN]
    CALL  route('sales.index') → App\Http\Controllers\SaleController@index [UNKNOWN]
    CALL  route('sales.print') → App\Http\Controllers\SaleController@printReceipt [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: PARTIAL

  PAGE: resources/js/Pages/Returns/ReturnsHistory.jsx
  HTTP CALLS:
    CALL  route('returns-history.index') → App\Http\Controllers\ReturnController@index [UNKNOWN]
    CALL  route('returns.create') → App\Http\Controllers\ReturnController@create [UNKNOWN]
    CALL  route('returns.create') → App\Http\Controllers\ReturnController@create [UNKNOWN]
    CALL  route('sales.show') → App\Http\Controllers\SaleController@show [UNKNOWN]
    CALL  route('sales.show') → App\Http\Controllers\SaleController@show [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Sales/CreateInvoice.jsx
  HTTP CALLS:
    CALL  route('api.categories') → App\Http\Controllers\PosController@getCategories [UNKNOWN]
    CALL  route('api.warehouses') → Unknown [UNKNOWN]
    CALL  route('accounting.accounts.api') → App\Http\Controllers\AccountingController@apiIndex [UNKNOWN]
    CALL  route('api.bank-accounts') → Unknown [UNKNOWN]
    CALL  route('inventory.store') → InventoryController@store [NEEDS SWAP]
    CALL  route('inventory.update') → InventoryController@update [NEEDS SWAP]
    CALL  route('customers.search') → App\Http\Controllers\PartyController@search [UNKNOWN]
    CALL  route('inventory.search') → InventoryController@search [NOT NEEDED]
    CALL  route('customers.search') → App\Http\Controllers\PartyController@search [UNKNOWN]
    CALL  route('inventory.search') → InventoryController@search [NOT NEEDED]
    CALL  route('inventory.search') → InventoryController@search [NOT NEEDED]
    CALL  route('inventory.search') → InventoryController@search [NOT NEEDED]
    CALL  route('sales.update') → App\Http\Controllers\SaleController@update [UNKNOWN]
    CALL  route('sales.store') → App\Http\Controllers\V3\SaleController@store [UNKNOWN]
    CALL  route('sales.index') → App\Http\Controllers\SaleController@index [UNKNOWN]
    CALL  route('sales.index') → App\Http\Controllers\SaleController@index [UNKNOWN]
    CALL  route('sales.index') → App\Http\Controllers\SaleController@index [UNKNOWN]
    CALL  route('sales.index') → App\Http\Controllers\SaleController@index [UNKNOWN]
    CALL  route('sales.print') → App\Http\Controllers\SaleController@printReceipt [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: PARTIAL

  PAGE: resources/js/Pages/Sales/CreatePreSale.jsx
  HTTP CALLS:
    CALL  route('api.categories') → App\Http\Controllers\PosController@getCategories [UNKNOWN]
    CALL  route('api.warehouses') → Unknown [UNKNOWN]
    CALL  route('accounting.accounts.api') → App\Http\Controllers\AccountingController@apiIndex [UNKNOWN]
    CALL  route('api.bank-accounts') → Unknown [UNKNOWN]
    CALL  route('inventory.store') → InventoryController@store [NEEDS SWAP]
    CALL  route('inventory.update') → InventoryController@update [NEEDS SWAP]
    CALL  route('customers.search') → App\Http\Controllers\PartyController@search [UNKNOWN]
    CALL  route('inventory.search') → InventoryController@search [NOT NEEDED]
    CALL  route('customers.search') → App\Http\Controllers\PartyController@search [UNKNOWN]
    CALL  route('inventory.search') → InventoryController@search [NOT NEEDED]
    CALL  route('inventory.search') → InventoryController@search [NOT NEEDED]
    CALL  route('inventory.search') → InventoryController@search [NOT NEEDED]
    CALL  route('presales.update') → Unknown [UNKNOWN]
    CALL  route('presales.store') → Unknown [UNKNOWN]
    CALL  route('presales.print') → Unknown [UNKNOWN]
    CALL  route('presales.index') → Unknown [UNKNOWN]
    CALL  route('pre-sales.index') → App\Http\Controllers\SalesOrderController@index [UNKNOWN]
    CALL  route('sales.index') → App\Http\Controllers\SaleController@index [UNKNOWN]
    CALL  route('sales.index') → App\Http\Controllers\SaleController@index [UNKNOWN]
    CALL  route('sales.print') → App\Http\Controllers\SaleController@printReceipt [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: PARTIAL

  PAGE: resources/js/Pages/Sales/CreatePreSale_BACKUP.jsx
  HTTP CALLS:
    CALL  route('api.categories') → App\Http\Controllers\PosController@getCategories [UNKNOWN]
    CALL  route('api.warehouses') → Unknown [UNKNOWN]
    CALL  route('accounting.accounts.api') → App\Http\Controllers\AccountingController@apiIndex [UNKNOWN]
    CALL  route('api.bank-accounts') → Unknown [UNKNOWN]
    CALL  route('inventory.store') → InventoryController@store [NEEDS SWAP]
    CALL  route('inventory.update') → InventoryController@update [NEEDS SWAP]
    CALL  route('customers.search') → App\Http\Controllers\PartyController@search [UNKNOWN]
    CALL  route('inventory.search') → InventoryController@search [NOT NEEDED]
    CALL  route('inventory.search') → InventoryController@search [NOT NEEDED]
    CALL  route('inventory.search') → InventoryController@search [NOT NEEDED]
    CALL  route('sales.update') → App\Http\Controllers\SaleController@update [UNKNOWN]
    CALL  route('sales.store') → App\Http\Controllers\V3\SaleController@store [UNKNOWN]
    CALL  route('sales.print') → App\Http\Controllers\SaleController@printReceipt [UNKNOWN]
    CALL  route('sales.index') → App\Http\Controllers\SaleController@index [UNKNOWN]
    CALL  route('sales.index') → App\Http\Controllers\SaleController@index [UNKNOWN]
    CALL  route('sales.index') → App\Http\Controllers\SaleController@index [UNKNOWN]
    CALL  route('sales.index') → App\Http\Controllers\SaleController@index [UNKNOWN]
    CALL  route('sales.print') → App\Http\Controllers\SaleController@printReceipt [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: PARTIAL

  PAGE: resources/js/Pages/Sales/Customers/CustomersList.jsx
  HTTP CALLS:
    CALL  route('customers.update') → Unknown [UNKNOWN]
    CALL  route('customers.store') → Unknown [UNKNOWN]
    CALL  route('customers.destroy') → Unknown [UNKNOWN]
    CALL  route('customers.index') → Unknown [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Sales/Dashboard.jsx
  HTTP CALLS:
    CALL  route('sales.show') → App\Http\Controllers\SaleController@show [UNKNOWN]
    CALL  route('sales.index') → App\Http\Controllers\SaleController@index [UNKNOWN]
  DIRECT MANIPULATIONS: YES
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Sales/Orders/SalesOrdersList.jsx
  HTTP CALLS:
    CALL  route('sales.orders.show') → App\Http\Controllers\SalesOrderController@show [UNKNOWN]
    CALL  route('sales.orders.create') → Unknown [UNKNOWN]
    CALL  route('sales.orders.convert') → Unknown [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Sales/ParkedSales.jsx
  HTTP CALLS:
    CALL  route('pos') → Unknown [UNKNOWN]
    CALL  route('parked-sales.destroy') → App\Http\Controllers\ParkedSaleController@destroy [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Sales/SalesHistory.jsx
  HTTP CALLS:
    CALL  route('sales.bulk-destroy') → App\Http\Controllers\SaleController@bulkDestroy [UNKNOWN]
    CALL  route('sales.edit') → App\Http\Controllers\SaleController@edit [UNKNOWN]
    CALL  route('sales.index') → App\Http\Controllers\SaleController@index [UNKNOWN]
    CALL  route('sales.export') → App\Http\Controllers\SaleController@export [UNKNOWN]
    CALL  route('reports.analytics') → App\Http\Controllers\ReportController@graphAnalytics [UNKNOWN]
    CALL  route('sales.invoice.create') → Unknown [UNKNOWN]
    CALL  route('pos') → Unknown [UNKNOWN]
    CALL  route('sales.edit') → App\Http\Controllers\SaleController@edit [UNKNOWN]
    CALL  route('sales.show') → App\Http\Controllers\SaleController@show [UNKNOWN]
    CALL  route('sales.cancel') → App\Http\Controllers\SaleController@cancel [UNKNOWN]
    CALL  route('sales.destroy') → App\Http\Controllers\SaleController@destroy [UNKNOWN]
    CALL  route('sales.print') → App\Http\Controllers\SaleController@printReceipt [UNKNOWN]
    CALL  route('sales.edit') → App\Http\Controllers\SaleController@edit [UNKNOWN]
    CALL  route('sales.show') → App\Http\Controllers\SaleController@show [UNKNOWN]
  DIRECT MANIPULATIONS: YES
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Sales/Show.jsx
  HTTP CALLS:
    CALL  route('sales.return') → App\Http\Controllers\SaleController@returnSale [UNKNOWN]
    CALL  route('sales.send-email') → App\Http\Controllers\CommunicationController@sendEmail [UNKNOWN]
    CALL  route('sales.send-whatsapp') → App\Http\Controllers\CommunicationController@sendWhatsApp [UNKNOWN]
    CALL  route('sales.index') → App\Http\Controllers\SaleController@index [UNKNOWN]
  DIRECT MANIPULATIONS: YES
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/SalesOrders/CreatePreSale.jsx
  HTTP CALLS:
    CALL  route('api.categories') → App\Http\Controllers\PosController@getCategories [UNKNOWN]
    CALL  route('api.warehouses') → Unknown [UNKNOWN]
    CALL  route('accounting.accounts.api') → App\Http\Controllers\AccountingController@apiIndex [UNKNOWN]
    CALL  route('api.bank-accounts') → Unknown [UNKNOWN]
    CALL  route('inventory.store') → InventoryController@store [NEEDS SWAP]
    CALL  route('inventory.update') → InventoryController@update [NEEDS SWAP]
    CALL  route('customers.search') → App\Http\Controllers\PartyController@search [UNKNOWN]
    CALL  route('inventory.search') → InventoryController@search [NOT NEEDED]
    CALL  route('inventory.search') → InventoryController@search [NOT NEEDED]
    CALL  route('inventory.search') → InventoryController@search [NOT NEEDED]
    CALL  route('sales.orders.update') → App\Http\Controllers\SalesOrderController@update [UNKNOWN]
    CALL  route('pre-sales.store') → App\Http\Controllers\SalesOrderController@store [UNKNOWN]
    CALL  route('sales-orders.print') → App\Http\Controllers\SalesOrderController@print [UNKNOWN]
    CALL  route('pre-sales.index') → App\Http\Controllers\SalesOrderController@index [UNKNOWN]
    CALL  route('pre-sales.index') → App\Http\Controllers\SalesOrderController@index [UNKNOWN]
    CALL  route('pre-sales.convert') → App\Http\Controllers\SalesOrderController@convertToSale [UNKNOWN]
    CALL  route('sales.index') → App\Http\Controllers\SaleController@index [UNKNOWN]
    CALL  route('pre-sales.index') → App\Http\Controllers\SalesOrderController@index [UNKNOWN]
    CALL  route('pre-sales.index') → App\Http\Controllers\SalesOrderController@index [UNKNOWN]
    CALL  route('sales.print') → App\Http\Controllers\SaleController@printReceipt [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: PARTIAL

  PAGE: resources/js/Pages/SalesOrders/PreSales.jsx
  HTTP CALLS:
    CALL  route('sales.orders.show') → App\Http\Controllers\SalesOrderController@show [UNKNOWN]
    CALL  route('pre-sales.index') → App\Http\Controllers\SalesOrderController@index [UNKNOWN]
    CALL  route('pre-sales.create') → App\Http\Controllers\SalesOrderController@create [UNKNOWN]
    CALL  route('pre-sales.create') → App\Http\Controllers\SalesOrderController@create [UNKNOWN]
    CALL  route('sales-orders.print') → App\Http\Controllers\SalesOrderController@print [UNKNOWN]
    CALL  route('sales.orders.show') → App\Http\Controllers\SalesOrderController@show [UNKNOWN]
    CALL  route('pre-sales.convert') → App\Http\Controllers\SalesOrderController@convertToSale [UNKNOWN]
    CALL  route('sales-orders.cancel') → App\Http\Controllers\V3\SalesOrderController@cancel [UNKNOWN]
    CALL  route('sales-orders.print') → App\Http\Controllers\SalesOrderController@print [UNKNOWN]
    CALL  route('sales.orders.show') → App\Http\Controllers\SalesOrderController@show [UNKNOWN]
    CALL  route('pre-sales.convert') → App\Http\Controllers\SalesOrderController@convertToSale [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/SerialTracking/SerialTracking.jsx
  HTTP CALLS:
    CALL  route('serials.index') → App\Http\Controllers\SerialTrackingController@index [UNKNOWN]
    CALL  route('serials.index') → App\Http\Controllers\SerialTrackingController@index [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Settings/SettingsPanel.jsx
  HTTP CALLS:
    CALL  route('settings.update') → App\Http\Controllers\SettingsController@update [UNKNOWN]
    CALL  route('settings.update') → App\Http\Controllers\SettingsController@update [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/SetupWizard.jsx
  HTTP CALLS:
    CALL  route('setup.store') → App\Http\Controllers\SetupController@store [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/StaffAttendance/Show.jsx
  HTTP CALLS:
    CALL  route('staff-attendance.index') → App\Http\Controllers\StaffAttendanceController@index [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/StaffAttendance/StaffAttendance.jsx
  HTTP CALLS:
    CALL  route('staff-attendance.approve-gap') → App\Http\Controllers\StaffAttendanceController@approveGap [UNKNOWN]
    CALL  route('staff-attendance.reject-gap') → App\Http\Controllers\StaffAttendanceController@rejectGap [UNKNOWN]
    CALL  route('staff-attendance.index') → App\Http\Controllers\StaffAttendanceController@index [UNKNOWN]
    CALL  route('staff-attendance.show') → App\Http\Controllers\StaffAttendanceController@show [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/StockOperations.jsx
  HTTP CALLS:
    CALL  route('stock-operations.warehouse.update') → App\Http\Controllers\StockOperationsController@updateWarehouse [UNKNOWN]
    CALL  route('stock-operations.warehouse.store') → App\Http\Controllers\StockOperationsController@storeWarehouse [UNKNOWN]
    CALL  route('stock-operations.transfer') → App\Http\Controllers\StockOperationsController@transfer [UNKNOWN]
    CALL  route('stock-operations.adjust') → App\Http\Controllers\StockOperationsController@adjust [UNKNOWN]
    CALL  route('inventory.check-dependencies') → InventoryController@checkDependencies [NEEDS SWAP]
    CALL  route('inventory.bulk-destroy') → InventoryController@bulkDestroy [NEEDS SWAP]
    CALL  route('stock-operations.audit') → App\Http\Controllers\StockOperationsController@audit [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: PARTIAL

  PAGE: resources/js/Pages/StockTake/Create.jsx
  HTTP CALLS:
    CALL  route('stock-takes.store') → App\Http\Controllers\StockTakeController@store [UNKNOWN]
    CALL  route('stock-takes.index') → App\Http\Controllers\StockTakeController@index [UNKNOWN]
    CALL  route('stock-takes.index') → App\Http\Controllers\StockTakeController@index [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/StockTake/Show.jsx
  HTTP CALLS:
    CALL  route('stock-takes.index') → App\Http\Controllers\StockTakeController@index [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/StockTake/StockTake.jsx
  HTTP CALLS:
    CALL  route('stock-takes.create') → App\Http\Controllers\StockTakeController@create [UNKNOWN]
    CALL  route('stock-takes.create') → App\Http\Controllers\StockTakeController@create [UNKNOWN]
    CALL  route('stock-takes.show') → App\Http\Controllers\StockTakeController@show [UNKNOWN]
    CALL  route('stock-takes.show') → App\Http\Controllers\StockTakeController@show [UNKNOWN]
    CALL  route('stock-takes.show') → App\Http\Controllers\StockTakeController@show [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/StockTransfers/Create.jsx
  HTTP CALLS:
    CALL  route('stock-transfers.store') → App\Http\Controllers\V3\StockTransferController@store [UNKNOWN]
    CALL  route('stock-transfers.index') → App\Http\Controllers\StockTransferController@index [UNKNOWN]
    CALL  route('stock-transfers.index') → App\Http\Controllers\StockTransferController@index [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/StockTransfers/Show.jsx
  HTTP CALLS:
    CALL  route('stock-transfers.index') → App\Http\Controllers\StockTransferController@index [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/StockTransfers/StockTransfers.jsx
  HTTP CALLS:
    CALL  route('stock-transfers.index') → App\Http\Controllers\StockTransferController@index [UNKNOWN]
    CALL  route('stock-transfers.index') → App\Http\Controllers\StockTransferController@index [UNKNOWN]
    CALL  route('stock-transfers.create') → App\Http\Controllers\StockTransferController@create [UNKNOWN]
    CALL  route('stock-transfers.create') → App\Http\Controllers\StockTransferController@create [UNKNOWN]
    CALL  route('stock-transfers.show') → App\Http\Controllers\StockTransferController@show [UNKNOWN]
    CALL  route('stock-transfers.show') → App\Http\Controllers\StockTransferController@show [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Suppliers/SuppliersList.jsx
  HTTP CALLS:
    CALL  route('suppliers.index') → Unknown [UNKNOWN]
    CALL  route('suppliers.update') → Unknown [UNKNOWN]
    CALL  route('suppliers.store') → Unknown [UNKNOWN]
    CALL  route('suppliers.destroy') → Unknown [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/Updater/Index.jsx
  HTTP CALLS:
    GET  /api/updater/info
    POST  /api/updater/run
    POST  /api/updater/run
    POST  /api/updater/run
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/V3/Products/Create.jsx
  HTTP CALLS:
    CALL  route('v3.products.store') → Unknown [UNKNOWN]
    CALL  route('v3.products.index') → Unknown [UNKNOWN]
    CALL  route('v3.products.index') → Unknown [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/V3/Products/Edit.jsx
  HTTP CALLS:
    CALL  route('v3.products.update') → Unknown [UNKNOWN]
    CALL  route('v3.products.index') → Unknown [UNKNOWN]
    CALL  route('v3.products.uom.index') → Unknown [UNKNOWN]
    CALL  route('v3.products.tiers.index') → Unknown [UNKNOWN]
    CALL  route('v3.products.index') → Unknown [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/V3/Products/Index.jsx
  HTTP CALLS:
    CALL  route('v3.products.destroy') → Unknown [UNKNOWN]
    CALL  route('v3.products.create') → Unknown [UNKNOWN]
    CALL  route('v3.products.edit') → Unknown [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/V3/Products/PriceTiers.jsx
  HTTP CALLS:
    CALL  route('v3.products.tiers.store') → Unknown [UNKNOWN]
    CALL  route('v3.products.tiers.destroy') → Unknown [UNKNOWN]
    CALL  route('v3.products.edit') → Unknown [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/V3/Products/UomConversions.jsx
  HTTP CALLS:
    CALL  route('v3.products.uom.store') → Unknown [UNKNOWN]
    CALL  route('v3.products.uom.destroy') → Unknown [UNKNOWN]
    CALL  route('v3.products.edit') → Unknown [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/V3/Purchases/Create.jsx
  HTTP CALLS:
    CALL  route('v3.purchases.store') → Unknown [UNKNOWN]
    CALL  route('v3.purchases.index') → Unknown [UNKNOWN]
    CALL  route('v3.purchases.index') → Unknown [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/V3/Purchases/Index.jsx
  HTTP CALLS:
    CALL  route('v3.purchases.create') → Unknown [UNKNOWN]
    CALL  route('v3.purchases.show') → Unknown [UNKNOWN]
  DIRECT MANIPULATIONS: YES
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/V3/Purchases/Return.jsx
  HTTP CALLS:
    CALL  route('v3.purchases.return.store') → Unknown [UNKNOWN]
    CALL  route('v3.purchases.show') → Unknown [UNKNOWN]
    CALL  route('v3.purchases.show') → Unknown [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/V3/Purchases/Show.jsx
  HTTP CALLS:
    CALL  route('v3.purchases.index') → Unknown [UNKNOWN]
    CALL  route('v3.purchases.return.create') → Unknown [UNKNOWN]
  DIRECT MANIPULATIONS: YES
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/V3/Warehouses/Create.jsx
  HTTP CALLS:
    CALL  route('v3.warehouses.store') → Unknown [UNKNOWN]
    CALL  route('v3.warehouses.index') → Unknown [UNKNOWN]
    CALL  route('v3.warehouses.index') → Unknown [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/V3/Warehouses/Edit.jsx
  HTTP CALLS:
    CALL  route('v3.warehouses.update') → Unknown [UNKNOWN]
    CALL  route('v3.warehouses.index') → Unknown [UNKNOWN]
    CALL  route('v3.warehouses.index') → Unknown [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED

  PAGE: resources/js/Pages/V3/Warehouses/Index.jsx
  HTTP CALLS:
    CALL  route('v3.warehouses.destroy') → Unknown [UNKNOWN]
    CALL  route('v3.warehouses.create') → Unknown [UNKNOWN]
    CALL  route('v3.warehouses.edit') → Unknown [UNKNOWN]
  DIRECT MANIPULATIONS: NO
  STATUS: NOT NEEDED


## DASHBOARD WIDGETS — SWAP STATUS
  None found.

## REPORTS — SWAP STATUS
  REPORT: AccountLedger
  FILE: resources/js/Pages/Reports/AccountLedger.jsx
  CALLS: Props / API
  USES V3 REPORT SERVICE: ⏳ NEEDS SWAP
  DISPLAYS: Check component for specific metrics

  REPORT: AllParties
  FILE: resources/js/Pages/Reports/AllParties.jsx
  CALLS: Props / API
  USES V3 REPORT SERVICE: ⏳ NEEDS SWAP
  DISPLAYS: Check component for specific metrics

  REPORT: BankStatement
  FILE: resources/js/Pages/Reports/BankStatement.jsx
  CALLS: Props / API
  USES V3 REPORT SERVICE: ⏳ NEEDS SWAP
  DISPLAYS: Check component for specific metrics

  REPORT: BillWiseProfit
  FILE: resources/js/Pages/Reports/BillWiseProfit.jsx
  CALLS: Props / API
  USES V3 REPORT SERVICE: ⏳ NEEDS SWAP
  DISPLAYS: Check component for specific metrics

  REPORT: CashFlow
  FILE: resources/js/Pages/Reports/CashFlow.jsx
  CALLS: Props / API
  USES V3 REPORT SERVICE: ⏳ NEEDS SWAP
  DISPLAYS: Check component for specific metrics

  REPORT: ReportPage
  FILE: resources/js/Pages/Reports/Components/ReportPage.jsx
  CALLS: Props / API
  USES V3 REPORT SERVICE: ⏳ NEEDS SWAP
  DISPLAYS: Check component for specific metrics

  REPORT: Dashboard
  FILE: resources/js/Pages/Reports/Dashboard.jsx
  CALLS: Props / API
  USES V3 REPORT SERVICE: ⏳ NEEDS SWAP
  DISPLAYS: Check component for specific metrics

  REPORT: DayBook
  FILE: resources/js/Pages/Reports/DayBook.jsx
  CALLS: Props / API
  USES V3 REPORT SERVICE: ⏳ NEEDS SWAP
  DISPLAYS: Check component for specific metrics

  REPORT: DiscountReport
  FILE: resources/js/Pages/Reports/DiscountReport.jsx
  CALLS: Props / API
  USES V3 REPORT SERVICE: ⏳ NEEDS SWAP
  DISPLAYS: Check component for specific metrics

  REPORT: ExpenseByCategory
  FILE: resources/js/Pages/Reports/ExpenseByCategory.jsx
  CALLS: Props / API
  USES V3 REPORT SERVICE: ⏳ NEEDS SWAP
  DISPLAYS: Check component for specific metrics

  REPORT: ExpenseByItem
  FILE: resources/js/Pages/Reports/ExpenseByItem.jsx
  CALLS: Props / API
  USES V3 REPORT SERVICE: ⏳ NEEDS SWAP
  DISPLAYS: Check component for specific metrics

  REPORT: Expenses
  FILE: resources/js/Pages/Reports/Expenses.jsx
  CALLS: Props / API
  USES V3 REPORT SERVICE: ⏳ NEEDS SWAP
  DISPLAYS: Check component for specific metrics

  REPORT: ExpiryReport
  FILE: resources/js/Pages/Reports/ExpiryReport.jsx
  CALLS: Props / API
  USES V3 REPORT SERVICE: ⏳ NEEDS SWAP
  DISPLAYS: Check component for specific metrics

  REPORT: GenericReport
  FILE: resources/js/Pages/Reports/GenericReport.jsx
  CALLS: Props / API
  USES V3 REPORT SERVICE: ⏳ NEEDS SWAP
  DISPLAYS: Check component for specific metrics

  REPORT: GraphAnalytics
  FILE: resources/js/Pages/Reports/GraphAnalytics.jsx
  CALLS: Props / API
  USES V3 REPORT SERVICE: ⏳ NEEDS SWAP
  DISPLAYS: Check component for specific metrics

  REPORT: ItemCategoryWiseProfitLoss
  FILE: resources/js/Pages/Reports/ItemCategoryWiseProfitLoss.jsx
  CALLS: Props / API
  USES V3 REPORT SERVICE: ⏳ NEEDS SWAP
  DISPLAYS: Check component for specific metrics

  REPORT: ItemDetail
  FILE: resources/js/Pages/Reports/ItemDetail.jsx
  CALLS: Props / API
  USES V3 REPORT SERVICE: ⏳ NEEDS SWAP
  DISPLAYS: Check component for specific metrics

  REPORT: ItemReportByParty
  FILE: resources/js/Pages/Reports/ItemReportByParty.jsx
  CALLS: Props / API
  USES V3 REPORT SERVICE: ⏳ NEEDS SWAP
  DISPLAYS: Check component for specific metrics

  REPORT: ItemWiseDiscount
  FILE: resources/js/Pages/Reports/ItemWiseDiscount.jsx
  CALLS: Props / API
  USES V3 REPORT SERVICE: ⏳ NEEDS SWAP
  DISPLAYS: Check component for specific metrics

  REPORT: ItemWiseProfit
  FILE: resources/js/Pages/Reports/ItemWiseProfit.jsx
  CALLS: Props / API
  USES V3 REPORT SERVICE: ⏳ NEEDS SWAP
  DISPLAYS: Check component for specific metrics

  REPORT: LoanStatement
  FILE: resources/js/Pages/Reports/LoanStatement.jsx
  CALLS: Props / API
  USES V3 REPORT SERVICE: ⏳ NEEDS SWAP
  DISPLAYS: Check component for specific metrics

  REPORT: LowStock
  FILE: resources/js/Pages/Reports/LowStock.jsx
  CALLS: Props / API
  USES V3 REPORT SERVICE: ⏳ NEEDS SWAP
  DISPLAYS: Check component for specific metrics

  REPORT: MovementHistory
  FILE: resources/js/Pages/Reports/MovementHistory.jsx
  CALLS: Props / API
  USES V3 REPORT SERVICE: ⏳ NEEDS SWAP
  DISPLAYS: Check component for specific metrics

  REPORT: PartyReportByItem
  FILE: resources/js/Pages/Reports/PartyReportByItem.jsx
  CALLS: Props / API
  USES V3 REPORT SERVICE: ⏳ NEEDS SWAP
  DISPLAYS: Check component for specific metrics

  REPORT: PartyStatement
  FILE: resources/js/Pages/Reports/PartyStatement.jsx
  CALLS: Props / API
  USES V3 REPORT SERVICE: ⏳ NEEDS SWAP
  DISPLAYS: Check component for specific metrics

  REPORT: PartyWiseProfitLoss
  FILE: resources/js/Pages/Reports/PartyWiseProfitLoss.jsx
  CALLS: Props / API
  USES V3 REPORT SERVICE: ⏳ NEEDS SWAP
  DISPLAYS: Check component for specific metrics

  REPORT: ProfitLoss
  FILE: resources/js/Pages/Reports/ProfitLoss.jsx
  CALLS: Props / API
  USES V3 REPORT SERVICE: ⏳ NEEDS SWAP
  DISPLAYS: Check component for specific metrics

  REPORT: Purchases
  FILE: resources/js/Pages/Reports/Purchases.jsx
  CALLS: Props / API
  USES V3 REPORT SERVICE: ⏳ NEEDS SWAP
  DISPLAYS: Check component for specific metrics

  REPORT: ReportsHub
  FILE: resources/js/Pages/Reports/ReportsHub.jsx
  CALLS: Props / API
  USES V3 REPORT SERVICE: ⏳ NEEDS SWAP
  DISPLAYS: Check component for specific metrics

  REPORT: SaleAging
  FILE: resources/js/Pages/Reports/SaleAging.jsx
  CALLS: Props / API
  USES V3 REPORT SERVICE: ⏳ NEEDS SWAP
  DISPLAYS: Check component for specific metrics

  REPORT: SaleOrderItems
  FILE: resources/js/Pages/Reports/SaleOrderItems.jsx
  CALLS: Props / API
  USES V3 REPORT SERVICE: ⏳ NEEDS SWAP
  DISPLAYS: Check component for specific metrics

  REPORT: SaleOrders
  FILE: resources/js/Pages/Reports/SaleOrders.jsx
  CALLS: Props / API
  USES V3 REPORT SERVICE: ⏳ NEEDS SWAP
  DISPLAYS: Check component for specific metrics

  REPORT: SalePurchaseByItemCategory
  FILE: resources/js/Pages/Reports/SalePurchaseByItemCategory.jsx
  CALLS: Props / API
  USES V3 REPORT SERVICE: ⏳ NEEDS SWAP
  DISPLAYS: Check component for specific metrics

  REPORT: SalePurchaseByParty
  FILE: resources/js/Pages/Reports/SalePurchaseByParty.jsx
  CALLS: Props / API
  USES V3 REPORT SERVICE: ⏳ NEEDS SWAP
  DISPLAYS: Check component for specific metrics

  REPORT: SalePurchaseByPartyGroup
  FILE: resources/js/Pages/Reports/SalePurchaseByPartyGroup.jsx
  CALLS: Props / API
  USES V3 REPORT SERVICE: ⏳ NEEDS SWAP
  DISPLAYS: Check component for specific metrics

  REPORT: Sales
  FILE: resources/js/Pages/Reports/Sales.jsx
  CALLS: Props / API
  USES V3 REPORT SERVICE: ⏳ NEEDS SWAP
  DISPLAYS: Check component for specific metrics

  REPORT: StockAging
  FILE: resources/js/Pages/Reports/StockAging.jsx
  CALLS: Props / API
  USES V3 REPORT SERVICE: ⏳ NEEDS SWAP
  DISPLAYS: Check component for specific metrics

  REPORT: StockSummaryByCategory
  FILE: resources/js/Pages/Reports/StockSummaryByCategory.jsx
  CALLS: Props / API
  USES V3 REPORT SERVICE: ⏳ NEEDS SWAP
  DISPLAYS: Check component for specific metrics

  REPORT: StockValuation
  FILE: resources/js/Pages/Reports/StockValuation.jsx
  CALLS: Props / API
  USES V3 REPORT SERVICE: ⏳ NEEDS SWAP
  DISPLAYS: Check component for specific metrics

  REPORT: Tax
  FILE: resources/js/Pages/Reports/Tax.jsx
  CALLS: Props / API
  USES V3 REPORT SERVICE: ⏳ NEEDS SWAP
  DISPLAYS: Check component for specific metrics

  REPORT: TaxRateReport
  FILE: resources/js/Pages/Reports/TaxRateReport.jsx
  CALLS: Props / API
  USES V3 REPORT SERVICE: ⏳ NEEDS SWAP
  DISPLAYS: Check component for specific metrics

  REPORT: Transactions
  FILE: resources/js/Pages/Reports/Transactions.jsx
  CALLS: Props / API
  USES V3 REPORT SERVICE: ⏳ NEEDS SWAP
  DISPLAYS: Check component for specific metrics

  REPORT: TrialBalance
  FILE: resources/js/Pages/Reports/TrialBalance.jsx
  CALLS: Props / API
  USES V3 REPORT SERVICE: ⏳ NEEDS SWAP
  DISPLAYS: Check component for specific metrics


## ORDERED TASK LIST
[ ] DashboardController@home — Fix Critical Direct DB Write
[ ] FundController@getCashHistory — Fix Critical Direct DB Write
[ ] PosController@checkout — Fix Critical Direct DB Write
[ ] ReturnController@store — Fix Critical Direct DB Write
[ ] SystemResetController@deleteEntity — Swap to V3 Services
[ ] AdminController@updateSettings — Swap to V3 Services
[ ] AdminController@storeUser — Swap to V3 Services
[ ] AdminController@updateUser — Swap to V3 Services
[ ] AdminController@destroyUser — Swap to V3 Services
[ ] HeartbeatController@store — Swap to V3 Services
[ ] ManufacturingRuleController@store — Swap to V3 Services
[ ] ManufacturingRuleController@update — Swap to V3 Services
[ ] ManufacturingRuleController@destroy — Swap to V3 Services
[ ] BackupController@delete — Swap to V3 Services
[ ] CharityController@updateDefault — Swap to V3 Services
[ ] CookbookController@store — Swap to V3 Services
[ ] CookbookController@update — Swap to V3 Services
[ ] CookbookController@destroy — Swap to V3 Services
[ ] CustomerController@store — Swap to V3 Services
[ ] CustomerController@update — Swap to V3 Services
[ ] CustomerController@destroy — Swap to V3 Services
[ ] DebitNoteController@store — Swap to V3 Services
[ ] ExpenseController@store — Swap to V3 Services
[ ] ExpenseController@update — Swap to V3 Services
[ ] ExpenseController@destroy — Swap to V3 Services
[ ] ExpenseController@storeCategory — Swap to V3 Services
[ ] FinanceController@storeBankAccount — Swap to V3 Services
[ ] FinanceController@updateBankAccount — Swap to V3 Services
[ ] FinanceController@destroyBankAccount — Swap to V3 Services
[ ] GrowthEngineController@updateSettings — Swap to V3 Services
[ ] InventoryController@store — Swap to V3 Services
[ ] InventoryController@update — Swap to V3 Services
[ ] InventoryController@destroy — Swap to V3 Services
[ ] InventoryController@bulkDestroy — Swap to V3 Services
[ ] InventoryController@storeCategory — Swap to V3 Services
[ ] InventoryController@updateCategory — Swap to V3 Services
[ ] InventoryController@destroyCategory — Swap to V3 Services
[ ] NotificationController@destroy — Swap to V3 Services
[ ] OnlineStoreController@update — Swap to V3 Services
[ ] ParkedSaleController@destroy — Swap to V3 Services
[ ] PartyController@store — Swap to V3 Services
[ ] PartyController@update — Swap to V3 Services
[ ] PartyController@destroy — Swap to V3 Services
[ ] PaymentController@store — Swap to V3 Services
[ ] ProductAttributeController@store — Swap to V3 Services
[ ] ProductAttributeController@update — Swap to V3 Services
[ ] ProductAttributeController@destroy — Swap to V3 Services
[ ] ProductionController@store — Swap to V3 Services
[ ] ProductVariantController@store — Swap to V3 Services
[ ] ProductVariantController@update — Swap to V3 Services
[ ] ProductVariantController@destroy — Swap to V3 Services
[ ] ProfileController@update — Swap to V3 Services
[ ] ProfileController@destroy — Swap to V3 Services
[ ] ProfileController@updatePasscode — Swap to V3 Services
[ ] ProposalController@update — Swap to V3 Services
[ ] ProposalController@store — Swap to V3 Services
[ ] ProposalController@destroy — Swap to V3 Services
[ ] PurchaseController@store — Swap to V3 Services
[ ] PurchaseController@update — Swap to V3 Services
[ ] PurchaseController@storeReceive — Swap to V3 Services
[ ] PurchaseController@destroy — Swap to V3 Services
[ ] PurchaseOrderController@store — Swap to V3 Services
[ ] PurchaseOrderController@update — Swap to V3 Services
[ ] RecurringInvoiceController@update — Swap to V3 Services
[ ] RecurringInvoiceController@destroy — Swap to V3 Services
[ ] RecycleBinController@restore — Swap to V3 Services
[ ] RecycleBinController@forceDelete — Swap to V3 Services
[ ] SaleController@store — Swap to V3 Services
[ ] SaleController@deleteParked — Swap to V3 Services
[ ] SaleController@update — Swap to V3 Services
[ ] SaleController@bulkDestroy — Swap to V3 Services
[ ] SaleController@destroy — Swap to V3 Services
[ ] SalesOrderController@store — Swap to V3 Services
[ ] SalesOrderController@update — Swap to V3 Services
[ ] SettingsController@update — Swap to V3 Services
[ ] SettingsController@storeCharge — Swap to V3 Services
[ ] SettingsController@updateCharge — Swap to V3 Services
[ ] SettingsController@deleteCharge — Swap to V3 Services
[ ] SetupController@store — Swap to V3 Services
[ ] StockOperationsController@storeWarehouse — Swap to V3 Services
[ ] StockOperationsController@updateWarehouse — Swap to V3 Services
[ ] StockTakeController@store — Swap to V3 Services
[ ] StockTransferController@store — Swap to V3 Services
[ ] SupplierController@store — Swap to V3 Services
[ ] SupplierController@update — Swap to V3 Services
[ ] SupplierController@destroy — Swap to V3 Services
[ ] Report AccountLedger — wire to V3 ReportService
[ ] Report AllParties — wire to V3 ReportService
[ ] Report BankStatement — wire to V3 ReportService
[ ] Report BillWiseProfit — wire to V3 ReportService
[ ] Report CashFlow — wire to V3 ReportService
[ ] Report ReportPage — wire to V3 ReportService
[ ] Report Dashboard — wire to V3 ReportService
[ ] Report DayBook — wire to V3 ReportService
[ ] Report DiscountReport — wire to V3 ReportService
[ ] Report ExpenseByCategory — wire to V3 ReportService
[ ] Report ExpenseByItem — wire to V3 ReportService
[ ] Report Expenses — wire to V3 ReportService
[ ] Report ExpiryReport — wire to V3 ReportService
[ ] Report GenericReport — wire to V3 ReportService
[ ] Report GraphAnalytics — wire to V3 ReportService
[ ] Report ItemCategoryWiseProfitLoss — wire to V3 ReportService
[ ] Report ItemDetail — wire to V3 ReportService
[ ] Report ItemReportByParty — wire to V3 ReportService
[ ] Report ItemWiseDiscount — wire to V3 ReportService
[ ] Report ItemWiseProfit — wire to V3 ReportService
[ ] Report LoanStatement — wire to V3 ReportService
[ ] Report LowStock — wire to V3 ReportService
[ ] Report MovementHistory — wire to V3 ReportService
[ ] Report PartyReportByItem — wire to V3 ReportService
[ ] Report PartyStatement — wire to V3 ReportService
[ ] Report PartyWiseProfitLoss — wire to V3 ReportService
[ ] Report ProfitLoss — wire to V3 ReportService
[ ] Report Purchases — wire to V3 ReportService
[ ] Report ReportsHub — wire to V3 ReportService
[ ] Report SaleAging — wire to V3 ReportService
[ ] Report SaleOrderItems — wire to V3 ReportService
[ ] Report SaleOrders — wire to V3 ReportService
[ ] Report SalePurchaseByItemCategory — wire to V3 ReportService
[ ] Report SalePurchaseByParty — wire to V3 ReportService
[ ] Report SalePurchaseByPartyGroup — wire to V3 ReportService
[ ] Report Sales — wire to V3 ReportService
[ ] Report StockAging — wire to V3 ReportService
[ ] Report StockSummaryByCategory — wire to V3 ReportService
[ ] Report StockValuation — wire to V3 ReportService
[ ] Report Tax — wire to V3 ReportService
[ ] Report TaxRateReport — wire to V3 ReportService
[ ] Report Transactions — wire to V3 ReportService
[ ] Report TrialBalance — wire to V3 ReportService
[ ] SystemResetController@factoryReset — Swap to V3 Services
[ ] SyncController@batchOrders — Swap to V3 Services
[ ] AttendanceController@checkIn — Swap to V3 Services
[ ] AttendanceController@heartbeat — Swap to V3 Services
[ ] AttendanceController@checkOut — Swap to V3 Services
[ ] AttendanceController@logGap — Swap to V3 Services
[ ] CharityController@add — Swap to V3 Services
[ ] CommunicationController@sendWhatsApp — Swap to V3 Services
[ ] CookbookController@create — Swap to V3 Services
[ ] DashboardController@index — Swap to V3 Services
[ ] DebitNoteController@create — Swap to V3 Services
[ ] ExpenseController@quickAdd — Swap to V3 Services
[ ] FinanceController@index — Swap to V3 Services
[ ] FundController@index — Swap to V3 Services
[ ] FundController@addFunds — Swap to V3 Services
[ ] FundController@removeFunds — Swap to V3 Services
[ ] FundController@transfer — Swap to V3 Services
[ ] FundController@adjust — Swap to V3 Services
[ ] GrowthEngineController@markRead — Swap to V3 Services
[ ] GrowthEngineController@dismiss — Swap to V3 Services
[ ] GrowthEngineController@createGiftCard — Swap to V3 Services
[ ] InstallerController@install — Swap to V3 Services
[ ] InventoryController@checkDependencies — Swap to V3 Services
[ ] InvoiceReminderController@create — Swap to V3 Services
[ ] MarketingCampaignController@create — Swap to V3 Services
[ ] MigrationController@analyze — Swap to V3 Services
[ ] MigrationController@execute — Swap to V3 Services
[ ] PaymentController@index — Swap to V3 Services
[ ] ProductionController@create — Swap to V3 Services
[ ] ProductionController@complete — Swap to V3 Services
[ ] ProposalController@create — Swap to V3 Services
[ ] ProposalController@convertToSale — Swap to V3 Services
[ ] ProposalController@convertToPreSale — Swap to V3 Services
[ ] PurchaseController@create — Swap to V3 Services
[ ] PurchaseOrderController@create — Swap to V3 Services
[ ] PurchaseOrderController@receive — Swap to V3 Services
[ ] RecurringInvoiceController@create — Swap to V3 Services
[ ] ReturnController@create — Swap to V3 Services
[ ] SaleController@__construct — Swap to V3 Services
[ ] SaleController@returnSale — Swap to V3 Services
[ ] SaleController@park — Swap to V3 Services
[ ] SaleController@edit — Swap to V3 Services
[ ] SalesOrderController@create — Swap to V3 Services
[ ] SalesOrderController@convertToSale — Swap to V3 Services
[ ] SalesOrderController@cancel — Swap to V3 Services
[ ] StaffAttendanceController@approveGap — Swap to V3 Services
[ ] StaffAttendanceController@rejectGap — Swap to V3 Services
[ ] StockOperationsController@index — Swap to V3 Services
[ ] StockOperationsController@transfer — Swap to V3 Services
[ ] StockOperationsController@adjust — Swap to V3 Services
[ ] StockOperationsController@audit — Swap to V3 Services
[ ] StockTakeController@create — Swap to V3 Services
[ ] StockTransferController@create — Swap to V3 Services
[ ] UpdaterController@run — Swap to V3 Services
[ ] WooCommerceController@webhook — Swap to V3 Services