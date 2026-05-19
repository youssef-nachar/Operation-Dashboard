let recentOrders = [];
function showNewOrderTab() {
document.getElementById("dashboardHeader").style.display="none"
    const currentWarehouse = localStorage.getItem("currentWarehouse");

    if (currentWarehouse === "Packing Station") {        
        const searchInput = document.getElementById("newOrderSearch");
        document.getElementById("hashtag").style.display = "none";
        document.getElementById("newOrderNumber").style.display = "none";
    }
    document.querySelectorAll(".main > div").forEach(div => {
        if (div.id !== "newOrderTab") div.classList.add("hidden");
    });
    document.getElementById("newOrderTab").classList.remove("hidden");

    listenToOrders(); // 🔥 تحديث الطلبات دائماً

    const warehouseInput = document.getElementById("newWarehouseName");
    const userWarehouse = localStorage.getItem("currentWarehouse");

    if (userWarehouse) {

        warehouseInput.value = userWarehouse;

        if (userWarehouse === "manager") {
            warehouseInput.readOnly = false;
        } else {
            warehouseInput.readOnly = true;
        }

    }

    setTodayForNewOrder();
}
window.toggleMenu = function (e) {
    e.stopPropagation();

    const menu = document.getElementById("quickDateMenu");
    if (!menu) return;

    menu.classList.toggle("hidden");
};

document.addEventListener("click", function (e) {
    const menu = document.getElementById("quickDateMenu");
    if (!menu) return;

    if (!menu.contains(e.target) && !e.target.closest(".three-dots")) {
        menu.classList.add("hidden");
    }
});
function setTodayForNewOrder() {
    const today = new Date().toISOString().slice(0, 10);
    document.getElementById("newOrderDate").value = today;
}
// =============================
// SIMPLE ENCRYPTION
// =============================
function simpleEncrypt(text) {
    return btoa(text); // Base64 encode
}

function simpleDecrypt(text) {
    return atob(text);
}
function saveNewOrder() {

    const orderNo = document
        .getElementById("newOrderNumber")
        .value.trim()
        .toUpperCase();

    const warehouseInput = document
        .getElementById("newWarehouseName")
        .value.trim()
        .toUpperCase();

    const date = document
        .getElementById("newOrderDate").value;

    if (!orderNo || !warehouseInput || !date) {
        // showToast("⚠️ Please fill all fields");
        return;
    }

    const ordersRef = ref(db, "orders");

   runTransaction(ordersRef, (orders) => {

    if (!orders) orders = {};

    let existingKey = null;

    Object.entries(orders).forEach(([key, order]) => {
        if (order.orderNo === orderNo) {
            existingKey = key;
        }
    });

    if (existingKey) {

        const order = orders[existingKey];

        const exists = order.warehouses?.some(
            w => w.base.toUpperCase() === warehouseInput
        );

        if (exists) return orders;

        order.warehouses.push({
            base: warehouseInput,
            packed: false,
            receivedTime: new Date().toISOString()
        });

        orders[existingKey] = order;

    } else {

        const newKey = push(ref(db, "orders")).key;

        orders[newKey] = {
            orderNo: orderNo,
            date: date,
            createdAt: new Date().toISOString(),
            history: [
                {
                    action: "created",
                    date: new Date().toISOString(),
                    by: localStorage.getItem("currentWarehouse")
                }
            ],
            warehouses: [
                {
                    base: warehouseInput,
                    packed: false,
                    receivedTime: new Date().toISOString()
                }
            ],
            status: "pending"
        };
    }

    return orders;
}).then(() => {
        // showToast("✅ Order saved");
        clearNewOrderForm();
    });

}
let visibleCount = 300;
// 🔥 
function buildRecentOrders() {

    if (!allOrders || !allOrders.length) {
        recentOrders = [];
        return;
    }

    // ترتيب حسب وقت الإنشاء
    const sorted = allOrders
        .slice()
        .sort((a, b) => {

 const aDate = new Date(a.createdAt || a.date).getTime();
const bDate = new Date(b.createdAt || b.date).getTime();
            return bDate - aDate; // الأحدث أولاً
        });

    recentOrders = sorted; // كل الطلبات
}
let showOnlyPending = false;
function togglePendingFilter() {

    showOnlyPending = !showOnlyPending;

    const btn = document.getElementById("pendingToggleBtn");

    const count = getPendingCount(); // ✅ العدد

    if (showOnlyPending) {
        btn.style.background = "#f59e0b";
        btn.textContent = `Showing Pending (${count})`;
    } else {
        btn.style.background = "#020617";
        btn.textContent = `Show Pending Only (${count})`;
    }

    renderRecentOrders();
}
function togglePartialFilter() {

    showOnlyPartial = !showOnlyPartial;

    const btn = document.getElementById("partialToggleBtn");

    const count = getPartialCount();

    if (showOnlyPartial) {
        btn.style.background = "#f97316";
        btn.textContent = `Showing Partial (${count})`;
    } else {
        btn.style.background = "#020617";
        btn.textContent = `Show Partial Only (${count})`;
    }

    renderRecentOrders();
}
function getPartialCount() {
    const base = getBaseFilteredOrders();
    return base.filter(o => o.status === "partial").length;
}
function toggleReceivedFilter() {

    showOnlyReceived = !showOnlyReceived;

    const btn = document.getElementById("receivedToggleBtn");

    const count = getReceivedCount();

    if (showOnlyReceived) {
        btn.style.background = "#22c55e";
        btn.textContent = `Showing Received (${count})`;
    } else {
        btn.style.background = "#020617";
        btn.textContent = `Show Received (${count})`;
    }

    renderRecentOrders();
}
function getBaseFilteredOrders() {

    const currentWarehouse = localStorage.getItem("currentWarehouse");

    const DEFAULT_START = "2026-02-01"; // 🔥 هنا

    return recentOrders.filter(order => {

        const orderDate = getOrderDate(order);

        // 🔥 فلترة من تاريخ معين
        if (orderDate < DEFAULT_START) return false;
if (selectedDateFilter) {
    const orderDate = getOrderDate(order);

    const keepOld =
        order.status === "pending" ||
        order.status === "partial" ||
        order.status === "completed"; // in-packing

    if (orderDate !== selectedDateFilter && !keepOld) {
        return false;
    }
}
        if (currentWarehouse === "Packing Station" && order.status === "distributed") {
            return false;
        }

        return true;
    });
}
function getReceivedCount() {
    const base = getBaseFilteredOrders();

    return base.filter(order =>
        order.status !== "distributed" &&
        order.status !== "ready_to_distribute" && // 🔥 مهم
        order.warehouses?.every(w => w.packed === true)
    ).length;
}
function getPendingCount() {
    const base = getBaseFilteredOrders();
    return base.filter(o => o.status === "pending").length;
}
function renderRecentOrders() {

    const role = localStorage.getItem("userRole");
    const container = document.getElementById("newOrdersList");
    if (!container) return;
    if (role !== "packing" && role !== "manager") {
        const btn = document.getElementById("commentsToggleBtn");
        document.getElementById('receivedToggleBtn').style.display="none";
        document.getElementById('partialToggleBtn').style.display="none"
        if (btn) btn.style.display = "none";
    }
    if (role !== "packing" && role !== "manager") {
        const pendingBtn = document.getElementById("pendingToggleBtn");
        
        if (pendingBtn) pendingBtn.style.display = "none";
        if (pendingBtn) {
            const count = getPendingCount();

            if (showOnlyPending) {
                pendingBtn.textContent = `Showing Pending (${count})`;
            } else {
                pendingBtn.textContent = `Show Pending Only (${count})`;
            }
        }

    }

    container.innerHTML = "";

const currentWarehouse = localStorage.getItem("currentWarehouse");
const sortedOrders = [...recentOrders].sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt);
});

let filteredOrders = getBaseFilteredOrders();
filteredOrders = filteredOrders.filter(order => {

if (selectedDateFilter) {
    const orderDate = getOrderDate(order);

    const keepOld =
        order.status === "pending" ||
        order.status === "partial" ||
        order.status === "completed"; // In-Packing

    if (orderDate !== selectedDateFilter && !keepOld) {
        return false;
    }
}
    if (role == "packing" && order.status === "distributed") {
        return false;
    }   if (role == "manager" && order.status === "distributed") {
        return false;
    }

    if (showOnlyPending && order.status !== "pending" && order.status !== "partial") return false;

    if (showOnlyPartial && order.status !== "partial") return false;

    if (showOnlyComments && !(order.comment && order.comment.trim() !== "")) return false;

    if (showOnlyReceived) {
        const hasReceived = order.warehouses?.every(w => w.packed === true);
        if (!hasReceived) return false;
    }
    if (showOnlyDistributed &&
    order.status !== "distributed" &&
    order.status !== "ready_to_distribute") return false;

    return true;
});
    // 🔥 عرض فقط عدد محدد
    const visibleOrders = filteredOrders.slice(0, visibleCount);

    visibleOrders.forEach(order => {
        const card = document.createElement("div");

        card.style.cssText = `
    background:#020617;
    border:1px solid #1f2937;
    padding:14px;
    border-radius:14px;
    transition:.2s;
    height: fit-content;
`;


const statusColor =
    order.status === "distributed" ? "#22c55e" :
    order.status === "ready_to_distribute" ? "#3b82f6" : // 🔥 أزرق واضح
    order.status === "completed" ? "#22c55e" :
    order.status === "partial" ? "#f59e0b" :
    order.status === "canceled" ? "#ef4444" :
    "#f59e0b";

        card.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:10px;">

            <!-- Header -->
            <div style="display:flex;justify-content:space-between;align-items:center">
                
                <div style="display:flex;flex-direction:column">
                    <span style="font-weight:700;font-size:15px;letter-spacing:.5px">
                        ${order.orderNo}
                    </span>
                    <span style="font-size:11px;opacity:.5">
                        ${order.createdAt ? new Date(order.createdAt).toLocaleString() : order.date}
                    </span>
                </div>

             <div style="display:flex;align-items:center;gap:6px">

    ${role === "manager" ? `
    <button onclick="showOrderHistory('${order.orderNo}')"
    style="
        background:#0ea5e9;
        border:none;
        padding:5px 10px;
        border-radius:6px;
        cursor:pointer;
        font-size:11px;
        font-weight:600;
        color:white;
    ">
        Info
    </button>
    ` : ""}

    <button onclick="openEditOrder('${order.orderNo}')"
    style="
        background:linear-gradient(135deg,#3b82f6,#2563eb);
        border:none;
        padding:5px 10px;
        border-radius:6px;
        cursor:pointer;
        font-size:11px;
        font-weight:600;
        color:white;
        box-shadow:0 0 8px #3b82f666;
    ">
        Edit
    </button>

<div style="display:flex;align-items:center;gap:6px">

    <span style="
        background:${statusColor};
        padding:5px 12px;
        border-radius:20px;
        font-size:11px;
        font-weight:700;
        color:black;
        box-shadow:0 0 10px ${statusColor}55;
    ">
        ${order.status}
    </span>

    ${order.status === "canceled" ? `
        <button onclick="reopenOrder('${order.orderNo}')"
        style="
            background:#22c55e;
            border:none;
            padding:5px 10px;
            border-radius:6px;
            cursor:pointer;
            font-size:11px;
            font-weight:700;
            color:black;
        ">
            Reopen
        </button>
    ` : ""}

</div>

</div>
            </div>

            <!-- Warehouses -->
            <div style="
                display:flex;
                flex-wrap:wrap;
                gap:6px;
            ">

                ${order.warehouses.map(w => {

            const role = localStorage.getItem("userRole");

const isPacking = 
    (currentWarehouse === "Packing Station" || role === "manager") 
    && !w.packed;

            return `
                    <div style="
                        background:#0f172a;
                        border:1px solid #1f2937;
                        padding:6px 8px;
                        border-radius:8px;
                        display:flex;
                        align-items:center;
                        gap:6px;
                    ">

                        <span style="font-size:11px;font-weight:600">
                            📍 ${w.base.toUpperCase()}
                        </span>

                        ${w.packed
                    ? `<span style="color:#22c55e;font-size:11px">✔</span>`
                    : isPacking
                        ? `
                                <button onclick="markWarehousePacking('${order.orderNo}', \`${w.base}\`)"
                                style="
                                background:linear-gradient(135deg,#22c55e,#16a34a);
                                border:none;
                                padding:4px 8px;
                                border-radius:6px;
                                font-size:10px;
                                font-weight:700;
                                cursor:pointer;
                                color:white;
                                box-shadow:0 0 8px #22c55e66;
                                ">
                                Receive
                                </button>
                                `
                        : `<span style="color:#f59e0b;font-size:11px">Pending</span>`
                }

                    </div>
                    `;

        }).join("")}

            </div>

            <!-- Comment -->
            ${order.comment ? `
            <div style="
                font-size:12px;
                color:#38bdf8;
                background:#020617;
                padding:6px 8px;
                border-radius:8px;
                border:1px dashed #1f2937;
            ">
                💬 ${order.comment}
            </div>
            ` : ""}

        </div>
        `;

        // ✨ Hover Effect
        card.onmouseenter = () => {
            card.style.transform = "scale(1.01)";
            card.style.boxShadow = "0 0 20px #0ea5e933";
        };

        card.onmouseleave = () => {
            card.style.transform = "scale(1)";
            card.style.boxShadow = "none";
        };

        container.appendChild(card);
    });
    // زر عرض المزيد
    if (filteredOrders.length > visibleCount) {

        const loadMoreBtn = document.createElement("button");

        loadMoreBtn.textContent = "Show More →";
        loadMoreBtn.style.cssText = `
        width:100%;
        padding:10px;
        margin-top:10px;
        background:#0ea5e9;
        border:none;
        border-radius:8px;
        color:white;
        cursor:pointer;
        font-weight:600;
    `;

        loadMoreBtn.onclick = () => {
            visibleCount += 10;
            renderRecentOrders();
        };

        container.appendChild(loadMoreBtn);
    }
    document.getElementById("newOrderPreview").classList.remove("hidden");


const exportBtn = document.getElementById("exportBtn");

if (exportBtn) {
    if (showOnlyPending) {
        exportBtn.textContent = "Export Pending";
    } 
    else if (showOnlyReceived) {
        exportBtn.textContent = "Export Received";
    }
    else if (showOnlyComments) {
        exportBtn.textContent = "Export Comments";
    }
       else if (showOnlyPartial) {
        exportBtn.textContent = "Export partial";
    }
    
    else {
        exportBtn.textContent = "Export All";
    }
}

const receivedBtn = document.getElementById("receivedToggleBtn");
if (receivedBtn) {
    const count = getReceivedCount();

    if (showOnlyReceived) {
        receivedBtn.textContent = `Showing Received (${count})`;
        receivedBtn.style.background = "#22c55e";
    } else {
        receivedBtn.textContent = `Show Received (${count})`;
        receivedBtn.style.background = "#020617";
    }
}
updateFilterButtonsCounts();
updateFilterButtonsCounts();
}

function reopenOrder(orderNo) {

    const ordersRef = ref(db, "orders");

    get(ordersRef).then(snapshot => {

        snapshot.forEach(child => {

            const order = child.val();

            if (order.orderNo === orderNo) {

                update(ref(db, "orders/" + child.key), {

                    status: "pending",

                    history: [
                        ...(order.history || []),
                        {
                            action: "reopened",
                            date: new Date().toISOString(),
                            by: localStorage.getItem("currentWarehouse")
                        }
                    ]

                });

            }

        });

    });

}


function updateFilterButtonsCounts() {

    const pendingBtn = document.getElementById("pendingToggleBtn");
    const partialBtn = document.getElementById("partialToggleBtn");
    const receivedBtn = document.getElementById("receivedToggleBtn");

    if (!recentOrders) return;

    const pendingCount = getPendingCount();
    const partialCount = getPartialCount();
    const receivedCount = getReceivedCount();

    // ================= Pending =================
    if (pendingBtn) {
        if (showOnlyPending) {
            pendingBtn.textContent = `Showing Pending (${pendingCount})`;
            pendingBtn.style.background = "#f59e0b";
        } else {
            pendingBtn.textContent = `Show Pending Only (${pendingCount})`;
            pendingBtn.style.background = "#020617";
        }
    }

    // ================= Partial =================
    if (partialBtn) {
        if (showOnlyPartial) {
            partialBtn.textContent = `Showing Partial (${partialCount})`;
            partialBtn.style.background = "#f97316";
        } else {
            partialBtn.textContent = `Show Partial Only (${partialCount})`;
            partialBtn.style.background = "#020617";
        }
    }

    // ================= Received =================
    if (receivedBtn) {
        if (showOnlyReceived) {
            receivedBtn.textContent = `Showing Received (${receivedCount})`;
            receivedBtn.style.background = "#22c55e";
        } else {
            receivedBtn.textContent = `Show Received (${receivedCount})`;
            receivedBtn.style.background = "#020617";
        }
    }
}

function listenToOrders() {

    const ordersRef = ref(db, "orders");

    onValue(ordersRef, (snapshot) => {

        const data = snapshot.val();

        if (!data) {
            allOrders = [];
            recentOrders = [];
            renderRecentOrders();
    updateFilterButtonsCounts();
            updateDashboard();
            renderReadyOrders();
            return;

        }
        let allOrdersMap = {};
        // تحويل Firebase object الى array
        allOrdersMap = data;
        const firebaseOrders = Object.values(data);
        const currentWarehouse = localStorage.getItem("currentWarehouse");
        const role = localStorage.getItem("userRole");

        // 🔥 دمج الطلبات التي لها نفس الرقم
        let mergedOrders = mergeOrdersByNumber(firebaseOrders);

        // 🔥 المدير يرى كل الطلبات
        if (role === "manager" || currentWarehouse === "Packing Station") {

            // يرى كل الطلبات
allOrders = mergeOrdersByNumber([
    ...firebaseOrders,
    ...localOrders
]);            

        } else {

            const normalizedUserWH = currentWarehouse.trim().toUpperCase();

            allOrders = mergedOrders.filter(order =>
                order.warehouses?.some(w =>
                    w.base?.trim().toUpperCase() === normalizedUserWH
                )
            );

        }
allOrders = mergedOrders.sort((a, b) =>
    new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
);
        // 🔥 تحديث الحالة وعدد المستودعات
        allOrders.forEach(order => {
            order.status = resolveOrderStatus(order);
            order.warehouseCount = order.warehouses ? order.warehouses.length : 0;
        });

        // 🔥 بناء recent orders
        buildRecentOrders();
        loadDistributedOrders();

        renderRecentOrders();

        updateDashboard();


    });

}
function clearNewOrderForm() {

    document.getElementById("newOrderNumber").value = "";

    // لا تمسح المستودع إذا كان من المستخدم المسجل
    const warehouseInput = document.getElementById("newWarehouseName");
    const userWarehouse = localStorage.getItem("currentWarehouse");

    if (userWarehouse) {
        warehouseInput.value = userWarehouse;
        warehouseInput.readOnly = true;
    } else {
        warehouseInput.value = "";
    }

    // أعد ضبط التاريخ لليوم
    setTodayForNewOrder();
}
function mergeOrdersByNumber(orders) {

    const map = {};

    orders.forEach(order => {

        const orderNo = (order.orderNo || "").trim().toUpperCase();

        if (!map[orderNo]) {
            map[orderNo] = {
                ...order,
                warehouses: []
            };
        }
if (order.status) {
    map[orderNo].status = order.status;
}
        (order.warehouses || []).forEach(w => {

            const base = (w.base || "").trim().toUpperCase();

            // نتحقق فقط من التكرار الحقيقي
            const exists = map[orderNo].warehouses.some(x =>
                (x.base || "").trim().toUpperCase() === base
            );

            if (!exists) {
                map[orderNo].warehouses.push(w);
            }

        });

    });

    return Object.values(map);

}
function showOrderPreview(order) {

    const previewContainer = document.getElementById("newOrderPreview");
    const list = document.getElementById("newOrdersList");

    const orderCard = document.createElement("div");

    orderCard.style.cssText = `
        background:#0f172a;
        border:1px solid #1f2937;
        padding:16px;
        border-radius:14px;
        margin-bottom:12px;
        animation:fadeIn .3s ease;
    `;
    const statusText = order.status === "in-packing" ? "In-Packing" : "Pending";
    const statusColor = order.status === "in-packing" ? "#22c55e" : "#f59e0b";
    orderCard.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center">

            <div>
                <div style="font-size:15px;font-weight:600">
                    ${order.orderNo}
                </div>

                <div style="font-size:12px;opacity:.7;margin-top:4px">
                    📅 ${order.date} &nbsp; ⏰ ${order.time || ""}
                </div>

                <div class="saved-comment" style="
                    margin-top:6px;
                    font-size:12px;
                    color:#22c55e;
                    font-weight:600;
                ">
                    ${order.comment ? "📝 " + order.comment : ""}
                </div>

                <div style="
                    font-size:12px;
                    margin-top:6px;
                    display:inline-block;
                    background:#1e293b;
                    padding:4px 10px;
                    border-radius:8px;
                    font-weight:600;
                    color:#38bdf8;
                ">
                </div>
            </div>

            <span style="
    background:${statusColor};
    padding:6px 14px;
    border-radius:20px;
    font-size:11px;
    font-weight:600;
">
    ${statusText}
</span>
        </div>

        <div style="margin-top:12px">
            <textarea 
                placeholder="Write comment..."
                style="
                    width:100%;
                    background:#020617;
                    border:1px solid #1f2937;
                    border-radius:10px;
                    padding:8px;
                    color:white;
                    font-size:13px;
                    resize:vertical;
                    min-height:50px;
                    outline:none;
                "
            ></textarea>

            <button style="
                margin-top:8px;
                background:#22c55e;
                border:none;
                padding:6px 14px;
                border-radius:8px;
                font-size:12px;
                font-weight:600;
                cursor:pointer;
            ">
                Save
            </button>
        </div>
    `;

    const textarea = orderCard.querySelector("textarea");
    const saveBtn = orderCard.querySelector("button");
    const savedCommentDiv = orderCard.querySelector(".saved-comment");

    // تحميل التعليق السابق داخل التكست
    textarea.value = order.comment || "";

    saveBtn.addEventListener("click", function () {

        const value = textarea.value.trim();

        order.comment = value;

        savedCommentDiv.textContent = value ? "📝 " + value : "";

        saveCommentsToStorage();

        textarea.value = "";

        // showToast("💾 Comment saved");
    });

    list.prepend(orderCard);
    previewContainer.classList.remove("hidden");

    const maxItems = 10;
    if (list.children.length > maxItems) {
        list.removeChild(list.lastChild);
    }
}
function resolveOrderStatus(order) {
    if ((order.comment || "").toLowerCase().includes("canceled")
        && !distributedOrdersMap[order.orderNo]) {
        return "canceled_before_delivery";
    }
    // 1️⃣ Canceled
  if (canceledOrdersSet.has(order.orderNo)) {
        return "canceled";
    }

    if (order.status === "canceled") {
        return "canceled";
    }

    if (order.status === "canceled_before_delivery") {
        return "canceled_before_delivery";
    }
// 1️⃣ Distributed أولاً
if ( order.status === "distributed" ||distributedOrdersMap[order.orderNo] ||order.distributedTime) {
    return "distributed";
}

// 2️⃣ Ready بعدها
if (order.status === "ready_to_distribute" || order.readyToDistribute === true) {
    return "ready_to_distribute";
}

    const warehouseCount = order.warehouses.length;

    const packedCount = order.warehouses.filter(w => w.packed).length;

    // 3️⃣ Pending
    if (packedCount === 0) {
        return "pending";
    }

    // 4️⃣ Partial
    if (packedCount < warehouseCount) {
        return "partial";
    }

    // 5️⃣ In-Packing (كل المستودعات انتهت)
    return "completed";
}
// مثال: تحديث كل الطلبات قبل عرضها
allOrders.forEach(order => {
    order.status = resolveOrderStatus(order);
});
function showOrderHistory(orderNo) {
    const role = localStorage.getItem("userRole");
    if (role !== "manager") {
        // showToast("⛔ Access denied");

        return;
    }

    const order = allOrders.find(o => o.orderNo === orderNo);
    if (!order) return;

    const history = order.history || [];
    let html = "";

    if (!history.length) {
        html = `<p>No history found</p>`;
    } else {
        // لمنع تكرار المستودعات
        const seenWarehouses = new Set();

        // ترتيب التاريخ من الأحدث للأقدم
        history.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(h => {
            let actionText = "";

            if (h.action === "created") {
                actionText = `🟢 Created`;
            } else if (h.action === "edited") {

                let commentChange = "";

                if (h.oldComment !== h.newComment) {
                    commentChange = `
            <div style="margin-top:6px;font-size:12px;color:#fbbf24">
                💬 Comment:
                <br>
                <span style="color:#ef4444">Old:</span> ${h.oldComment || "-"}
                <br>
                <span style="color:#22c55e">New:</span> ${h.newComment || "-"}
            </div>
        `;
                }

                actionText = `
        ✏️ Edited (${h.oldOrderNo} → ${h.newOrderNo})
        ${commentChange}
    `;
            }
            else if (h.action === "packed") {
                actionText = `📦 Packed in ${h.warehouse}`;
            }

            // عرض معلومات المستودعات مرة واحدة فقط
            if (order.warehouses && order.warehouses.length) {
                html += `<div style="margin-bottom:10px; display:flex; flex-direction:column; gap:6px;">`;
                order.warehouses.forEach(w => {
                    const key = w.base.trim().toLowerCase();
                    if (seenWarehouses.has(key)) return;
                    seenWarehouses.add(key);

                    html += `
                    <div style="
                        background:#020617;
                        padding:10px;
                        border-radius:8px;
                        border:1px solid #1f2937;
                        font-size:12px;
                        color:white;
                    ">
                        <div style="font-weight:600">📍 ${w.base.toUpperCase()}</div>
                        <div style="opacity:0.7; font-size:11px; margin-top:3px;">
                            🕒 Entered: ${w.receivedTime ? new Date(w.receivedTime).toLocaleString() : "-"}
                        </div>
                    </div>
                    `;
                });
                html += `</div>`;
            }

            // عرض سجل الحدث
            html += `
            <div style="
                background:#0f172a;
                padding:10px;
                border-radius:8px;
                margin-bottom:8px;
                border:1px solid #1f2937;
                font-size:13px;
                color:white;
            ">
                <div style="font-weight:600">${actionText}</div>
                <div style="opacity:0.6; font-size:11px; margin-top:2px;">${new Date(h.date).toLocaleString()}</div>
                <div style="color:#38bdf8; font-size:11px; margin-top:2px;">By: ${h.by || "-"}</div>
            </div>
            `;
        });
    }

    document.getElementById("historyContent").innerHTML = html;
    document.getElementById("historyModal").classList.remove("hidden");
}
function closeHistoryModal() {
    document.getElementById("historyModal").classList.add("hidden");
}
document.getElementById("historyModal").addEventListener("click", function (e) {
    if (e.target.id === "historyModal") {
        closeHistoryModal();
    }
});
function openEditOrder(orderNo) {
    const role = localStorage.getItem("userRole");
    const order = allOrders.find(o => o.orderNo === orderNo);
    if (!order) return;
    if (order.status === "canceled_before_delivery") {
        // showToast("⛔ Cannot edit canceled order");
        return;
    }

    document.getElementById("editOrderNumber").value = order.orderNo;
    document.getElementById("editOrderComment").value = order.comment || "";

    document.getElementById("editOrderModal").classList.remove("hidden");
const orderInput = document.getElementById("editOrderNumber");

const deleteBtn = document.getElementById("deleteOrderBtn");

if (role === "manager") {
    orderInput.readOnly = false;
    deleteBtn.style.display = "block"; // ✅ يظهر
} else {
    orderInput.readOnly = true;
    deleteBtn.style.display = "none"; // ❌ مخفي
}
    window.editingOrderNo = orderNo;
    setTimeout(() => {
        document.getElementById("editOrderNumber").focus();
    }, 100);
}
function closeEditModal() {
    document.getElementById("editOrderModal").classList.add("hidden");
}
function deleteOrder() {

    const role = localStorage.getItem("userRole");

    if (role !== "manager") {
        alert("Not allowed");
        return;
    }

    if (!confirm("⚠️ Delete this order permanently?")) return;

    const ordersRef = ref(db, "orders");

    get(ordersRef).then(snapshot => {

        snapshot.forEach(child => {

            const data = child.val();

            if (data.orderNo === window.editingOrderNo) {

                remove(ref(db, "orders/" + child.key))
                    .then(() => {
                        closeEditModal();
                        renderRecentOrders();
                        updateDashboard();
                    });

            }

        });

    });

}
document.getElementById("deleteOrderBtn")
    .addEventListener("click", deleteOrder);
function saveEditedOrder() {

    const newOrderNo = document.getElementById("editOrderNumber").value.trim();
    const comment = document.getElementById("editOrderComment").value.trim();

    const ordersRef = ref(db, "orders");

    get(ordersRef).then(snapshot => {

        snapshot.forEach(child => {

            const data = child.val();

            if (data.orderNo === window.editingOrderNo) {

                update(ref(db, "orders/" + child.key), {
                    orderNo: newOrderNo,
                    comment: comment,
                    history: [
                        ...(data.history || []),
                        {
                            action: "edited",
                            date: new Date().toISOString(),
                            by: localStorage.getItem("currentWarehouse"),
                            oldOrderNo: data.orderNo,
                            newOrderNo: newOrderNo,
                            oldComment: data.comment || "",   // ✅ القديم
                            newComment: comment              // ✅ الجديد
                        }
                    ]
                });

            }

        });

    });

    closeEditModal();

    // showToast("Order updated");

}
function closeEditIfOutside(e) {

    if (e.target.id === "editOrderModal") {
        closeEditModal();
    }

}
function cancelOrder() {

    if (!confirm("Cancel this order ?")) return;

    const ordersRef = ref(db, "orders");

    get(ordersRef).then(snapshot => {

        snapshot.forEach(child => {

            const data = child.val();

            if (data.orderNo === window.editingOrderNo) {

                update(ref(db, "orders/" + child.key), {

                    status: "canceled",

                    history: [
                        ...(data.history || []),
                        {
                            action: "canceled",
                            date: new Date().toISOString(),
                            by: localStorage.getItem("currentWarehouse")
                        }
                    ]

                });

            }

        });

    });

    closeEditModal();
}
function markInPacking(orderNo) {

    const ordersRef = ref(db, "orders");

    onValue(ordersRef, (snapshot) => {

        const data = snapshot.val();

        Object.entries(data).forEach(([key, order]) => {

            if (order.orderNo === orderNo) {

                update(ref(db, "orders/" + key), {
                    status: "in-packing",
                    packingTime: new Date().toISOString()
                });

            }

        });

    }, { onlyOnce: true });

}
function markWarehousePacking(orderNo, warehouseName) {
    const order = allOrders.find(o => o.orderNo === orderNo);

    if (!order ||
        order.status === "canceled" ||
        order.status === "canceled_before_delivery") {
        return;
    }
    openConfirmModal(
        `Receive order <b>${orderNo}</b> in <b>${warehouseName}</b>?`,
        () => {

            const ordersRef = ref(db, "orders");

            onValue(ordersRef, (snapshot) => {

                const data = snapshot.val();

                Object.entries(data).forEach(([key, order]) => {

                    if (order.orderNo === orderNo) {

                        const updatedWarehouses = order.warehouses.map(w => {

                            if (normalizeWarehouse(w.base).base === normalizeWarehouse(warehouseName).base) {
                                return {
                                    ...w,
                                    packed: true,
                                    packingTime: new Date().toISOString()
                                };
                            }

                            return w;
                        });

                        update(ref(db, "orders/" + key), {
                            warehouses: updatedWarehouses,
                            history: [
                                ...(order.history || []),
                                {
                                    action: "packed",
                                    warehouse: warehouseName,
                                    date: new Date().toISOString(),
                                    by: "Packing Station"
                                }
                            ]
                        });

                    }

                });

            }, { onlyOnce: true });

        });
}
function openConfirmModal(message, onConfirm) {

    const modal = document.getElementById("confirmModal");
    const text = document.getElementById("confirmText");
    const okBtn = document.getElementById("confirmOk");
    const cancelBtn = document.getElementById("confirmCancel");

    const btnText = document.getElementById("btnText");
    const loader = document.getElementById("btnLoader");
    const icon = document.getElementById("confirmIcon");
    const sound = document.getElementById("successSound");

    text.innerHTML = message;
    modal.classList.remove("hidden");

    function reset() {
        modal.classList.add("hidden");
        loader.classList.add("hidden");
        btnText.style.display = "inline";
        okBtn.classList.remove("loading");
        icon.innerHTML = "📦";
        icon.classList.remove("success");
    }

    cancelBtn.onclick = reset;

    modal.onclick = (e) => {
        if (e.target === modal) reset();
    };

    okBtn.onclick = async () => {

        // start loading
        loader.classList.remove("hidden");
        btnText.style.display = "none";
        okBtn.classList.add("loading");

        // simulate or wait actual action
        await onConfirm();

        // success state
        loader.classList.add("hidden");
        icon.innerHTML = "✔";
        icon.classList.add("success");

        // sound.play().catch(() => { });

        setTimeout(() => {
            reset();
        }, 1000);
    };

}
function showPackingSelection(order) {

    const modal = document.getElementById("orderDetails");

    const html = `
<h3>Select Warehouse for Packing</h3>

<div style="display:flex;gap:10px;flex-wrap:wrap">

${order.warehouses.map(w => {
        return `
<button onclick="markWarehousePacking(${JSON.stringify(order.orderNo)}, ${JSON.stringify(w.base)})"
style="
padding:10px 16px;
background:#22c55e;
border:none;
border-radius:8px;
cursor:pointer;
font-weight:600;
">
${w.base.toUpperCase()}
</button>
`;
    }).join("")}

</div>
`;

    document.getElementById("orderList").innerHTML = html;

    modal.classList.remove("hidden");
}
function openPackingOrder(order) {

    if (order.warehouses.length === 1) {

        markWarehousePacking(order.orderNo, order.warehouses[0].base);

    }

    else {

        showPackingSelection(order);

    }

}

function log(msg) {
    const el = document.getElementById("debug") || (() => {
        const d = document.createElement("div");
        d.id = "debug";
        d.style.position = "fixed";
        d.style.bottom = "0";
        d.style.width = "100%";
        d.style.height = "150px";
        d.style.background = "#000";
        d.style.color = "#0f0";
        d.style.overflow = "auto";
        d.style.fontSize = "12px";
        d.style.padding = "5px";
        document.body.appendChild(d);
        return d;
    })();
    el.innerHTML += msg + "<br>";
}
let receivingOrders = new Set();

function receiveInPacking(orderNo) {
    const order = allOrders.find(o => o.orderNo === orderNo);

    if (!order ||
        order.status === "canceled" ||
        order.status === "canceled_before_delivery") {

        const btn = document.getElementById("rec");
        if (btn) btn.style.display = "none"; // ✅ الصحيح

        return; // 🔥 مهم جداً
    }
    if (receivingOrders.has(orderNo)) return;

    receivingOrders.add(orderNo);

    const orderEntry = Object.entries(allOrdersMap)
        .find(([key, order]) => order.orderNo === orderNo);

    if (!orderEntry) {
        receivingOrders.delete(orderNo);
        return;
    }

    const [key] = orderEntry;

    update(ref(db, "orders/" + key), {
        status: "completed",
        packingReceivedTime: new Date().toISOString()
    })
        .finally(() => {
            receivingOrders.delete(orderNo);
        });

}
function toggleCommentsFilter() {

    showOnlyComments = !showOnlyComments;

    const btn = document.getElementById("commentsToggleBtn");

    if (showOnlyComments) {
        btn.style.background = "#22c55e";
        btn.textContent = "Showing Comments Only";
    } else {
        btn.style.background = "#020617";
        btn.textContent = "Show Comments Only";
    }

    renderRecentOrders(); // 🔥 إعادة رسم
}
function renderOrders() {

    const container = document.getElementById("ordersTableBody");
    container.innerHTML = "";

    if (orders.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;padding:20px;color:#888">
                    No Orders Yet
                </td>
            </tr>
        `;
        return;
    }

    orders
        .sort((a, b) => b.id - a.id)
        .forEach(order => {

            const statusColor =
                order.status === "Pending" ? "#f39c12" :
                    order.status === "Approved" ? "#2ecc71" :
                        order.status === "Rejected" ? "#e74c3c" :
                            "#3498db";

            const row = `
                <tr style="transition:.2s">
                    <td>#${order.id}</td>
                    <td>${order.warehouse}</td>
                    <td>${order.item}</td>
                    <td>${order.qty}</td>
                    <td>
                        <span style="
                            background:${statusColor};
                            color:white;
                            padding:4px 10px;
                            border-radius:20px;
                            font-size:12px;
                            font-weight:600">
                            ${order.status}
                        </span>
                    </td>
                    <td>${new Date(order.date).toLocaleString()}</td>
                </tr>
            `;

            container.innerHTML += row;
        });
}
const currentWarehouse = localStorage.getItem("currentWarehouse");
function autoMoveToPacking() {

    const currentWarehouse = localStorage.getItem("currentWarehouse");

    if (currentWarehouse !== "Packing Station") return;

    const ordersRef = ref(db, "orders");

    onValue(ordersRef, (snapshot) => {

        const data = snapshot.val();
        if (!data) return;

        Object.entries(data).forEach(([key, order]) => {

            if (order.status === "pending" && !canceledOrdersSet.has(order.orderNo)) {
                update(ref(db, "orders/" + key), {
                    status: "in-packing",
                    packingTime: new Date().toISOString()
                });

            }

        });

    }, { onlyOnce: true });

}
