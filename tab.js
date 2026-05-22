function showDashboardHome() {

    document.getElementById("dashboardHeader").style.display = "flex";

    document.getElementById("newOrderTab")
        .classList.add("hidden");

    document.getElementById("teamNotesTab")
        .classList.add("hidden");

    document.getElementById("readyTab")
        .classList.add("hidden");

    // 🔥 أضف هذا
    document.getElementById("returnTab")
        .classList.add("hidden");

    document.getElementById("dsh").style.display = "block";

    document.querySelector(".kpis")
        .classList.remove("hidden");

    document.querySelector(".warehouse-container")
        .classList.remove("hidden");

    document.querySelector(".sales-order")
        .classList.remove("hidden");
}
function loginAsWarehouse(warehouseName) {

    const user = users.find(
        u => u.warehouse === warehouseName
    );

    if (!user) {
        alert("Warehouse user not found");
        return;
    }

    // حفظ بيانات الدخول
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("currentWarehouse", user.warehouse);
    localStorage.setItem("userWarehouse", user.warehouse);
    localStorage.setItem("userRole", user.role);

    // إعادة تحميل الصفحة
    location.reload();
}
