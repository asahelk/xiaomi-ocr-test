Add-Type -AssemblyName System.Drawing
$srcPath = Join-Path $PSScriptRoot 'captcha-orig.jpg'
$src = [System.Drawing.Image]::FromFile($srcPath)
$scale = 4
$bmp = New-Object System.Drawing.Bitmap($src.Width * $scale, $src.Height * $scale)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($src, 0, 0, $bmp.Width, $bmp.Height)
$outPath = Join-Path $PSScriptRoot 'captcha-4x.png'
$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
$src.Dispose()
Write-Host "Created captcha-4x.png ($($src.Width)x$($src.Height) -> $($bmp.Width)x$($bmp.Height))"
