console.log("Content Script Loaded!");

const injectUIInIframe = (iframeDoc) => {
    const firstRow = iframeDoc.querySelector("table tbody tr:first-child");
    if (firstRow) {
        const firstHeader = firstRow.querySelector("tr th");
        const uiContainer = document.createElement("div");
        uiContainer.id = "ui-container";
        uiContainer.style.position = "relative";
        uiContainer.style.backgroundColor = "white";
        uiContainer.style.padding = "10px";
        uiContainer.style.border = "1px solid #ccc";
        uiContainer.style.zIndex = "1000";
        uiContainer.style.marginBottom = "10px";

        const checkboxLabel = document.createElement("label");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = "hideExpiredCheckbox";
        checkboxLabel.appendChild(checkbox);
        checkboxLabel.appendChild(
            document.createTextNode("Hide expired companies.")
        );
        uiContainer.appendChild(checkboxLabel);

        if (firstHeader) {
            firstHeader.appendChild(uiContainer);
        } else {
            console.log("No rows found in tbody.");
        }
    } else {
        console.log("Iframe not found.");
    }
};
const isDateExpired = (dateString) => {
    const [datePart, timePart] = dateString.split(" ");
    const [day, month, year] = datePart.split("-").map(Number); // Parse DD-MM-YYYY
    const [hours, minutes] = timePart.split(":").map(Number); // Parse HH:MM (24-hour format)

    const inputDate = new Date(year, month - 1, day, hours, minutes); // Month is zero-indexed
    const today = new Date();

    return inputDate < today;
};
const highlightExpiredOpenings = () => {
    const iframe = document.querySelector("iframe");
    if (iframe) {
        iframe.onload = () => {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            console.log("iframeDoc", iframeDoc);
            const table = iframeDoc.getElementById("grid37");
            const tbody = table.querySelector("tbody");
            if (table && tbody) {
                const rows = tbody.getElementsByClassName(
                    "ui-widget-content jqgrow ui-row-ltr"
                );
                console.log("Rows loaded successfully!", rows);
                const observer = new MutationObserver(() => {
                    Array.from(rows).forEach((row, index) => {
                        // console.log("row", row);
                        const dateCell = row.querySelector(
                            '[aria-describedby="grid37_resumedeadline"]'
                        );
                        if (dateCell) {
                            // console.log("dateCell", dateCell);
                            const dateText = dateCell.textContent.trim();
                            console.log("dateText", dateText);
                            if (isDateExpired(dateText)) {
                                // row.remove();
                                Array.from(row.cells).forEach((cell) => {
                                    cell.style.removeProperty("background-color");
                                    cell.style.backgroundColor = "#E82561";
                                });
                            } else {
                                Array.from(row.cells).forEach((cell) => {
                                    cell.style.removeProperty("background-color");
                                    cell.style.backgroundColor = "#85A947";
                                });
                            }
                        }
                    });
                    injectUIInIframe(iframeDoc);
                    applyUserPreference(iframeDoc);
                });
                observer.observe(tbody, { childList: true, subtree: true });
            }
        };
    }
};

const applyUserPreference = (iframeDoc) => {
    const hideExpired = JSON.parse(localStorage.getItem("hideExpiredCompanies"));
    const table = iframeDoc.getElementById("grid37");
    const tbody = table.querySelector("tbody");
    if (table && tbody) {
        const rows = tbody.getElementsByClassName(
            "ui-widget-content jqgrow ui-row-ltr"
        );
        const observer = new MutationObserver(() => {
            Array.from(rows).forEach((row, index) => {
                const dateCell = row.querySelector(
                    '[aria-describedby="grid37_resumedeadline"]'
                );
                if (dateCell) {
                    const dateText = dateCell.textContent.trim();
                    if (isDateExpired(dateText)) {
                        if (hideExpired) {
                            row.style.display = "none";
                        } else {
                            row.style.display = "";
                        }
                    }
                }
            });
        });
        observer.observe(tbody, { childList: true, subtree: true });
    }
};

// Add event listener to the checkbox to toggle visibility/removal of expired rows
const hideButton = document.getElementById("hideExpiredCheckbox");
if (hideButton) {
    hideButton.addEventListener("change", (event) => {
        const isChecked = event.target.checked;

        // Save the user's choice to localStorage
        localStorage.setItem("hideExpiredCompanies", JSON.stringify(isChecked));

        // Re-run the function whenever the user toggles the checkbox
        highlightExpiredOpenings();
    });
}


// Retrieve the user's choice from localStorage and set the checkbox state
const loadUserPreference = () => {
    const hideExpired = JSON.parse(localStorage.getItem("hideExpiredCompanies"));
    const hideButton = document.getElementById("hideExpiredCheckbox");

    // If the user has previously made a choice, set the checkbox accordingly
    if (hideExpired !== null) {
        if(hideButton){
            hideButton.checked = hideExpired;
        }
    } else {
        if(hideButton){
            hideButton.checked = false;
        }
    }
};

highlightExpiredOpenings();
loadUserPreference();
