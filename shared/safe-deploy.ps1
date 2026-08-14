param(
  [Parameter(Mandatory=$true)][ValidateSet("arabiastrike","aljazira")][string]$Game,
  [switch]$Publish
)
$ErrorActionPreference="Stop"
$Owner="ex-experience"
$Map=@{
 "arabiastrike"=@{Repo="arabiastrike";GameId="ARABIA_STRIKE"}
 "aljazira"=@{Repo="aljazira";GameId="EX_ALJAZIRA"}
}
$cfg=$Map[$Game]
$pkg=Join-Path $PSScriptRoot "..\$Game"
$idFile=Join-Path $pkg "game-id.json"
if(!(Test-Path $idFile)){throw "Missing game-id.json"}
$id=Get-Content $idFile -Raw | ConvertFrom-Json
if($id.gameId -ne $cfg.GameId){throw "SAFETY BLOCK: GAME_ID mismatch"}
if($id.repository -ne "$Owner/$($cfg.Repo)"){throw "SAFETY BLOCK: repository mismatch"}
if(!(Get-Command git -ErrorAction SilentlyContinue)){throw "Git is required"}
if(!(Get-Command gh -ErrorAction SilentlyContinue)){throw "GitHub CLI is required"}
gh auth status *> $null
if($LASTEXITCODE-ne0){throw "Run: gh auth login"}

$stamp=Get-Date -Format "yyyyMMdd-HHmmss"
$work=Join-Path $env:TEMP "EX_SAFE_DEPLOY_$Game`_$stamp"
git clone "https://github.com/$Owner/$($cfg.Repo).git" $work
if($LASTEXITCODE-ne0){throw "Clone failed"}
Push-Location $work
try {
  $head=(git rev-parse HEAD).Trim()
  $backup="backup-before-$Game-$stamp"
  git branch $backup $head
  git push origin $backup
  Write-Host "Backup created: $backup" -ForegroundColor Green

  git rm -r -f --ignore-unmatch . | Out-Null
  Copy-Item -Path "$pkg\*" -Destination $work -Recurse -Force
  git add -A
  git commit -m "Deploy $($cfg.GameId) MAX TECH V2"

  if($Publish) {
    git push origin HEAD:main
    Write-Host "Published to main." -ForegroundColor Green
  } else {
    $preview="preview-$Game-$stamp"
    git checkout -b $preview
    git push origin $preview
    Write-Host "Preview only: $preview" -ForegroundColor Cyan
  }
} finally { Pop-Location }
