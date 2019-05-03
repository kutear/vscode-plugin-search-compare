export function searchKeywordByContent(content: string, keyword: string): string {
    const byLines = content.split("\n");
    const searchResultLines: Array<string> = [];
    byLines.forEach((value) => {
        if (value.match(keyword)) {
            searchResultLines.push(value);
        } else {
            searchResultLines.push("");
        }
    });
    return searchResultLines.join("\n");
}