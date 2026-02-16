
function onSubmit() {

    const fileInput = document.getElementById("WordDoc");
    const file = fileInput.files[0];
    const divSummary = document.getElementById("summary");
    const prompt = `
    You are a professional meeting analysis assistant.Don't add any asterix of bolding throughout the response.

    I will provide a meeting transcript below.

    Don't give the section names in the response.

    Your task is to analyze the transcript and respond in EXACTLY TWO sections using the format below.
    
    -----------------------------

    SECTION 1: SUMMARY

    Provide a clear, well-structured summary of the meeting.
    The summary must:
    - Clearly mention key discussion points.
    - Specify who said what (attribute statements to speakers where possible).
    - Highlight important decisions made.
    - State the final conclusion or outcome of the meeting.
    - Be written in professional, concise language.
    - Use bullet points where appropriate.
    
-   ----------------------------

    SECTION 2: ACTION ITEMS

    List all final action items mentioned in the meeting.

    For EACH action item, include:
    - Task: What needs to be done
    - Assigned To: Who is responsible
    - Assigned By: Who assigned the task (if mentioned)
    - Deadline: Deadline (if mentioned; otherwise write "Not specified")

    Only include confirmed action items — do NOT include suggestions that were not finalized.

    Format each action item clearly and separately.
    `;

    if (!file) {
        alert("Please Upload a Word File");
        return;
    }

    divSummary.innerText = "Reading Doc";

    document.getElementById("resultSection").style.display = "block";


    const formData = new FormData();
    formData.append("file", file);
    formData.append("prompt", prompt);

    fetch("/ask", {
        method: "POST",
        body: formData
    })

        .then(async res => {
            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(errorText || "Server Error");
            }
            return res.text();
        })
        .then(data => {

            // Split using the section titles
            const summaryStart = data.indexOf("SECTION 1");
            const actionStart = data.indexOf("SECTION 2");

            let summaryText = "";
            let actionText = "";

            if (summaryStart !== -1 && actionStart !== -1) {
                // Determine header lengths to strip them
                // "SECTION 1: SUMMARY" length is roughly 18 chars + newline
                // "SECTION 2: ACTION ITEMS" length is roughly 23 chars + newline

                // Find end of header line (approximate or use fixed length if consistent)
                // Let's assume the header is "SECTION 1: SUMMARY" exactly.

                summaryText = data.substring(summaryStart + "SECTION 1: SUMMARY".length, actionStart).trim();
                actionText = data.substring(actionStart + "SECTION 2: ACTION ITEMS".length).trim();
            } else {
                // fallback if format slightly different
                const parts = data.split("ACTION ITEMS");
                summaryText = parts[0] || "";
                actionText = parts[1] || "";
            }

            document.getElementById("summary").innerText = summaryText.trim();

            // Parse and render action items
            const actionListDiv = document.getElementById("actionList");
            actionListDiv.innerHTML = ""; // Clear previous content

            // Basic parsing strategy: Split by "Task:" keyword which marks the start of a new item
            // Note: This relies on the model following the prompt instructions.
            const rawItems = actionText.split(/Task:/i).filter(item => item.trim().length > 0);

            if (rawItems.length === 0) {
                // Fallback if formatting failed
                actionListDiv.innerText = actionText;
            } else {
                rawItems.forEach(itemText => {
                    const card = document.createElement("div");
                    card.className = "action-card";

                    // Re-add "Task:" prefix for the first line and format the rest
                    // check if it already has the prefix (unlikely due to split) or just content
                    // We'll format the content assuming it contains the other fields

                    // Let's format the content nicely.
                    // The text might look like " Update website\nAssigned To: Bob\n..."

                    const content = `<strong>Task:</strong> ${itemText.trim().replace(/\n/g, "<br>")}`;
                    card.innerHTML = content;

                    actionListDiv.appendChild(card);
                });
            }

        })

        .catch(function (error) {
            console.error(error);
            divSummary.innerText = error.message || "Something went wrong";
        }
        )

}