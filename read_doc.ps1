$word = New-Object -ComObject Word.Application
$word.Visible = $false
$filePath = "c:\Users\DaYangYouXia\Desktop\DYXX\bishe\RAG大闸蟹养殖智能咨询系统开发.docx"
$doc = $word.Documents.Open($filePath)
$text = $doc.Content.Text
$text | Out-File -FilePath "c:\Users\DaYangYouXia\Desktop\DYXX\bishe\dev_doc.txt" -Encoding UTF8
$doc.Close()
$word.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
Write-Host "Done"
