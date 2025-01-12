console.log("Content Script Loaded!");

const injectUIInIframe = () => {
    const iframe = document.querySelector("iframe");
    if (iframe) {
        iframe.onload = () => {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            console.log("Iframe loaded successfully!", iframeDoc);

            const table = iframeDoc.querySelector("table");
            const tbody = table ? table.querySelector("tbody") : null;

            if (tbody) {
                const firstRow = tbody.querySelector("tr");  // Get the first row in tbody
                
                // Create the UI container
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
                checkboxLabel.appendChild(document.createTextNode(" Hide expired rows"));

                uiContainer.appendChild(checkboxLabel);

                // Insert the UI container before the first row
                if (firstRow) {
                    tbody.insertBefore(uiContainer, firstRow);  // Place it above the first row of the tbody
                } else {
                    console.log("No rows found in tbody.");
                }
            }
        };
    } else {
        console.log("Iframe not found.");
    }
};
injectUIInIframe();
const isDateExpired = (dateString) => {
    const [datePart, timePart] = dateString.split(" ");
    const [day, month, year] = datePart.split("-").map(Number); // Parse DD-MM-YYYY
    const [hours, minutes] = timePart.split(":").map(Number); // Parse HH:MM (24-hour format)

    // Construct a Date object
    const inputDate = new Date(year, month - 1, day, hours, minutes); // Month is zero-indexed
    const today = new Date(); // Get today's date and time

    // Check if the input date is in the past
    return inputDate < today;
};
const highlightExpiredOpenings = () => {
    const iframe = document.querySelector("iframe");
    if (iframe) {
        iframe.onload = () => {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            const table = iframeDoc.getElementById("grid37");
            const tbody = table.querySelector("tbody");
            if (table && tbody) {
                const rows = tbody.getElementsByClassName("ui-widget-content jqgrow ui-row-ltr");
                // console.log("Rows loaded successfully!", rows);
                const observer = new MutationObserver(() => {
                    Array.from(rows).forEach((row, index) => {
                        // console.log("row", row);
                        const dateCell = row.querySelector('[aria-describedby="grid37_resumedeadline"]');
                        if (dateCell) {
                            // console.log("dateCell", dateCell);
                            const dateText = dateCell.textContent.trim();
                            if(isDateExpired(dateText)) {
                                // row.remove();
                                Array.from(row.cells).forEach(cell => {
                                    cell.style.removeProperty("background-color");
                                    cell.style.backgroundColor = "#E82561";
                                });
                            }else{
                                Array.from(row.cells).forEach(cell => {
                                    cell.style.removeProperty("background-color");
                                    cell.style.backgroundColor = "#85A947";
                                });
                            }
                        }
                    });
                });
                observer.observe(tbody, { childList: true, subtree: true });
            }
        };
    }
};

highlightExpiredOpenings();

// Add event listener to the checkbox to toggle visibility/removal of expired rows
document.getElementById("hideExpiredCheckbox").addEventListener("change", (event) => {
    const isChecked = event.target.checked;

    // Save the user's choice to localStorage
    localStorage.setItem("hideExpiredRows", JSON.stringify(isChecked));

    // Re-run the function whenever the user toggles the checkbox
    highlightExpiredOpenings();
});

// Retrieve the user's choice from localStorage and set the checkbox state
const loadUserPreference = () => {
    const hideExpired = JSON.parse(localStorage.getItem("hideExpiredRows"));

    // If the user has previously made a choice, set the checkbox accordingly
    if (hideExpired !== null) {
        document.getElementById("hideExpiredCheckbox").checked = hideExpired;
    } else {
        // Default to not hiding expired rows if no preference is stored
        document.getElementById("hideExpiredCheckbox").checked = false;
    }
};

// Load the user's preference when the page is loaded
loadUserPreference();