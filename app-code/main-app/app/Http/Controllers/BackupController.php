<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\BackupService;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class BackupController extends Controller
{
    protected $backupService;

    public function __construct(BackupService $backupService)
    {
        $this->backupService = $backupService;
    }

    public function index()
    {
        // Get list of backups
        $files = Storage::disk('local')->files('backups');
        $backups = [];
        
        foreach ($files as $file) {
            $backups[] = [
                'name' => basename($file),
                'size' => $this->formatSize(Storage::disk('local')->size($file)),
                'date' => date('Y-m-d H:i:s', Storage::disk('local')->lastModified($file)),
                'path' => $file
            ];
        }
        
        // Sort by date desc
        usort($backups, function($a, $b) {
            return strtotime($b['date']) - strtotime($a['date']);
        });

        if (request()->wantsJson()) {
            return response()->json($backups);
        }

        return \Inertia\Inertia::render('Admin/Backups', [
            'backups' => $backups,
            'mode' => 'admin'
        ]);
    }

    /**
     * A database snapshot holds EVERY store on this server, so only the
     * platform owner/admin may make one. Inside a store this used to throw a
     * "SECURITY VIOLATION" that the page reported as success, and nothing
     * ever appeared in Snapshot History. A store owner backs up their own
     * store with Full System Backup (.vq).
     */
    public function store(Request $request)
    {
        $user = $request->user();
        if (! $user || ! $user->isPlatformAdmin()) {
            $msg = 'Database snapshots include every store on the server, so only the platform owner can make them. '
                 . 'To back up this store, use Full System Backup (.vq).';
            return $request->wantsJson()
                ? response()->json(['success' => false, 'message' => $msg], 403)
                : back()->with('error', $msg);
        }

        // The snapshot is of the whole server, not of the store being viewed.
        $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;
        app()->forgetInstance('current.tenant');
        try {
            $result = $this->backupService->createBackup();
        } catch (\Throwable $e) {
            $result = ['success' => false, 'message' => $e->getMessage()];
        } finally {
            if ($tenant) {
                app()->instance('current.tenant', $tenant);
            }
        }

        if ($result['success']) {
            Log::info('Database snapshot created', ['file' => $result['filename'], 'size' => $result['size'], 'by' => $user->id]);
            return $request->wantsJson()
                ? response()->json(['success' => true, 'message' => 'Snapshot created.', 'filename' => $result['filename']])
                : back()->with('success', 'Snapshot created: ' . $result['filename']);
        }

        return $request->wantsJson()
            ? response()->json(['success' => false, 'message' => 'Snapshot failed: ' . $result['message']], 500)
            : back()->with('error', 'Snapshot failed: ' . $result['message']);
    }

    public function download($store_slug = null, $filename = null)
    {
        $filename = $filename ?? $store_slug;
        abort_unless(auth()->user()?->isPlatformAdmin(), 403);
        $filename = basename((string) $filename); // never a path outside backups/
        $path = 'backups/' . $filename;
        if (Storage::disk('local')->exists($path)) {
            return Storage::disk('local')->download($path);
        }
        return back()->withErrors(['error' => 'File not found']);
    }

    public function delete($filename)
    {
        $path = 'backups/' . $filename;
        if (Storage::disk('local')->exists($path)) {
            Storage::disk('local')->delete($path);
            return back()->with('success', 'Backup deleted');
        }
        return back()->withErrors(['error' => 'File not found']);
    }



    public function restore(Request $request)
    {
        $request->validate([
            'backup_file' => 'required|file',
        ]);

        $file = $request->file('backup_file');
        $path = $file->getRealPath();

        if ($file->getClientOriginalExtension() !== 'sql') {
             return response()->json(['message' => 'Invalid file type. Please upload a .sql file.'], 422);
        }

        $result = $this->backupService->restoreBackup($path);

        if ($result['success']) {
             return response()->json(['message' => 'Database restored successfully.']);
        }

        return response()->json(['message' => 'Restore failed: ' . $result['message']], 500);
    }
    
    public function email(Request $request, $filename)
    {
        $path = 'backups/' . $filename;
        
        if (!Storage::disk('local')->exists($path)) {
            return back()->withErrors(['error' => 'File not found']);
        }

        $email = $request->email ?? auth()->user()->email;
        if (!$email) {
            return back()->withErrors(['error' => 'No email address provided']);
        }

        try {
            $fullPath = Storage::disk('local')->path($path);
            
            // Basic Mail Send
            Mail::raw("Please find attached the database backup for VenQore POS.", function ($message) use ($email, $fullPath, $filename) {
                $message->to($email)
                    ->subject("VenQore POS Backup - " . date('Y-m-d'))
                    ->attach($fullPath);
            });

            return back()->with('success', "Backup sent to $email");
        } catch (\Exception $e) {
            Log::error("Email backup failed: " . $e->getMessage());
            return back()->with('error', 'Failed to send email. Check mail configuration. Error: ' . $e->getMessage());
        }
    }

    protected function formatSize($bytes)
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $power = $bytes > 0 ? floor(log($bytes, 1024)) : 0;
        return number_format($bytes / pow(1024, $power), 2, '.', ',') . ' ' . $units[$power];
    }
    public function importData(Request $request)
    {
        // Prevent timeout for large imports
        set_time_limit(0);
        ini_set('max_execution_time', 0);
        ini_set('memory_limit', '-1');

        $request->validate([
            'import_file' => 'required|file|max:102400', // Max 100MB
        ]);

        try {
            $file = $request->file('import_file');
            $ext = strtolower($file->getClientOriginalExtension());

            // Validate extension manually since .vyb/.vyp are custom formats
            $allowedExtensions = ['xlsx', 'xls', 'csv', 'vyb', 'vyp'];
            if (!in_array($ext, $allowedExtensions)) {
                return response()->json([
                    'message' => 'Unsupported file type. Accepted: .xlsx, .xls, .csv, .vyb, .vyp'
                ], 422);
            }

            $path = $file->getRealPath();
            
            // IMPORTANT: Pass original extension because PHP temp files lose it
            $result = (new \App\Services\DataImportService())->importVyaparOrExcel($path, $ext);

            if ($result['success']) {
                 return response()->json(['message' => $result['message']]);
            }

            return response()->json(['message' => 'Import failed: ' . $result['message']], 500);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Import Error: ' . $e->getMessage()], 500);
        }
    }

    public function progress()
    {
        $userId = auth()->id();
        $progress = \Illuminate\Support\Facades\Cache::get('import_progress_' . $userId, ['percent' => 0, 'message' => 'Waiting...']);
        return response()->json($progress);
    }
}
