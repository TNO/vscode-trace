export function isLight(color: string) {
    const colors = JSON.parse(color.slice(3).replace("(", "[").replace(")", "]"));
    const brightness = (colors[0] * 299 + colors[1] * 587 + colors[2] * 114) / 1000;
    return brightness > 110;
}