Add-Type -AssemblyName System.Drawing
$deadlineAssets = Join-Path $PSScriptRoot '../app/assets'
foreach ($deadlineAsset in @('icon.png', 'adaptive-icon.png')) {
  $deadlineBitmap = New-Object System.Drawing.Bitmap 1024,1024
  $deadlineGraphics = [System.Drawing.Graphics]::FromImage($deadlineBitmap)
  $deadlineGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  if ($deadlineAsset -eq 'icon.png') { $deadlineGraphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#F7F8FA')) }
  else { $deadlineGraphics.Clear([System.Drawing.Color]::Transparent) }
  $deadlineBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#EF4444'))
  $deadlinePen = New-Object System.Drawing.Pen $deadlineBrush,34
  $deadlinePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $deadlinePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $deadlineGraphics.DrawLine($deadlinePen,350,300,674,300)
  $deadlineGraphics.DrawLine($deadlinePen,350,724,674,724)
  $deadlineGraphics.DrawLines($deadlinePen, [System.Drawing.Point[]]@([System.Drawing.Point]::new(378,312),[System.Drawing.Point]::new(378,396),[System.Drawing.Point]::new(488,502),[System.Drawing.Point]::new(488,522),[System.Drawing.Point]::new(378,628),[System.Drawing.Point]::new(378,712)))
  $deadlineGraphics.DrawLines($deadlinePen, [System.Drawing.Point[]]@([System.Drawing.Point]::new(646,312),[System.Drawing.Point]::new(646,396),[System.Drawing.Point]::new(536,502),[System.Drawing.Point]::new(536,522),[System.Drawing.Point]::new(646,628),[System.Drawing.Point]::new(646,712)))
  $deadlineGraphics.FillPolygon($deadlineBrush, [System.Drawing.Point[]]@([System.Drawing.Point]::new(414,675),[System.Drawing.Point]::new(512,580),[System.Drawing.Point]::new(610,675)))
  $deadlineBitmap.Save((Join-Path $deadlineAssets $deadlineAsset), [System.Drawing.Imaging.ImageFormat]::Png)
  $deadlinePen.Dispose(); $deadlineBrush.Dispose(); $deadlineGraphics.Dispose(); $deadlineBitmap.Dispose()
}
