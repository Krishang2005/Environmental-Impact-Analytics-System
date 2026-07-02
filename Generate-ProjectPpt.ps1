$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression

$outFile = Join-Path $PSScriptRoot "CarbonTrack-Nexus-Project-Presentation.pptx"
$workDir = Join-Path $env:TEMP ("carbontrack_ppt_" + [guid]::NewGuid().ToString("N"))

function XmlEscape([string]$value) {
    return [System.Security.SecurityElement]::Escape($value)
}

function Emu([double]$inches) {
    return [int64]($inches * 914400)
}

function Write-Utf8File {
    param(
        [string]$Path,
        [string]$Value
    )
    $encoding = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Value, $encoding)
}

function Add-TextShape {
    param(
        [int]$Id,
        [string]$Name,
        [double]$X,
        [double]$Y,
        [double]$W,
        [double]$H,
        [string[]]$Lines,
        [int]$FontSize = 22,
        [string]$Color = "F8FAFC",
        [bool]$Bold = $false,
        [string]$Fill = "",
        [string]$Outline = "",
        [string]$Align = "l"
    )

    $fillXml = if ($Fill) {
        "<a:solidFill><a:srgbClr val=`"$Fill`"/></a:solidFill>"
    } else {
        "<a:noFill/>"
    }
    $lineXml = if ($Outline) {
        "<a:ln w=`"12700`"><a:solidFill><a:srgbClr val=`"$Outline`"/></a:solidFill></a:ln>"
    } else {
        "<a:ln><a:noFill/></a:ln>"
    }
    $boldXml = if ($Bold) { " b=`"1`"" } else { "" }
    $paras = foreach ($line in $Lines) {
        $safe = XmlEscape $line
        "<a:p><a:pPr algn=`"$Align`"/><a:r><a:rPr lang=`"en-US`" sz=`"$($FontSize * 100)`"$boldXml><a:solidFill><a:srgbClr val=`"$Color`"/></a:solidFill></a:rPr><a:t>$safe</a:t></a:r></a:p>"
    }

    @"
<p:sp>
  <p:nvSpPr><p:cNvPr id="$Id" name="$Name"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
  <p:spPr>
    <a:xfrm><a:off x="$(Emu $X)" y="$(Emu $Y)"/><a:ext cx="$(Emu $W)" cy="$(Emu $H)"/></a:xfrm>
    <a:prstGeom prst="roundRect"><a:avLst/></a:prstGeom>
    $fillXml
    $lineXml
  </p:spPr>
  <p:txBody>
    <a:bodyPr wrap="square" lIns="152400" tIns="91440" rIns="152400" bIns="91440"/>
    <a:lstStyle/>
    $($paras -join "`n")
  </p:txBody>
</p:sp>
"@
}

function Add-Rect {
    param(
        [int]$Id,
        [string]$Name,
        [double]$X,
        [double]$Y,
        [double]$W,
        [double]$H,
        [string]$Fill,
        [string]$Outline = ""
    )
    $lineXml = if ($Outline) {
        "<a:ln w=`"12700`"><a:solidFill><a:srgbClr val=`"$Outline`"/></a:solidFill></a:ln>"
    } else {
        "<a:ln><a:noFill/></a:ln>"
    }
    @"
<p:sp>
  <p:nvSpPr><p:cNvPr id="$Id" name="$Name"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
  <p:spPr>
    <a:xfrm><a:off x="$(Emu $X)" y="$(Emu $Y)"/><a:ext cx="$(Emu $W)" cy="$(Emu $H)"/></a:xfrm>
    <a:prstGeom prst="roundRect"><a:avLst/></a:prstGeom>
    <a:solidFill><a:srgbClr val="$Fill"/></a:solidFill>
    $lineXml
  </p:spPr>
</p:sp>
"@
}

function New-SlideXml {
    param(
        [string]$Title,
        [string]$Subtitle,
        [string[]]$Bullets,
        [string]$Accent = "22C55E",
        [switch]$TitleSlide,
        [switch]$Architecture
    )

    $shapes = New-Object System.Collections.Generic.List[string]
    $id = 2
    $shapes.Add((Add-Rect -Id ($id++) -Name "Background" -X 0 -Y 0 -W 13.333 -H 7.5 -Fill "0B1220"))
    $shapes.Add((Add-Rect -Id ($id++) -Name "Accent Band" -X 0 -Y 0 -W 13.333 -H 0.16 -Fill $Accent))
    $shapes.Add((Add-Rect -Id ($id++) -Name "Side Accent" -X 0 -Y 0.16 -W 0.18 -H 7.34 -Fill "0F766E"))

    if ($TitleSlide) {
        $shapes.Add((Add-TextShape -Id ($id++) -Name "Project Name" -X 0.85 -Y 1.45 -W 11.8 -H 1.65 -Lines @($Title) -FontSize 36 -Color "FFFFFF" -Bold $true))
        $shapes.Add((Add-TextShape -Id ($id++) -Name "Subtitle" -X 0.95 -Y 3.1 -W 10.6 -H 0.85 -Lines @($Subtitle) -FontSize 20 -Color "BDEBD5"))
        $shapes.Add((Add-TextShape -Id ($id++) -Name "Focus" -X 0.95 -Y 4.35 -W 10.6 -H 1.15 -Lines @("Introduction | Need of Project | Problems | Proposed Solution") -FontSize 20 -Color "F8FAFC" -Fill "12372F" -Outline "22C55E"))
        $shapes.Add((Add-TextShape -Id ($id++) -Name "Footer" -X 0.95 -Y 6.55 -W 10.6 -H 0.45 -Lines @("Environmental Impact Analytics System") -FontSize 14 -Color "94A3B8"))
    } elseif ($Architecture) {
        $shapes.Add((Add-TextShape -Id ($id++) -Name "Title" -X 0.65 -Y 0.45 -W 12 -H 0.7 -Lines @($Title) -FontSize 30 -Color "FFFFFF" -Bold $true))
        $layers = @(
            @("Presentation Layer", "React, Vite, Tailwind CSS, charts, dashboards, forms", 0.95, 1.55, "14532D"),
            @("Application Layer", "Spring Boot APIs, security, carbon calculation, analytics, alerts", 0.95, 3.05, "164E63"),
            @("Data Layer", "MySQL database with users, entries, zones, goals, complaints", 0.95, 4.55, "312E81")
        )
        foreach ($layer in $layers) {
            $shapes.Add((Add-TextShape -Id ($id++) -Name $layer[0] -X ([double]$layer[2]) -Y ([double]$layer[3]) -W 11.35 -H 0.95 -Lines @($layer[0], $layer[1]) -FontSize 18 -Color "FFFFFF" -Bold $true -Fill $layer[4] -Outline $Accent))
        }
        $shapes.Add((Add-TextShape -Id ($id++) -Name "Flow" -X 1.05 -Y 6.1 -W 10.9 -H 0.55 -Lines @("User/Admin -> Frontend -> REST API -> Business Services -> Database -> Analytics Reports") -FontSize 18 -Color "D1FAE5" -Fill "0F172A" -Outline "334155" -Align "ctr"))
    } else {
        $shapes.Add((Add-TextShape -Id ($id++) -Name "Title" -X 0.65 -Y 0.45 -W 12 -H 0.72 -Lines @($Title) -FontSize 30 -Color "FFFFFF" -Bold $true))
        if ($Subtitle) {
            $shapes.Add((Add-TextShape -Id ($id++) -Name "Subtitle" -X 0.72 -Y 1.18 -W 11.8 -H 0.48 -Lines @($Subtitle) -FontSize 15 -Color "A7F3D0"))
        }
        $y = 1.9
        foreach ($bullet in $Bullets) {
            $shapes.Add((Add-TextShape -Id ($id++) -Name "Bullet" -X 0.95 -Y $y -W 11.55 -H 0.62 -Lines @("• $bullet") -FontSize 20 -Color "E5E7EB" -Fill "111827" -Outline "1F2937"))
            $y += 0.78
        }
    }

    @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      $($shapes -join "`n")
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>
"@
}

$slides = @(
    @{ Title = "CarbonTrack Nexus"; Subtitle = "A Carbon Footprint Monitoring and Environmental Impact Analytics System"; TitleSlide = $true },
    @{ Title = "Introduction"; Subtitle = "A full-stack web application for personal and community-level environmental awareness."; Bullets = @(
        "Tracks daily activities such as electricity usage, fuel, transport, and waste.",
        "Converts user activities into estimated carbon emissions in kg CO2.",
        "Provides dashboards, charts, monthly reports, goals, rewards, and an AI-style assistant.",
        "Supports administrators with high-emitter monitoring, zone reports, and complaint management."
    )},
    @{ Title = "Why This Project Was Implemented"; Subtitle = "The project responds to real environmental and awareness gaps."; Bullets = @(
        "Many people know pollution is harmful but do not know their own daily carbon contribution.",
        "Existing carbon calculators are often one-time tools and do not support continuous tracking.",
        "Environmental issues like vehicle smoke and waste dumping need structured reporting.",
        "Students and communities need a simple digital system for awareness, measurement, and action."
    )},
    @{ Title = "Reasons To Build This Project"; Subtitle = "CarbonTrack connects individual behavior with community monitoring."; Bullets = @(
        "To make carbon emissions visible through clear numbers, charts, and reports.",
        "To encourage eco-friendly habits through goals, streaks, missions, and rewards.",
        "To help admins identify risky zones, high emitters, and repeated complaint patterns.",
        "To combine carbon tracking, analytics, complaint reporting, and guidance in one platform."
    )},
    @{ Title = "Problems Faced In Current Scenario"; Subtitle = "Environmental data is often fragmented, manual, or difficult to act on."; Bullets = @(
        "Users cannot easily track long-term emission history from everyday activities.",
        "There is limited personalized feedback on which habits increase carbon footprint.",
        "Local pollution complaints may lack proof, location details, and status tracking.",
        "Administrators may not have zone-wise analytics for identifying high-impact areas.",
        "Reports and summaries are difficult to generate manually for monthly review."
    )},
    @{ Title = "Proposed Solution"; Subtitle = "A single web-based system for tracking, analysis, reporting, and action."; Bullets = @(
        "Users log activity data and the system calculates category-wise emissions.",
        "Dashboards show green score, trends, breakdowns, and monthly performance.",
        "Zone-based reports compare emissions geographically and help detect pressure areas.",
        "Smart complaints capture environmental issues with media evidence and status updates.",
        "Admin panels provide live monitoring, high-emitter alerts, CSV export, and analytics."
    )},
    @{ Title = "How The Project Overcomes The Problems"; Subtitle = "The system converts raw activity into useful decisions."; Bullets = @(
        "Continuous records replace one-time estimation with meaningful emission history.",
        "Charts and reports help users understand which activity category causes more impact.",
        "Goals, streaks, missions, and rewards motivate regular low-carbon behavior.",
        "Complaint workflows improve evidence collection, review, and resolution tracking.",
        "Admin intelligence tools support faster identification of risky users, zones, and trends."
    )},
    @{ Title = "Major Modules"; Subtitle = "Main functional areas included in the project."; Bullets = @(
        "Authentication: user registration, login, JWT security, role-based access, admin OTP.",
        "Carbon Entry: activity logging, emission calculation, history, and monthly reports.",
        "User Dashboard: charts, green score, goals, leaderboard, streak center, AI assistant.",
        "Smart Complaints: vehicle smoke and waste dumping reports with media and location data.",
        "Admin Dashboard: users, high emitters, zone reports, complaints, alerts, and CSV export."
    )},
    @{ Title = "System Architecture"; Subtitle = ""; Architecture = $true },
    @{ Title = "Technology Stack"; Subtitle = "Technologies used to implement the system."; Bullets = @(
        "Frontend: React 18, Vite, Tailwind CSS, React Router, Axios, Recharts.",
        "Backend: Spring Boot, Spring Security, Spring Data JPA, REST APIs.",
        "Database: MySQL with entities for users, roles, carbon entries, zones, goals, complaints, and notifications.",
        "Security: JWT authentication, role-based routing, password reset support, admin OTP verification.",
        "Additional features: OCR support, email service, OpenAPI documentation, PDF/report support."
    )},
    @{ Title = "Expected Benefits"; Subtitle = "Practical value delivered by the project."; Bullets = @(
        "Improves environmental awareness by showing measurable carbon impact.",
        "Helps users reduce emissions through feedback, goals, and behavior tracking.",
        "Supports civic responsibility through structured issue reporting.",
        "Helps administrators monitor zones, identify high emitters, and review complaints.",
        "Creates a scalable base for future smart-city and sustainability applications."
    )},
    @{ Title = "Conclusion"; Subtitle = "CarbonTrack Nexus is a practical digital step toward measurable environmental action."; Bullets = @(
        "The project combines personal carbon tracking with community environmental reporting.",
        "It solves the gap between awareness and action using dashboards, reports, alerts, and guidance.",
        "The three-tier architecture makes the system secure, maintainable, and expandable.",
        "Future scope includes IoT sensor integration, mobile application support, and advanced prediction models."
    )}
)

New-Item -ItemType Directory -Path $workDir | Out-Null
New-Item -ItemType Directory -Path (Join-Path $workDir "_rels") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $workDir "ppt") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $workDir "ppt\_rels") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $workDir "ppt\slides") | Out-Null

$contentOverrides = New-Object System.Collections.Generic.List[string]
$presentationRelationships = New-Object System.Collections.Generic.List[string]
$slideIds = New-Object System.Collections.Generic.List[string]

for ($i = 0; $i -lt $slides.Count; $i++) {
    $n = $i + 1
    $slide = $slides[$i]
    $xml = New-SlideXml @slide
    Write-Utf8File -Path (Join-Path $workDir "ppt\slides\slide$n.xml") -Value $xml
    $contentOverrides.Add("<Override PartName=`"/ppt/slides/slide$n.xml`" ContentType=`"application/vnd.openxmlformats-officedocument.presentationml.slide+xml`"/>")
    $presentationRelationships.Add("<Relationship Id=`"rId$n`" Type=`"http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide`" Target=`"slides/slide$n.xml`"/>")
    $slideIds.Add("<p:sldId id=`"$([int](256 + $i))`" r:id=`"rId$n`"/>")
}

$contentTypes = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  $($contentOverrides -join "`n  ")
</Types>
"@
Write-Utf8File -Path (Join-Path $workDir "[Content_Types].xml") -Value $contentTypes

$rootRels = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>
"@
Write-Utf8File -Path (Join-Path $workDir "_rels\.rels") -Value $rootRels

$presentationRels = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  $($presentationRelationships -join "`n  ")
</Relationships>
"@
Write-Utf8File -Path (Join-Path $workDir "ppt\_rels\presentation.xml.rels") -Value $presentationRels

$presentation = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldIdLst>
    $($slideIds -join "`n    ")
  </p:sldIdLst>
  <p:sldSz cx="12192000" cy="6858000" type="wide"/>
  <p:notesSz cx="6858000" cy="9144000"/>
  <p:defaultTextStyle>
    <a:defPPr><a:defRPr lang="en-US"/></a:defPPr>
  </p:defaultTextStyle>
</p:presentation>
"@
Write-Utf8File -Path (Join-Path $workDir "ppt\presentation.xml") -Value $presentation

if (Test-Path $outFile) {
    Remove-Item -LiteralPath $outFile -Force
}
$zip = [System.IO.Compression.ZipFile]::Open($outFile, [System.IO.Compression.ZipArchiveMode]::Create)
try {
    $rootPath = (Resolve-Path -LiteralPath $workDir).Path.TrimEnd('\', '/')
    $files = Get-ChildItem -LiteralPath $rootPath -Recurse -File
    foreach ($file in $files) {
        $parts = $file.FullName -split '[\\/]'
        $pptIndex = [array]::IndexOf($parts, 'ppt')
        $relsIndex = [array]::IndexOf($parts, '_rels')
        if ($file.Name -eq '[Content_Types].xml') {
            $entryName = '[Content_Types].xml'
        } elseif ($pptIndex -ge 0) {
            $entryName = ($parts[$pptIndex..($parts.Length - 1)] -join '/')
        } elseif ($relsIndex -ge 0) {
            $entryName = ($parts[$relsIndex..($parts.Length - 1)] -join '/')
        } else {
            continue
        }
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $file.FullName, $entryName) | Out-Null
    }
} finally {
    $zip.Dispose()
}
Remove-Item -LiteralPath $workDir -Recurse -Force

Write-Host "Created $outFile"
