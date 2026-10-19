param([Parameter(Mandatory=$true)][string]$Artifact)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSHOME 'Modules\Microsoft.PowerShell.Security\Microsoft.PowerShell.Security.psd1') -ErrorAction Stop
$signature = Get-AuthenticodeSignature -LiteralPath $Artifact
[pscustomobject]@{
    status = [string]$signature.Status
    publisher = if ($signature.SignerCertificate) { $signature.SignerCertificate.Subject } else { $null }
} | ConvertTo-Json -Compress
