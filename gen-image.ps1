Add-Type -AssemblyName System.Drawing
$bmp = New-Object System.Drawing.Bitmap(600, 420)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::White)
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias
$font = New-Object System.Drawing.Font('Consolas', 20)
$brush = [System.Drawing.Brushes]::Black
$lines = @(
  'MIKA COFFEE SHOP',
  'INVOICE #2026-1101',
  '-----------------------------',
  'Coffee Beans 1kg      $18.00',
  'Ceramic Mug           $12.50',
  'Filter Paper x100     $12.00',
  '-----------------------------',
  'TOTAL                 $42.50',
  'Date: 2026-11-01'
)
$y = 25
foreach ($line in $lines) {
  $g.DrawString($line, $font, $brush, 40, $y)
  $y += 42
}
$bmp.Save('test-receipt.png', [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
Write-Host 'Created test-receipt.png'
