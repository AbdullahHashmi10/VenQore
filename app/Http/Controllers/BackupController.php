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

    public function store(Request $request)
    {
        // Increase timeout for backup creation
        set_time_limit(300);

        try {
            $result = $this->backupService->createBackup();
            
            if ($result['success']) {
                if ($request->wantsJson()) {
                    return response()->json([
                        'success' => true,
                        'message' => 'Backup created successfully.',
                        'filename' => $result['filename']
                    ]);
                }
                return back()->with('success', 'Backup created successfully: ' . $result['filename']);
            }
            
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Backup failed: ' . $result['message']
                ], 500);
            }
            return back()->withErrors(['error' => 'Backup failed: ' . $result['message']]);

        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Backup Exception: ' . $e->getMessage()
                ], 500);
            }
            return back()->withErrors(['error' => 'Backup Exception: ' . $e->getMessage()]);
        }
    }

    public function download($filename)
    {
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
