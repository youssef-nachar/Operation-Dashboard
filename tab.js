function showDashboardHome() {
    document.getElementById("dashboardHeader").style.display = "flex";
    document.getElementById("newOrderTab").classList.add("hidden");
    document.getElementById("teamNotesTab").classList.add("hidden");
        document.getElementById("dsh").style.display="block";
    document.getElementById("readyTab").classList.add("hidden");
    document.querySelector(".kpis").classList.remove("hidden");
    document.querySelector(".warehouse-container").classList.remove("hidden");
    document.querySelector(".sales-order").classList.remove("hidden");
}


