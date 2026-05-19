function displayOrders(orders, title = "Order Details") {
    lastTodayOrders = orders;
    lastBacklogOrders = [];
    lastType = title || "table";

    orders.sort((a, b) => {

        function getFullDate(order) {

            // لو الطلب Distributed
            if (order.status === "distributed" || order.status === "ready_to_distribute") {
                return new Date(distributedOrdersMap[order.orderNo]?.date);
            }

            // أخذ أول وقت استلام من أول warehouse
            const firstWH = order.warehouses[0];

            if (firstWH?.receivedTime) {
                return new Date(firstWH.receivedTime);
            }

            return new Date(order.date); // fallback
        }

        return getFullDate(b) - getFullDate(a); // ⬅️ الأحدث أولاً حسب الوقت
    });
    const orderList = document.getElementById("orderList");
    lastDisplayedOrders = orders; // مهم للتصدير  

    let html = `  
    <table>  
      <thead>  
        <tr>  
          <th>Order #</th>  
          <th>Warehouses</th>  
          <th>Status</th>  
        </tr>  
      </thead>  
      <tbody>  
    `;

    const seen = new Set();

    orders.forEach(order => {
        const key = order.orderNo.toUpperCase();
        if (seen.has(key)) return;
        seen.add(key);

        // تحديد حالة الطلب  
        let statusText = "";

        if (order.status === "canceled") {
            statusText = "Canceled";
        }
        else if (order.status === "canceled_before_delivery") {
            statusText = "Canceled Before Delivery";
        }
else if (order.status === "distributed") {
    statusText = "Distributed";
}
        else if (order.status === "completed") {
            statusText = "In-Packing";
        }
        else if (order.status === "partial") {
            statusText = "Partial";
        }
        else {
            statusText = "Pending";
        }
        html += `  
        <tr>  
          <td>${order.orderNo}</td>  
          <td>  
${order.warehouses.map(w => {

    let color, text;

    if (order.status === "distributed" || order.status === "ready_to_distribute") {
        color = "#22c55e";
        text = "Distributed";
    }
    else if (w.packed) {
        color = "#22c55e";
        text = "In-Packing";
    } 
    else {
        color = "#7c2d12";
        text = "Pending";
    }

    let tooltipText = "";
if (order.status === "distributed") {

    const distributedHistory = (order.history || [])
        .find(h => h.action === "distributed");

    const distDate =
        order.distributedDate ||
        order.batch?.date ||
        distributedOrdersMap[order.orderNo]?.date ||
        (distributedHistory
            ? distributedHistory.date.split("T")[0]
            : "-");

    tooltipText = `Distributed at: ${distDate}`;
}
    else if (w.packed) {
        tooltipText = `Received at Packing Station: ${w.receivedTime || "-"}`;
    }
    else {
        tooltipText = `Received in Warehouse: ${w.receivedTime || "-"}`;
    }

    return `
    <div class="tooltip-wrapper">  
        <span style="
            display:inline-block;  
            margin:2px;  
            padding:4px 8px;  
            border-radius:6px;  
            font-size:12px;  
            font-weight:600;  
            background:${color};  
            color:black;  
            cursor:pointer;  
        ">  
            ${(w.base || "UNKNOWN").toUpperCase()}  
        </span>  
        <div class="tooltip-box">  
            ${tooltipText}  
        </div>  
    </div>`;
}).join("")}
<td style="font-weight:600; color:#9ca3af">

${statusText}

${localStorage.getItem("currentWarehouse") === "Packing Station"
                && order.status === "pending"

                ? `
<button id="rec" onclick="receiveInPacking('${order.orderNo}')"
style="
margin-left:8px;
background:#22c55e;
border:none;
padding:4px 8px;
border-radius:6px;
cursor:pointer;
font-size:11px;
font-weight:600;
">
Received
</button>
`
                : ""
            }

</td> 
        </tr>  
        `;
    });

    html += `  
      </tbody>  
    </table>  
    `;

    orderList.innerHTML = `  
      <h3 style="color:var(--accent); margin-bottom:12px"></h3>  
      ${html}  
    `;

    // إظهار نافذة التفاصيل  
    document.getElementById("orderDetails").classList.remove("hidden");
}
