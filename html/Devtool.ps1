
#region 浏览器检测逻辑
$browsers = @(
    @{
        Path = "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe"
        Name = "Chrome"
    },
    @{
        Path = "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe"
        Name = "Chrome (x86)"
    },
    @{
        Path = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\Microsoft Edge.exe"
        Name = "Microsoft Edge"
    },
    @{
        Path = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
        Name = "Microsoft Edge"
    }
)
# C:\Program Files (x86)\Microsoft\Edge\Application\Microsoft Edge.exe
$browser = ""
foreach ($browser in $browsers) {
    if (Test-Path $browser.Path -PathType Leaf) {
			$browser = $browser.Path
    }
}

$response = Invoke-WebRequest -Uri 'http://127.0.0.1:9222/json/list' -Method Get | Select-Object -ExpandProperty Content
 
# 解析JSON响应
$targets = $response | ConvertFrom-Json
 
# 遍历每个目标并打开调试页面
$targets | ForEach-Object {
    $devtoolsUrl = $_.devtoolsFrontendUrl
    if ($devtoolsUrl) {
				$devtoolsUrl = "http://127.0.0.1:9222"+$devtoolsUrl
				$arguments = "$($devtoolsUrl) icatemen-devtool"
				Start-Process $browser -ArgumentList $arguments
        # 调式输出打印
        # Write-Host "检测到浏览器"$($browser)"，打开调试页面$(devtoolsUrl)"
    }
}
