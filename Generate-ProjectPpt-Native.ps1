$ErrorActionPreference = "Stop"

$outFile = Join-Path $PSScriptRoot "CarbonTrack-Nexus-Project-Presentation-Fixed.pptx"

$slides = @(
    @{
        Title = "CarbonTrack Nexus"
        Subtitle = "A Carbon Footprint Monitoring and Environmental Impact Analytics System"
        Bullets = @("Introduction | Need of Project | Problems | Proposed Solution")
        Footer = "Environmental Impact Analytics System"
        Kind = "Title"
    },
    @{
        Title = "Introduction"
        Subtitle = "A full-stack web application for personal and community-level environmental awareness."
        Bullets = @(
            "Tracks daily activities such as electricity usage, fuel, transport, and waste.",
            "Converts user activities into estimated carbon emissions in kg CO2.",
            "Provides dashboards, charts, monthly reports, goals, rewards, and an AI-style assistant.",
            "Supports administrators with high-emitter monitoring, zone reports, and complaint management."
        )
    },
    @{
        Title = "Why This Project Was Implemented"
        Subtitle = "The project responds to real environmental and awareness gaps."
        Bullets = @(
            "Many people know pollution is harmful but do not know their own daily carbon contribution.",
            "Existing carbon calculators are often one-time tools and do not support continuous tracking.",
            "Environmental issues like vehicle smoke and waste dumping need structured reporting.",
            "Students and communities need a simple digital system for awareness, measurement, and action."
        )
    },
    @{
        Title = "Reasons To Build This Project"
        Subtitle = "CarbonTrack connects individual behavior with community monitoring."
        Bullets = @(
            "To make carbon emissions visible through clear numbers, charts, and reports.",
            "To encourage eco-friendly habits through goals, streaks, missions, and rewards.",
            "To help admins identify risky zones, high emitters, and repeated complaint patterns.",
            "To combine carbon tracking, analytics, complaint reporting, and guidance in one platform."
        )
    },
    @{
        Title = "Problems Faced In Current Scenario"
        Subtitle = "Environmental data is often fragmented, manual, or difficult to act on."
        Bullets = @(
            "Users cannot easily track long-term emission history from everyday activities.",
            "There is limited personalized feedback on which habits increase carbon footprint.",
            "Local pollution complaints may lack proof, location details, and status tracking.",
            "Administrators may not have zone-wise analytics for identifying high-impact areas.",
            "Reports and summaries are difficult to generate manually for monthly review."
        )
    },
    @{
        Title = "Proposed Solution"
        Subtitle = "A single web-based system for tracking, analysis, reporting, and action."
        Bullets = @(
            "Users log activity data and the system calculates category-wise emissions.",
            "Dashboards show green score, trends, breakdowns, and monthly performance.",
            "Zone-based reports compare emissions geographically and help detect pressure areas.",
            "Smart complaints capture environmental issues with media evidence and status updates.",
            "Admin panels provide live monitoring, high-emitter alerts, CSV export, and analytics."
        )
    },
    @{
        Title = "How The Project Overcomes The Problems"
        Subtitle = "The system converts raw activity into useful decisions."
        Bullets = @(
            "Continuous records replace one-time estimation with meaningful emission history.",
            "Charts and reports help users understand which activity category causes more impact.",
            "Goals, streaks, missions, and rewards motivate regular low-carbon behavior.",
            "Complaint workflows improve evidence collection, review, and resolution tracking.",
            "Admin intelligence tools support faster identification of risky users, zones, and trends."
        )
    },
    @{
        Title = "Major Modules"
        Subtitle = "Main functional areas included in the project."
        Bullets = @(
            "Authentication: user registration, login, JWT security, role-based access, admin OTP.",
            "Carbon Entry: activity logging, emission calculation, history, and monthly reports.",
            "User Dashboard: charts, green score, goals, leaderboard, streak center, AI assistant.",
            "Smart Complaints: vehicle smoke and waste dumping reports with media and location data.",
            "Admin Dashboard: users, high emitters, zone reports, complaints, alerts, and CSV export."
        )
    },
    @{
        Title = "System Architecture"
        Subtitle = "Three-tier architecture used in the project."
        Bullets = @(
            "Presentation Layer: React, Vite, Tailwind CSS, charts, dashboards, and forms.",
            "Application Layer: Spring Boot APIs, security, carbon calculation, analytics, and alerts.",
            "Data Layer: MySQL database for users, entries, zones, goals, complaints, and reports.",
            "Flow: User/Admin -> Frontend -> REST API -> Business Services -> Database -> Reports."
        )
    },
    @{
        Title = "Technology Stack"
        Subtitle = "Technologies used to implement the system."
        Bullets = @(
            "Frontend: React 18, Vite, Tailwind CSS, React Router, Axios, Recharts.",
            "Backend: Spring Boot, Spring Security, Spring Data JPA, REST APIs.",
            "Database: MySQL with entities for users, roles, carbon entries, zones, goals, and complaints.",
            "Security: JWT authentication, role-based routing, password reset support, admin OTP verification.",
            "Additional features: OCR support, email service, OpenAPI documentation, and report support."
        )
    },
    @{
        Title = "Expected Benefits"
        Subtitle = "Practical value delivered by the project."
        Bullets = @(
            "Improves environmental awareness by showing measurable carbon impact.",
            "Helps users reduce emissions through feedback, goals, and behavior tracking.",
            "Supports civic responsibility through structured issue reporting.",
            "Helps administrators monitor zones, identify high emitters, and review complaints.",
            "Creates a scalable base for future smart-city and sustainability applications."
        )
    },
    @{
        Title = "Conclusion"
        Subtitle = "CarbonTrack Nexus is a practical digital step toward measurable environmental action."
        Bullets = @(
            "The project combines personal carbon tracking with community environmental reporting.",
            "It solves the gap between awareness and action using dashboards, reports, alerts, and guidance.",
            "The three-tier architecture makes the system secure, maintainable, and expandable.",
            "Future scope includes IoT sensor integration, mobile application support, and advanced prediction models."
        )
    }
)

function Add-Box {
    param(
        $Slide,
        [float]$Left,
        [float]$Top,
        [float]$Width,
        [float]$Height,
        [string]$Text,
        [int]$FontSize,
        [bool]$Bold = $false,
        [int]$FillRgb = 0x111827,
        [int]$LineRgb = 0x1F2937,
        [int]$TextRgb = 0xE5E7EB
    )

    $shape = $Slide.Shapes.AddShape(5, $Left, $Top, $Width, $Height)
    $shape.Fill.ForeColor.RGB = $FillRgb
    $shape.Line.ForeColor.RGB = $LineRgb
    $shape.TextFrame2.MarginLeft = 10
    $shape.TextFrame2.MarginRight = 10
    $shape.TextFrame2.MarginTop = 7
    $shape.TextFrame2.MarginBottom = 7
    $shape.TextFrame2.TextRange.Text = $Text
    $shape.TextFrame2.TextRange.Font.Name = "Aptos"
    $shape.TextFrame2.TextRange.Font.Size = $FontSize
    $shape.TextFrame2.TextRange.Font.Bold = [int]$Bold
    $shape.TextFrame2.TextRange.Font.Fill.ForeColor.RGB = $TextRgb
    return $shape
}

$ppt = New-Object -ComObject PowerPoint.Application
$ppt.Visible = [Microsoft.Office.Core.MsoTriState]::msoTrue

$presentation = $ppt.Presentations.Add()
$presentation.PageSetup.SlideWidth = 960
$presentation.PageSetup.SlideHeight = 540

foreach ($item in $slides) {
    $slide = $presentation.Slides.Add($presentation.Slides.Count + 1, 12)
    $slide.FollowMasterBackground = $false
    $slide.Background.Fill.ForeColor.RGB = 0x0B1220

    $topBand = $slide.Shapes.AddShape(1, 0, 0, 960, 12)
    $topBand.Fill.ForeColor.RGB = 0x22C55E
    $topBand.Line.Visible = 0

    $sideBand = $slide.Shapes.AddShape(1, 0, 12, 12, 528)
    $sideBand.Fill.ForeColor.RGB = 0x0F766E
    $sideBand.Line.Visible = 0

    if ($item.Kind -eq "Title") {
        Add-Box -Slide $slide -Left 78 -Top 120 -Width 780 -Height 75 -Text $item.Title -FontSize 36 -Bold $true -FillRgb 0x0B1220 -LineRgb 0x0B1220 -TextRgb 0xFFFFFF | Out-Null
        Add-Box -Slide $slide -Left 82 -Top 218 -Width 790 -Height 52 -Text $item.Subtitle -FontSize 20 -FillRgb 0x0B1220 -LineRgb 0x0B1220 -TextRgb 0xBDEBD5 | Out-Null
        Add-Box -Slide $slide -Left 84 -Top 320 -Width 690 -Height 58 -Text $item.Bullets[0] -FontSize 20 -Bold $true -FillRgb 0x12372F -LineRgb 0x22C55E -TextRgb 0xFFFFFF | Out-Null
        Add-Box -Slide $slide -Left 82 -Top 462 -Width 720 -Height 36 -Text $item.Footer -FontSize 14 -FillRgb 0x0B1220 -LineRgb 0x0B1220 -TextRgb 0x94A3B8 | Out-Null
    } else {
        Add-Box -Slide $slide -Left 42 -Top 36 -Width 860 -Height 48 -Text $item.Title -FontSize 28 -Bold $true -FillRgb 0x0B1220 -LineRgb 0x0B1220 -TextRgb 0xFFFFFF | Out-Null
        Add-Box -Slide $slide -Left 48 -Top 88 -Width 850 -Height 32 -Text $item.Subtitle -FontSize 14 -FillRgb 0x0B1220 -LineRgb 0x0B1220 -TextRgb 0xA7F3D0 | Out-Null
        $top = 145
        foreach ($bullet in $item.Bullets) {
            Add-Box -Slide $slide -Left 68 -Top $top -Width 820 -Height 45 -Text ("- " + $bullet) -FontSize 18 -FillRgb 0x111827 -LineRgb 0x1F2937 -TextRgb 0xE5E7EB | Out-Null
            $top += 57
        }
    }
}

if (Test-Path $outFile) {
    Remove-Item -LiteralPath $outFile -Force
}

$presentation.SaveAs($outFile, 24)
$presentation.Close()
$ppt.Quit()

[System.Runtime.InteropServices.Marshal]::ReleaseComObject($presentation) | Out-Null
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($ppt) | Out-Null

Write-Host "Created $outFile"
