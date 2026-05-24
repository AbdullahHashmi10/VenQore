param(
    [string]$SourceDirectory,
    [string]$DestinationFile
)

Add-Type -AssemblyName System.IO.Compression.FileSystem

$fullSource = (Resolve-Path $SourceDirectory).Path

if (Test-Path $DestinationFile) { Remove-Item $DestinationFile }

Write-Host "Creating Zip Archive: $DestinationFile"
Write-Host "Source: $fullSource"

$zip = [System.IO.Compression.ZipFile]::Open($DestinationFile, 'Create')

$files = Get-ChildItem $fullSource -Recurse -File -Force

foreach ($file in $files) {
    # Absolute path
    $filePath = $file.FullName
    # Relative path (remove source dir + \ at start)
    $relativePath = $filePath.Substring($fullSource.Length + 1)
    
    # CRITICAL: Force Forward Slashes for Linux Compatibility
    $entryName = $relativePath.Replace('\', '/')
    
    # Write to Zip
    [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $filePath, $entryName)
}

$zip.Dispose()
Write-Host "Zip Creation Complete."
