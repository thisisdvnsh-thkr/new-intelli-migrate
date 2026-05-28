param(
  [string]$web = 'https://api.render.com/deploy/srv-d79l9rudqaus73di79gg?key=zK8_-HPgpVw',
  [string]$health = 'https://new-intelli-migrate.onrender.com/api/health'
)

git fetch origin
git checkout -B stable-backend origin/master

git add backend/requirements.txt backend/requirements-ml.txt scripts/clean_sessions.sh backend/render.yaml

git commit -m "Stabilize backend: split ML deps, add cleanup script, reduce workers" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>" 2>&1
if ($LASTEXITCODE -eq 0) { Write-Output 'COMMIT_OK' } else { Write-Output 'NO_CHANGES_TO_COMMIT' }

git push origin stable-backend --set-upstream 2>&1

try { Invoke-RestMethod -Uri $web -Method Post -TimeoutSec 60; Write-Output 'WEBHOOK_TRIGGERED' } catch { Write-Output ('WEBHOOK_ERROR:' + $_.Exception.Message) }

# Poll health for up to ~5 minutes
$max=30; $i=0
while ($i -lt $max) {
  try {
    $r=Invoke-RestMethod -Uri $health -Method Get -TimeoutSec 10
    Write-Output ('HEALTH_OK:' + ($r | ConvertTo-Json -Depth 6))
    break
  } catch {
    Write-Output ("HEALTH_WAIT attempt {0}: {1}" -f $i, $($_.Exception.Message))
    Start-Sleep -Seconds 10
    $i++
  }
}
if ($i -ge $max) { Write-Output 'HEALTH_TIMEOUT' }
