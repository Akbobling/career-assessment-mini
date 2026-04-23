$files = Get-ChildItem "C:\Users\LXB\WeChatProjects\miniprogram-6\questions\*.docx"
$word = New-Object -ComObject Word.Application
$word.Visible = $false

foreach ($f in $files) {
    $doc = $word.Documents.Open($f.FullName)
    $text = $doc.Content.Text
    $doc.Close()
    $outPath = "C:\Users\LXB\WeChatProjects\miniprogram-6\questions\$($f.BaseName).txt"
    [System.IO.File]::WriteAllText($outPath, $text, [System.Text.Encoding]::UTF8)
}

$word.Quit()
