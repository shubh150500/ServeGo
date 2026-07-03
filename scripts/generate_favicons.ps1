# Add System.Drawing assembly
Add-Type -AssemblyName System.Drawing

$logoPath = Resolve-Path "public/logo.png"
$publicDir = (Get-Item "public").FullName

# Function to resize image and save as PNG
function Resize-Image {
    param (
        [string]$sourcePath,
        [string]$outputPath,
        [int]$width,
        [int]$height
    )
    
    $srcImage = [System.Drawing.Image]::FromFile($sourcePath)
    $destBitmap = New-Object System.Drawing.Bitmap($width, $height)
    $graphic = [System.Drawing.Graphics]::FromImage($destBitmap)
    
    # Configure high quality resizing
    $graphic.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphic.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphic.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphic.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    # Draw resized image
    $graphic.DrawImage($srcImage, 0, 0, $width, $height)
    
    # Save as PNG
    $destBitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    # Dispose resources
    $graphic.Dispose()
    $destBitmap.Dispose()
    $srcImage.Dispose()
    
    Write-Host "Generated: $outputPath ($width x $height)"
}

# Function to convert PNG to ICO (Simple ICO wrapping)
function Convert-ToIco {
    param (
        [string]$sourcePngPath,
        [string]$outputIcoPath
    )
    # Simple copy for 32x32 to ico format, or wrapping as Icon
    $srcImage = [System.Drawing.Bitmap]::FromFile($sourcePngPath)
    $hIcon = $srcImage.GetHicon()
    $icon = [System.Drawing.Icon]::FromHandle($hIcon)
    
    $fileStream = New-Object System.IO.FileStream($outputIcoPath, [System.IO.FileMode]::Create)
    $icon.Save($fileStream)
    
    $fileStream.Close()
    $icon.Dispose()
    # DestroyIcon is required to avoid handle leaks
    # [System.Runtime.InteropServices.Marshal]::DestroyStructure($hIcon, [System.Drawing.Icon])
    $srcImage.Dispose()
    
    Write-Host "Generated: $outputIcoPath from $sourcePngPath"
}

# Generate PNG icons
Resize-Image -sourcePath $logoPath -outputPath "$publicDir/favicon-16x16.png" -width 16 -height 16
Resize-Image -sourcePath $logoPath -outputPath "$publicDir/favicon-32x32.png" -width 32 -height 32
Resize-Image -sourcePath $logoPath -outputPath "$publicDir/apple-touch-icon.png" -width 180 -height 180
Resize-Image -sourcePath $logoPath -outputPath "$publicDir/android-chrome-192x192.png" -width 192 -height 192
Resize-Image -sourcePath $logoPath -outputPath "$publicDir/android-chrome-512x512.png" -width 512 -height 512

# Generate favicon.ico
Convert-ToIco -sourcePngPath "$publicDir/favicon-32x32.png" -outputIcoPath "$publicDir/favicon.ico"
