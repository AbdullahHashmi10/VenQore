param(
    [string]$SourceDirectory,
    [string]$DestinationFile
)

$fullSource = (Resolve-Path $SourceDirectory).Path

if (Test-Path $DestinationFile) { Remove-Item $DestinationFile }

Write-Host "Creating Zip Archive: $DestinationFile"
Write-Host "Source: $fullSource"
Write-Host "Using fast C# embedded compressor..."

Add-Type -TypeDefinition @"
using System;
using System.IO;
using System.IO.Compression;

public class ZipFast {
    public static void CreateZip(string sourceDirectory, string destinationFile) {
        using (ZipArchive zip = ZipFile.Open(destinationFile, ZipArchiveMode.Create)) {
            string[] files = Directory.GetFiles(sourceDirectory, "*", SearchOption.AllDirectories);
            int prefixLength = sourceDirectory.Length;
            if (!sourceDirectory.EndsWith("\\") && !sourceDirectory.EndsWith("/")) {
                prefixLength++;
            }
            foreach (string file in files) {
                string relativePath = file.Substring(prefixLength);
                string entryName = relativePath.Replace('\\', '/');
                zip.CreateEntryFromFile(file, entryName);
            }
        }
    }
}
"@ -ReferencedAssemblies "System.IO.Compression", "System.IO.Compression.FileSystem"

[ZipFast]::CreateZip($fullSource, $DestinationFile)

Write-Host "Zip Creation Complete."
