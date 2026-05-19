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

    const grouped = {};

    allOrders.forEach(o => {
        if (!o.batch) return;
const batchName = o.batch?.name || "No Batch";

if (!grouped[batchName]) {
    grouped[batchName] = [];
}

grouped[batchName].push(o);
    });

    const html = Object.keys(grouped).map(batchName => {
        return renderSingleBatch(batchName, grouped[batchName]);
    }).join("");

    container.innerHTML = `
        <h3 style="color:#38bdf8">📦 Batches</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
            ${html}
        </div>
    `;
}
let editingReadyOrderNo = null;
function getCurrentBatch() {

    const now = new Date();

    const t1 = new Date();
    t1.setHours(10, 0, 0, 0);

    const t2 = new Date();
    t2.setHours(11, 30, 0, 0);

    const t3 = new Date();
    t3.setHours(13, 0, 0, 0);

    const t4 = new Date();
    t4.setHours(15, 30, 0, 0);

    if (now >= t1 && now < t2) return "Batch 1";
    if (now >= t2 && now < t3) return "Batch 2";
    if (now >= t3 && now < t4) return "Batch 3";
    if (now >= t4) return "Wakilni";

    return "Early"; // قبل 10
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
        display:grid;
        grid-template-columns: 1fr 1.5fr;
        gap:20px;
        padding:20px;
        max-width:1200px;
        margin:auto;
    ">

        <!-- LEFT PANEL (INPUTS) -->
        <div style="
            background:#0f172a;
            border:1px solid #1f2937;
            padding:18px;
            border-radius:16px;
            height:fit-content;
            position:sticky;
            top:20px;
        ">

            <h2 style="margin-bottom:15px;font-size:18px;color:#38bdf8">
                🚚 Ready To Distribute
            </h2>
            <input id="readyOrderInput"
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

            <button onclick="moveToReadyFromInputs()"
                style="
                    width:100%;
                    padding:12px;
                    background:linear-gradient(135deg,#22c55e,#16a34a);
                    border:none;
                    border-radius:10px;
                    font-weight:700;
                    color:white;
                    cursor:pointer;
                    box-shadow:0 0 12px #22c55e55;
                ">
                ➕ Add to Ready List
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
        </div>

        <!-- RIGHT PANEL (TABLE) -->
        <div style="
            background:#0f172a;
            border:1px solid #1f2937;
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
                        name: currentBatch,
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
                            batch: currentBatch
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
                        name: currentBatch,
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
<table style="width:100%;border-collapse:collapse;text-align:center">
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
