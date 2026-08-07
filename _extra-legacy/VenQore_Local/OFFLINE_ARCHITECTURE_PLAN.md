# Offline Architecture Master Plan: "Project Eternity"
**Vision**: A POS system that feels like it "Never Sleeps." It loads instantly, runs seamlessly online or offline, and treats the Internet as an optional utility, not a requirement.

## core Philosophy: "Local First, Cloud Second"
To achieve the "opening a folder" speed, we change the fundamental data flow.
-   **Old Way**: GUI -> Request -> Server -> DB -> Response -> GUI. (Slow, dependent on network).
-   **Project Eternity Way**: GUI -> Local DB (Instant) -> Background Sync -> Server.
    *   The app **ALWAYS** reads/writes to the Local Browser Database (IndexedDB) first.
    *   This guarantees 0ms latency for the user.
    *   The "Sync Engine" works silently in the background to push/pull data to the cloud.

---

## Phase 1: The "Zero-Latency" App Shell (Service Worker)
We cache the application so effectively that reloading the page feels instant.

1.  **Architecture**:
    -   **Cache-First Strategy**: Assets (JS, CSS, Images, Fonts) are loaded from disk cache *immediately*.
    -   **Network-First (Background)**: New versions are downloaded in the background and applied on the *next* launch.
    -   **Result**: The app opens as fast as a native `.exe` or a folder.
2.  **Implementation**:
    -   Update `sw.js` to aggressively pre-cache the entire build bundle.
    -   Register SW immediately on page load.

---

## Phase 2: The "Shadow Database" (Dexie.js)
We maintain a full mirror of the necessary business data in the browser.

1.  **Local Schema (IndexedDB)**:
    -   `products`: Full catalog (ID, Name, Price, Stock, Barcodes).
    -   `customers`: Client list.
    -   `sales_queue`: Transactions waiting to be sent to the cloud.
    -   `settings`: Local config (Printer ID, Theme, etc.).
2.  **Initialization**:
    -   On first login (or daily), we download the full catalog to Dexie.
    -   Subsequent reads come *only* from Dexie (Instant Search).

---

## Phase 3: The "Silent Syncer" (Background Synchronization)
The user never waits for "Connecting..." spinners. The sync happens invisibly.

1.  **Logic**:
    -   **Online Mode**:
        -   Watch `sales_queue` table.
        -   If new Sale -> POST to Server -> Delete from Queue.
        -   Server sends back "Stock Updates" -> Update Local `products`.
    -   **Offline Mode**:
        -   Write Sale to `sales_queue`.
        -   Update Local Stock (Optimistically decremented).
        -   User continues working uninterrupted.
2.  **Conflict Resolution**:
    -   Server is the "Source of Truth" for stock levels.
    -   Local is the "Source of Truth" for new sales.

---

## Phase 4: The "Safety Net" (Backup & Restore)
Absolute protection against browser cache clearing.

1.  **"Backup to File" Feature**:
    -   Button: "Secure Offline Backup".
    -   Action: Dumps the entire Dexie DB (Products + Pending Sales) into a compressed `.amdbackup` (JSON) file.
    -   User saves this file to their Desktop/USB.
2.  **"Restore" Feature**:
    -   If the browser cache is wiped, User clicks "Restore Backup".
    -   Upload `.amdbackup` -> Populates Dexie DB -> Ready to sell in seconds.

---

## Implementation Roadmap (Immediate Actions)

1.  **Dependencies**: Install `dexie` and `react-use` (for network state).
2.  **Database Layer**: Create `resources/js/DB/LocalDB.js` to define the schema.
3.  **Sync Service**: Create `resources/js/Services/SyncEngine.js`.
4.  **UI Updates**:
    -   Add "Connection Status" (Green/Amber) in the Header.
    -   Add "Backup/Restore" in Settings.
5.  **Service Worker**: Refine `public/sw.js` for aggressive caching.
