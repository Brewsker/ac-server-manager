# Smart commit with automatic version bumping
# Usage: .\commit.ps1 "feat: your commit message"

param(
    [Parameter(Mandatory=$true)]
    [string]$Message
)

# First, bump the version based on commit type
.\scripts\bump-version.ps1 $Message

# Then commit with the message
git commit -m $Message

# Show the result
Write-Host "`nCommit completed!" -ForegroundColor Green
git log -1 --oneline
