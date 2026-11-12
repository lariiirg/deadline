$ErrorActionPreference = 'Stop'
$deadlineRoot = Split-Path -Parent $PSScriptRoot
$deadlinePassword = Read-Host 'Digite a senha MySQL do usuario admin (nao aparece na tela)' -AsSecureString
$deadlinePointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($deadlinePassword)
try {
    $env:DEADLINE_SETUP_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($deadlinePointer)
    & node (Join-Path $PSScriptRoot 'configurar-banco.cjs')
    $deadlineExitCode = $LASTEXITCODE
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($deadlinePointer)
    Remove-Item Env:DEADLINE_SETUP_PASSWORD -ErrorAction SilentlyContinue
    $deadlinePassword.Dispose()
}
exit $deadlineExitCode
