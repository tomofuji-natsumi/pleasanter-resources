document.querySelectorAll("date-field").forEach(df => {
    const shadow = df.shadowRoot;
    if (!shadow) return;

    const btn = shadow.querySelector("button.current-date");
    if (!btn) return;

    const style = document.createElement("style");
    style.textContent = `
        button.current-date .material-symbols-sharp {
            color: var(--icon-color) !important;
            font-variation-settings: "FILL" 1, "wght" 400;
        }
    `;
    shadow.appendChild(style);
});

document.querySelectorAll("date-field").forEach(df => {
    const shadow = df.shadowRoot;
    if (!shadow) return;

    const btn = shadow.querySelector("button.current-date");
    if (!btn) return;

    btn.style.right = "4px";
});
