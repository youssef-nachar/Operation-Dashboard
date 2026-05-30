
let appSettings = {
    batchTypes: {

    Wakilni: [
        {
            name: "Wakilni Batch 1",
            from: "10:00",
            to: "12:00"
        }
    ],

    Employee: [
        {
            name: "Employee Batch 1",
            from: "12:00",
            to: "15:00"
        }
    ],

    LMD: [
        {
            name: "LMD Batch 1",
            from: "15:00",
            to: "23:59"
        }
    ]
},

selectedBatchType: "Wakilni",

    batchesColumns: 2,

    readyPageTitle: "🚚 Ready To Distribute",

    readyPageColor: "#38bdf8"
};

function renderSingleBatch(title, orders) {

    return `
        <div style="background:#020617;padding:10px;border-radius:10px">
            <h4>${title}</h4>

            <table style="width:100%;text-align:center">
                <tr>
                    <th>Order</th>
                    <th>Boxes</th>
                    <th>CBM</th>
                </tr>

                ${orders.map(o => `
                    <tr>
                        <td>${o.orderNo}</td>
                        <td>${o.boxes || 0}</td>
                        <td>${o.cbm || 0}</td>
                    </tr>
                `).join("")}
            </table>
        </div>
    `;
}
function renderBatchesTable() {

    const container = document.getElementById("batchesTable");

    if (!container) return;

    const grouped = {};

    allOrders.forEach(o => {

        if (!o.batch) return;

        const batchType = o.batch?.type || "Unknown";
        const batchName = o.batch?.name || "No Batch";

        const fullName = `${batchType} - ${batchName}`;

        if (!grouped[fullName]) {
            grouped[fullName] = [];
        }

        grouped[fullName].push(o);

    });

    if (!Object.keys(grouped).length) {

        container.innerHTML = `
        <div style="
            padding:20px;
            text-align:center;
            color:#64748b;
        ">
            No batches distributed yet
        </div>
        `;

        return;
    }

    const html = Object.keys(grouped)
        .map(batchName => renderSingleBatch(batchName, grouped[batchName]))
        .join("");

    container.innerHTML = `
        <h3 style="color:#38bdf8;margin-bottom:15px">
            📦 Distribution Batches
        </h3>

        <div style="
            display:grid;
            grid-template-columns:repeat(${appSettings.batchesColumns},1fr);
            gap:20px;
        ">
            ${html}
        </div>
    `;
}
let editingReadyOrderNo = null;
function getCurrentBatchList() {

    return appSettings.batchTypes[
        appSettings.selectedBatchType
    ] || [];

}
function getCurrentBatch() {

    const now = new Date();

    const currentMinutes =
        now.getHours() * 60 + now.getMinutes();

    const batches = getCurrentBatchList();

for (const batch of batches) {

        const [fromH, fromM] = batch.from.split(":").map(Number);
        const [toH, toM] = batch.to.split(":").map(Number);

        const fromMinutes = fromH * 60 + fromM;
        const toMinutes = toH * 60 + toM;

        if (
            currentMinutes >= fromMinutes &&
            currentMinutes < toMinutes
        ) {
            return {
    type: appSettings.selectedBatchType,
    name: batch.name
};
        }
    }

    return {
    type: appSettings.selectedBatchType,
    name: "No Batch"
};
}
function openReadyEditModal(orderNo, boxes, cbm) {

    editingReadyOrderNo = orderNo;

    document.getElementById("editBoxes").value = boxes;
    document.getElementById("editCBM").value = cbm;

    document.getElementById("readyEditModal").classList.remove("hidden");
}
function saveReadyEdit() {

    const boxes = document.getElementById("editBoxes").value;
    const cbm = document.getElementById("editCBM").value;
    const comment = document.getElementById("editOrderComment").value.trim();

    const ordersRef = ref(db, "orders");

    get(ordersRef).then(snapshot => {

        snapshot.forEach(child => {

            const order = child.val();

            if (order.orderNo === editingReadyOrderNo) {

                update(ref(db, "orders/" + child.key), {
                    boxes: Number(boxes),
                    cbm: Number(cbm)
                }).then(() => {

                    // 🔥 الحل المهم:
                    const updatedOrder = allOrders.find(o => o.orderNo === editingReadyOrderNo);

                    if (updatedOrder) {
                        updatedOrder.boxes = Number(boxes);
                        updatedOrder.cbm = Number(cbm);
                    }

                    renderReadyOrders(); // 🔥 تحديث مباشر بدون refresh

                });

            }

        });

    });

    document.getElementById("readyEditModal").classList.add("hidden");
}
document.getElementById("readyEditModal").addEventListener("click", (e) => {
    if (e.target.id === "readyEditModal") {
        e.target.classList.add("hidden");
    }
});

function exportReadyToExcel() {

    const readyOrders = allOrders.filter(o =>
        o.readyToDistribute || o.status === "ready_to_distribute"
    );

    if (!readyOrders.length) {
        alert("No data to export");
        return;
    }

    let csv = "Order,Boxes,CBM,Status\n";

    readyOrders.forEach(o => {
        csv += `${o.orderNo},${o.boxes || 0},${o.cbm || 0}, ${o.note || 0},Ready\n`;
    });

    // إنشاء الملف
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", "Ready_To_Distribute.csv");
    link.style.display = "none";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
function moveToReadyFromInputs() {
const emailOrComment = document.getElementById("readyEmailInput").value.trim();
    const orderNo = document.getElementById("readyOrderInput").value.trim().toUpperCase();
    const boxes = document.getElementById("readyBoxesInput").value.trim();
    const cbm = document.getElementById("readyCBMInput").value.trim();

    if (!orderNo) return;

    if (boxes === "" || cbm === "") {
        alert("Please enter Boxes and CBM before saving");
        return;
    }

    const ordersRef = ref(db, "orders");

    get(ordersRef).then(snapshot => {

        snapshot.forEach(child => {

            const order = child.val();

            if (order.orderNo === orderNo) {

 update(ref(db, "orders/" + child.key), {
    readyToDistribute: true,
    status: "ready_to_distribute",
    boxes: Number(boxes),
    cbm: Number(String(cbm).replace(",", ".")),
    emailOrComment: emailOrComment, // ✅ الجديد
    readyTime: new Date().toISOString(),
    history: [
        ...(order.history || []),
        {
            action: "ready_to_distribute",
            date: new Date().toISOString(),
            by: "Packing Station",
            boxes,
            cbm,
            emailOrComment // optional في التاريخ
        }
    ]
}).then(() => {

                    // ✅ تحديث محلي فوري
                    const localOrder = allOrders.find(o => o.orderNo === orderNo);

                    if (localOrder) {
                        localOrder.readyToDistribute = true;
                        localOrder.status = "ready_to_distribute";
                        localOrder.boxes = Number(boxes);
                        localOrder.cbm = Number(cbm);
                    }

                    // ✅ إعادة الرسم مباشرة
                    renderReadyOrders();
                });

            }

        });

    });

    // تنظيف الحقول
    document.getElementById("readyOrderInput").value = "";
    document.getElementById("readyBoxesInput").value = "";
    document.getElementById("readyCBMInput").value = "";
    document.getElementById("readyEmailInput").value = "";
}

function showReadyToDistributeTab() {

    document.getElementById("dashboardHeader").style.display = "none";

    const container = document.getElementById("readyTab");

    container.innerHTML = `
    <div style="
display:flex;
justify-content:space-between;
align-items:center;
margin-bottom:20px;
">

<div>
    <div style="
    color:#64748b;
    font-size:12px;
    text-transform:uppercase;
    letter-spacing:2px;
    ">
        Logistics Operations
    </div>

    <h2 style="
    margin:0;
    color:white;
    font-size:28px;
    ">
        Ready To Distribute
    </h2>
</div>

<div style="
background:#0ea5e922;
color:#38bdf8;
padding:8px 14px;
border-radius:30px;
font-size:12px;
font-weight:700;
">
LIVE
</div>

</div>
<div style="
display:grid;
grid-template-columns:380px 1fr;
gap:24px;
padding:24px;
max-width:1600px;
margin:auto;
background:
radial-gradient(circle at top right,#0ea5e922 0%,transparent 40%),
linear-gradient(180deg,#020617,#0f172a);
min-height:100vh;
">

        <!-- LEFT PANEL (INPUTS) -->
<div style="
background:rgba(15,23,42,.85);
backdrop-filter:blur(20px);
border:1px solid rgba(56,189,248,.15);
padding:24px;
border-radius:24px;
box-shadow:
0 20px 40px rgba(0,0,0,.4),
0 0 40px rgba(14,165,233,.08);
position:sticky;
top:20px;
height:fit-content;
">

            <h2 style="margin-bottom:15px;font-size:18px;color:#38bdf8">
                🚚 Ready To Distribute
            </h2>
            <input class="ready" id="readyOrderInput"
                placeholder="Order #"
                style="width:100%;padding:10px;margin-bottom:10px;
                border-radius:10px;border:1px solid #1f2937;
                background:#020617;color:white" />

            <input id="readyBoxesInput"
                placeholder="Boxes Count"
                type="number"
                style="width:100%;padding:10px;margin-bottom:10px;
                border-radius:10px;border:1px solid #1f2937;
                background:#020617;color:white" />

            <input id="readyCBMInput"
                placeholder="CBM"
                type="number"
                step="0.01"
                style="width:100%;padding:10px;margin-bottom:10px;
                border-radius:10px;border:1px solid #1f2937;
                background:#020617;color:white" />

            <input id="readyEmailInput"
                placeholder="Comment / Email Notification"
                style="width:100%;padding:10px;margin-bottom:10px;
                border-radius:10px;border:1px solid #1f2937;
                background:#020617;color:white" />
<select id="batchTypeSelect"
    onchange="changeBatchType(this.value)"
    style="
        width:100%;
        padding:10px;
        margin-bottom:10px;
        border-radius:10px;
        background:#020617;
        color:white;
        border:1px solid #1f2937;
    ">

    ${Object.keys(appSettings.batchTypes).map(type => `
        <option value="${type}"
            ${appSettings.selectedBatchType === type ? "selected" : ""}>
            ${type}
        </option>
    `).join("")}

</select>
            <button onclick="moveToReadyFromInputs()"
               style="
width:100%;
padding:14px;
border:none;
border-radius:14px;
background:
linear-gradient(
135deg,
#22c55e,
#16a34a
);
color:white;
font-size:15px;
font-weight:700;
cursor:pointer;
box-shadow:
0 15px 30px rgba(34,197,94,.25);
transition:.3s;
">
🚚 Add To Ready
</button>
            <button onclick="exportReadyToExcel()"
                style="
                    width:100%;
                    padding:12px;
                    margin-top:10px;
                    background:#0ea5e9;
                    border:none;
                    border-radius:10px;
                    font-weight:600;
                    color:white;
                    cursor:pointer;
                ">
                ⬇ Export to Excel
            </button>
<button onclick="distributeSelectedOrders()"
style="
width:100%;
    padding:10px 16px;
    background:linear-gradient(135deg,#22c55e,#16a34a);
    border:none;
    border-radius:8px;
    color:white;
    font-weight:700;
    cursor:pointer;
    margin-top:10px;
">
    🚚 Distribute Selected
</button>
<button onclick="showSettingsTab()"
style="
    width:100%;
    padding:12px;
    background:#1e293b;
    border:none;
    border-radius:10px;
    color:white;
    font-weight:600;
    cursor:pointer;
    margin-top:10px;
">
    ⚙️ Settings
</button>
        </div>

        <!-- RIGHT PANEL (TABLE) -->
        <div style="
            background:
linear-gradient(
180deg,
rgba(15,23,42,.9),
rgba(2,6,23,.95)
);

backdrop-filter:blur(20px);

border:1px solid rgba(255,255,255,.05);

border-radius:24px;

box-shadow:
0 20px 40px rgba(0,0,0,.4);
            padding:18px;
            border-radius:16px;
            overflow:auto;
            min-height:70vh;
        ">

            <div style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                margin-bottom:10px;
            ">
                <h3 style="color:white;margin:0">
                    📦 Ready Orders
                </h3>
            </div>

            <div id="readyOrdersTable"></div>

        </div>

    </div>
<div id="batchesTable" style="margin-top:20px;"></div>

    `;

    document.querySelectorAll(".main > div").forEach(div => {
        if (div.id !== "readyTab") div.classList.add("hidden");
    });

    container.classList.remove("hidden");

renderReadyOrders();
renderBatchesTable(); // 🔥 مهم
}
function distributeSelectedOrders() {

    const checkboxes = document.querySelectorAll(".readyCheckbox:checked");

    if (!checkboxes.length) {
        alert("Select at least one order");
        return;
    }

    const selectedOrders = Array.from(checkboxes).map(cb => cb.value);
    const currentBatch = getCurrentBatch();
    const todayISO = new Date().toISOString();
    const todayDate = todayISO.split("T")[0];

    const ordersRef = ref(db, "orders");

    get(ordersRef).then(snapshot => {

        const updates = [];

        snapshot.forEach(child => {

            const order = child.val();

            if (selectedOrders.includes(order.orderNo)) {

                const updateData = {

                    status: "distributed",
                    readyToDistribute: false,

                    distributedDate: todayDate,

                    batch: {
    type: currentBatch.type,
    name: currentBatch.name,
    date: todayDate,
    time: todayISO
},

                    distributedTime: todayISO,

                    history: [
                        ...(order.history || []),
                        {
                            action: "distributed",
                            date: todayISO,
                            by: "Distribution",
                            batch: currentBatch.name,
batchType: currentBatch.type
                        }
                    ]
                };

                updates.push(
                    update(ref(db, "orders/" + child.key), updateData)
                );

                // ✅ تحديث محلي مباشر
                const localOrder = allOrders.find(
                    o => o.orderNo === order.orderNo
                );

                if (localOrder) {

                    localOrder.status = "distributed";
                    localOrder.readyToDistribute = false;

                    localOrder.distributedDate = todayDate;

                    localOrder.batch = {
    type: currentBatch.type,
    name: currentBatch.name,
    date: todayDate,
    time: todayISO
};

                    localOrder.distributedTime = todayISO;
                }

                // ✅ أهم إصلاح للـ KPI
                distributedOrdersMap[order.orderNo] = {
                    date: todayDate,
                    company: order.company || "LMD"
                };
            }
        });

        return Promise.all(updates);

    }).then(() => {

        renderReadyOrders();
        renderBatchesTable();
        updateDashboard();

        console.log("✅ Orders distributed successfully");

    }).catch(err => {

        console.error(err);
        alert("Distribution failed");

    });
}
function changeBatchType(type) {

    appSettings.selectedBatchType = type;

    saveSettings();

    renderBatchesTable();
}
function initReadyToDistribute() {

    const input = document.getElementById("readyOrderInput");

    input.addEventListener("input", function () {

        const value = this.value.trim().toUpperCase();

        // مثال pattern
        if (!/^#M\d{5}$/.test(value)) return;

        // moveToReady(value);

        // this.value = "";
    });
}
function moveToReady(orderNo) {

    const ordersRef = ref(db, "orders");

    get(ordersRef).then(snapshot => {

        snapshot.forEach(child => {

            const order = child.val();

            if (order.orderNo === orderNo) {

                update(ref(db, "orders/" + child.key), {
                    readyToDistribute: true,
                    status: "ready_to_distribute", // ✅ مهم جداً
                    readyTime: new Date().toISOString(),
                    history: [
                        ...(order.history || []),
                        {
                            action: "ready_to_distribute",
                            date: new Date().toISOString(),
                            by: "Packing Station"
                        }
                    ]
                }).then(() => {
                    renderReadyOrders(); // ✅ تحديث مباشر
                });

            }

        });

    });
}
function isDistributed(order) {
    return (
        order.status === "distributed" ||
        order.readyToDistribute === false &&
        order.batch ||
        (order.history || []).some(h => h.action === "distributed")
    );
}
function renderReadyOrders() {

    const container = document.getElementById("readyOrdersTable");

    const readyOrders = allOrders.filter(o =>
        o.readyToDistribute || o.status === "ready_to_distribute"
    );

    if (!readyOrders.length) {
        container.innerHTML = "<p>No ready orders</p>";
        return;
    }

container.innerHTML = `
<table class="ready-table" style="width:100%;border-collapse:collapse;text-align:center">
    <tr>
        <th></th> <!-- 🔥 جديد -->
        <th>Order</th>
        <th>Boxes</th>
        <th>CBM</th>
        <th>Note</th>
        <th>Status</th>
    </tr>

    ${readyOrders.map(o => `
        <tr>
            <td>
                <input type="checkbox" 
                    class="readyCheckbox" 
                    value="${o.orderNo}">
            </td>

            <td>${o.orderNo}</td>
            <td>${o.boxes || 0}</td>
            <td>${o.cbm || 0}</td>

            <td style="font-size:12px;color:#38bdf8">
                ${o.emailOrComment || "-"}
            </td>

            <td style="color:#22c55e;font-weight:600">
                Ready
            </td>

            <td>
                <button onclick="openReadyEditModal('${o.orderNo}', ${o.boxes || 0}, ${o.cbm || 0})">
                    Edit
                </button>
            </td>
        </tr>
    `).join("")}
</table>
`;
}

function loadSettings() {

    const saved = localStorage.getItem("appSettings");

    if (saved) {
        appSettings = JSON.parse(saved);
    }
}
function saveSettings() {

    localStorage.setItem(
        "appSettings",
        JSON.stringify(appSettings)
    );
}
function showSettingsTab() {

    const container = document.getElementById("settingsTab");

    if (!container) {
        console.error("settingsTab not found");
        return;
    }

    document.querySelectorAll(".main > div").forEach(div => {
        div.classList.add("hidden");
    });

    container.classList.remove("hidden");

    container.innerHTML = `

    <div style="
        background:#0f172a;
        padding:20px;
        border-radius:16px;
        max-width:1000px;
        margin:auto;
    ">

        <div style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            margin-bottom:20px;
        ">

            <h2 style="color:white">
                ⚙️ Batch Settings
            </h2>

            <button onclick="showReadyToDistributeTab()"
                style="
                    padding:10px 16px;
                    background:#22c55e;
                    border:none;
                    border-radius:8px;
                    color:white;
                    cursor:pointer;
                ">
                ← Back
            </button>

        </div>
<select id="settingsBatchType"
    onchange="changeSettingsBatchType(this.value)"
    style="
        width:100%;
        padding:12px;
        margin-bottom:20px;
        border-radius:10px;
    ">

    ${Object.keys(appSettings.batchTypes).map(type => `
        <option value="${type}"
            ${appSettings.selectedBatchType === type ? "selected" : ""}>
            ${type}
        </option>
    `).join("")}

</select>
        <div id="batchSettingsList">

            ${getCurrentBatchList().map((b, index) => `

                <div style="
                    display:grid;
                    grid-template-columns:1fr 1fr 1fr auto;
                    gap:10px;
                    margin-bottom:12px;
                    background:#020617;
                    padding:12px;
                    border-radius:10px;
                ">

                    <input
                        value="${b.name}"
                        onchange="updateBatchName(${index}, this.value)"
                        style="padding:10px;border-radius:8px"
                    >

                    <input
                        type="time"
                        value="${b.from}"
                        onchange="updateBatchFrom(${index}, this.value)"
                        style="padding:10px;border-radius:8px"
                    >

                    <input
                        type="time"
                        value="${b.to}"
                        onchange="updateBatchTo(${index}, this.value)"
                        style="padding:10px;border-radius:8px"
                    >

                    <button onclick="deleteBatch(${index})"
                        style="
                            background:#ef4444;
                            border:none;
                            border-radius:8px;
                            color:white;
                            padding:10px;
                            cursor:pointer;
                        ">
                        ❌
                    </button>

                </div>

            `).join("")}

        </div>

        <button onclick="addBatch()"
            style="
                margin-top:15px;
                padding:12px 18px;
                background:#0ea5e9;
                border:none;
                border-radius:10px;
                color:white;
                font-weight:600;
                cursor:pointer;
            ">
            ➕ Add Batch
        </button>

    </div>
    `;
}
function updateBatchName(index, value) {

    getCurrentBatchList()[index].name = value;
    saveSettings();
}

function updateBatchFrom(index, value) {

    getCurrentBatchList()[index].from = value;
    saveSettings();
}

function updateBatchTo(index, value) {

    getCurrentBatchList()[index].to = value;
    saveSettings();
}

function deleteBatch(index) {

    getCurrentBatchList().splice(index, 1);

    saveSettings();

    showSettingsTab();
}
function changeSettingsBatchType(type) {

    appSettings.selectedBatchType = type;

    saveSettings();

    showSettingsTab();
}
function addBatch() {

    getCurrentBatchList().push({
        name: "New Batch",
        from: "00:00",
        to: "00:00"
    }); 

    saveSettings();

    showSettingsTab();
}
