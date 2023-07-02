export const prepForTitleAttribute = (value) =>
{
    let parsedValue = convertHtmlToText(value);
    parsedValue = escapeText(parsedValue);
    return parsedValue;
};

export const convertHtmlToText = (value) =>
{
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = value;
    return tempDiv.innerText;
};

export const escapeText = (value) =>
{
    let escapeValue = value
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    return escapeValue;
};