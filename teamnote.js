function openTeamNotesTab() {

    document.querySelectorAll(".main > div")
        .forEach(div => div.classList.add("hidden"));

    document.getElementById("teamNotesTab")
        .classList.remove("hidden");

    renderTeamNotes();
}



function saveTeamNote() {

    const employee = document.getElementById("employeeName").value.trim();
    const note = document.getElementById("teamNoteInput").value.trim();

    if (!employee || !note) {
        // showToast?.("Please fill all fields");
        return;
    }

    if (!teamNotes[employee]) {
        teamNotes[employee] = [];
    }

    teamNotes[employee].push({
        text: note,
        progress: 0, // ✅ أضف هذا السطر
        date: new Date().toISOString(),
        by: localStorage.getItem("currentWarehouse") || "unknown"
    });

    localStorage.setItem("teamNotes", JSON.stringify(teamNotes));

    document.getElementById("teamNoteInput").value = "";

    renderTeamNotes();
}
function renderTeamNotes() {

    const container = document.getElementById("teamNotesList");
    const employee = document.getElementById("employeeName").value.trim();

    if (!employee) {
        container.innerHTML = "<p style='opacity:.5'>Enter employee name to view notes</p>";
        return;
    }

    const notes = teamNotes[employee] || [];

    if (!notes.length) {
        container.innerHTML = "<p style='opacity:.5'>No notes for this employee</p>";
        return;
    }

    container.innerHTML = notes
        .slice()
        .reverse()
        .map((n, index) => `
        <div style="
            background:#0f172a;
            border:1px solid #1f2937;
            padding:12px;
            border-radius:10px;
            margin-bottom:10px;
        ">
            <div style="font-size:11px;opacity:.6">
                ${new Date(n.date).toLocaleString()} — ${n.by}
            </div>

            <div style="margin-top:6px;margin-bottom:10px">
                ${n.text}
            </div>

            <!-- 🔥 Progress Bar -->
            <div style="
                background:#020617;
                border-radius:10px;
                height:8px;
                overflow:hidden;
                margin-bottom:6px;
            ">
                <div id="progressBar-${index}" style="
    width:${n.progress || 0}%;
    background:linear-gradient(90deg,#22c55e,#4ade80);
    height:100%;
    transition:.2s;
"></div>
            </div>

            <!-- 🔥 Percentage + Input -->
            <div style="display:flex;align-items:center;gap:8px">

                <span style="font-size:12px;font-weight:600;color:#22c55e">
                    ${n.progress || 0}%
                </span>

                <input type="range" min="0" max="100"
    value="${n.progress || 0}"
    oninput="updateNoteProgress('${employee}', ${index}, this.value)"
    style="width:100%;cursor:pointer
                        background:#020617;
                        border:1px solid #1f2937;
                        border-radius:6px;
                        padding:4px;
                        color:white;
                        font-size:11px;
                    "
                />
            </div>

        </div>
    `).join("");
}
function updateNoteProgress(employee, index, value) {

    value = Math.max(0, Math.min(100, Number(value)));

    if (!teamNotes[employee]) return;

    teamNotes[employee][index].progress = value;

    localStorage.setItem("teamNotes", JSON.stringify(teamNotes));

    // ✅ تحديث الرقم
    const text = document.getElementById(`progressText-${index}`);
    if (text) {
        text.textContent = value + "%";
    }

    // ✅ تحديث البار
    const bar = document.getElementById(`progressBar-${index}`);
    if (bar) {
        bar.style.width = value + "%";
    }
}

let teamNotes = JSON.parse(localStorage.getItem("teamNotes") || "{}");

