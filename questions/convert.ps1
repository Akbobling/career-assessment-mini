$files = @(
    "第一大类问卷.txt",
    "第二大类问卷.txt",
    "第三大类问卷.txt",
    "第四大类问卷.txt",
    "第五大类问卷.txt",
    "第六大类问卷.txt",
    "第七大类问卷.txt"
)

foreach ($name in $files) {
    $path = "C:\Users\LXB\WeChatProjects\miniprogram-6\questions\$name"
    $raw = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
    # Replace number patterns with newlines for readability
    $raw = $raw -replace '(?<=。)\s*(中类\d|0[1-9]\s)', "`n`$1"
    $raw = $raw -replace '(?<=：)', "`n"
    $outPath = "C:\Users\LXB\WeChatProjects\miniprogram-6\questions\parsed_$name"
    [System.IO.File]::WriteAllText($outPath, $raw, [System.Text.Encoding]::UTF8)
}
Write-Host "Done"
