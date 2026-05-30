    function getEffectiveDate(order) {

        // Distributed
        if (order.status === "distributed") {
            return distributedOrdersMap[order.orderNo]?.date;
        }

        // Completed (In-Packing)
        if (order.status === "completed") {
            const firstPackedWH = order.warehouses.find(w => w.packed);
            return firstPackedWH?.packingTime || order.date;
        }

        // Pending / Partial
        return order.date;
    }

    function initDate() {
        const today = new Date().toISOString().slice(0, 10);

        dateFrom.value = today;
        dateTo.value = today;

        updateDashboard();
    }

    function applyFilters() {

        const from = dateFrom.value || null;
        const to = dateTo.value || null;

        return allOrders.filter(o => {

            const dateToCheck = getEffectiveDate(o);

            if (!dateToCheck) return false;
            if (from && dateToCheck < from) return false;
            if (to && dateToCheck > to) return false;

            return true;
        });
    }

    window.QuickDate = function (type) {
    const from = document.getElementById("dateFrom");
    const to = document.getElementById("dateTo");

    if (!from || !to) return;

    const today = new Date();

    let fromDate = new Date();
    let toDate = new Date();

    if (type === "today") {
        fromDate = new Date(today);
        toDate = new Date(today);
    }

    else if (type === "yesterday") {
        fromDate = new Date(today);
        fromDate.setDate(today.getDate() - 1);
        toDate = new Date(fromDate);
    }

    else if (type === "week") {
        fromDate = new Date(today);
        fromDate.setDate(today.getDate() - 7);
        toDate = new Date(today);
    }

    else if (type === "month") {
        fromDate = new Date(today);
        fromDate.setMonth(today.getMonth() - 1);
        toDate = new Date(today);
    }

    // تحويل إلى YYYY-MM-DD
    const format = d => d.toISOString().split("T")[0];

    from.value = format(fromDate);
    to.value = format(toDate);

    // تحديث الداشبورد
    if (typeof updateDashboard === "function") {
        updateDashboard();
    }

    // إغلاق القائمة
    const menu = document.getElementById("quickDateMenu");
    if (menu) menu.classList.add("hidden");
};


// FORMAT DATE  
function formatDateForInput(value) {
    if (!value) return null;

    let v = String(value).trim();

    // إزالة الوقت إن وجد  
    // 27/01/2026 12:54:26  -->  27/01/2026  
    v = v.split(" ")[0];

    // YYYY-MM-DD  
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;

    // DD/MM/YYYY  ✅ (الحالة الموجودة في الصورة)  
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(v)) {
        const [d, m, y] = v.split("/");
        return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }

    // DD-MM-YYYY  
    if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(v)) {
        const [d, m, y] = v.split("-");
        return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }

    // YYYY/MM/DD  
    if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(v)) {
        const [y, m, d] = v.split("/");
        return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }

    // fallback  
    const parsed = new Date(value);
    if (!isNaN(parsed)) return parsed.toISOString().slice(0, 10);

    return null;
}
window.DateFilter = function () {
    selectedDateFilter = document.getElementById("ordersDateFilter").value || null;

    visibleCount = 1000;
    renderRecentOrders();
};

// فتح / إغلاق القائمة
window.toggleQuickMenu = function (event) {
    event.stopPropagation();

    const menu = document.getElementById("quickDate");
    if (!menu) return;

    menu.style.display = (menu.style.display === "block") ? "none" : "block";
};

    function QuickMenu(e) {
        e.stopPropagation();
        document.getElementById("quickMenu").classList.toggle("hidden");
    }

    // إغلاق القائمة عند الضغط خارجها  
    

// اختيار تاريخ سريع
window.setQuickDate = function (type) {
    const input = document.getElementById("ordersDateFilter");
    if (!input) return;

    const today = new Date();
    let targetDate = new Date();

    if (type === "today") {
        targetDate = today;
    }

    else if (type === "yesterday") {
        targetDate.setDate(today.getDate() - 1);
    }

    else if (type === "week") {
        targetDate.setDate(today.getDate() - 7);
    }

    else if (type === "month") {
        targetDate.setMonth(today.getMonth() - 1);
    }

    // تحويل للتنسيق الصحيح YYYY-MM-DD
    const formatted = targetDate.toISOString().split("T")[0];
    input.value = formatted;

    // تشغيل الفلتر إذا موجود
    if (typeof DateFilter === "function") {
        DateFilter();
    }

    // إغلاق القائمة
    const menu = document.getElementById("quickDate");
    if (menu) menu.style.display = "none";
};


// Reset الفلتر
window.clearDateFilter = function () {
    const input = document.getElementById("ordersDateFilter");
    if (input) input.value = "";

    if (typeof DateFilter === "function") {
        DateFilter();
    }

    const menu = document.getElementById("quickDate");
    if (menu) menu.style.display = "none";
};
function getOrderDate(order) {

    // 🔥 إذا الطلب في packing → استخدم وقت الدخول للباكينغ
    if (order.status === "in-packing" && order.packingTime) {
        const d = new Date(order.packingTime);
        return d.getFullYear() + "-" +
            String(d.getMonth() + 1).padStart(2, "0") + "-" +
            String(d.getDate()).padStart(2, "0");
    }

    // 🔥 إذا مكتمل → ممكن تستخدم packingReceivedTime
    if (order.status === "completed" && order.packingReceivedTime) {
        const d = new Date(order.packingReceivedTime);
        return d.getFullYear() + "-" +
            String(d.getMonth() + 1).padStart(2, "0") + "-" +
            String(d.getDate()).padStart(2, "0");
    }

    // 🔥 الافتراضي
    const d = new Date(order.createdAt || order.date);
    return d.getFullYear() + "-" +
        String(d.getMonth() + 1).padStart(2, "0") + "-" +
        String(d.getDate()).padStart(2, "0");
}
