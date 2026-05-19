function closeOrderDetails() { orderDetails.classList.add("hidden"); }

// EXPORT TO EXCEL  
function exportOrderDetailsToExcel() {
    
    const currentWarehouse = localStorage.getItem("currentWarehouse");

    let exportOrders = [];


    // 🔥 نفس الفلترة المستخدمة في renderRecentOrders
let sourceOrders = [];

// 🔥 إذا في Order Details مفتوحة → استخدمها
const isDetailsOpen = !document.getElementById("orderDetails").classList.contains("hidden");

if (isDetailsOpen && (lastTodayOrders.length || lastBacklogOrders.length)) {
    sourceOrders = [...lastTodayOrders, ...lastBacklogOrders];
} else {
    // ✅ رجوع لـ recent + الفلاتر
sourceOrders = getBaseFilteredOrders();
}
exportOrders = sourceOrders.filter(order => {
        if (currentWarehouse === "Packing Station" && order.status === "distributed") {
            return false;
        }

        if (showOnlyPending && order.status !== "pending" && order.status !== "partial") return false;

        if (showOnlyComments && !(order.comment && order.comment.trim() !== "")) return false;

        if (showOnlyReceived) {
            const hasReceived = order.warehouses?.every(w => w.packed === true);
            if (!hasReceived) return false;
        }

        return true;
    });

    if (!exportOrders.length) {
        alert("No orders to export!");
        return;
    }

    // إزالة التكرار
    const uniqueMap = {};
    exportOrders.forEach(o => {
        uniqueMap[o.orderNo] = o;
    });

    const unique = Object.values(uniqueMap);

    const headers = ["Order #", "Status", "Warehouses", "Date"];

    const rows = unique.map(o => {

        const whs = o.warehouses
            .map(w => w.base.toUpperCase())
            .join(" | ");

        return [
            o.orderNo,
            o.status,
            whs,
            o.date
        ];
    });

    const csvContent =
        "\uFEFF" +
        [
            headers.join(","),
            ...rows.map(r =>
                r.map(v =>
                    `"${String(v).replace(/"/g, '""')}"`
                ).join(",")
            )
        ].join("\r\n");

    const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);

    const today = new Date().toISOString().slice(0, 10);

    const link = document.createElement("a");
    link.href = url;

    // 🔥 اسم الملف حسب الفلتر
    let fileType = "all";
if (lastType) fileType = lastType;
    if (showOnlyPending) fileType = "pending";
    else if (showOnlyReceived) fileType = "received";
    else if (showOnlyComments) fileType = "comments";

    link.download = `orders_${fileType}_${today}.csv`;

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

