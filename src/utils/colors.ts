export function getHueWheel(luminance = 50) {
    const colors: string[] = []
    for (let ang = 0; ang < 361; ang++) {
        colors.push(`hsl(${ang} 100 ${luminance})`)
    }
    return colors
}
