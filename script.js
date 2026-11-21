// ======================================
// GoTaxi - TAXI MANAGEMENT SYSTEM
// ======================================

const RATES = {
    Mini: 12,
    Sedan: 16,
    SUV: 22
};

const STORAGE_KEYS = {
    drivers: "voyage_drivers",
    vehicles: "voyage_vehicles",
    bookings: "voyage_bookings"
};

// Load saved information
let drivers = JSON.parse(localStorage.getItem(STORAGE_KEYS.drivers) || "[]");
let vehicles = JSON.parse(localStorage.getItem(STORAGE_KEYS.vehicles) || "[]");
let bookings = JSON.parse(localStorage.getItem(STORAGE_KEYS.bookings) || "[]");

// Save information
function saveData() {
    localStorage.setItem(STORAGE_KEYS.drivers, JSON.stringify(drivers));
    localStorage.setItem(STORAGE_KEYS.vehicles, JSON.stringify(vehicles));
    localStorage.setItem(STORAGE_KEYS.bookings, JSON.stringify(bookings));
}

// Safely display user-entered text
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// Notification
function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

// Generate unique IDs
function generateID() {
    return Date.now().toString() + Math.random().toString(36).slice(2, 7);
}

// ======================================
// FARE CALCULATION
// ======================================

function calculateFare() {
    const distance = Number(document.getElementById("distance").value);
    const category = document.getElementById("vehicleCategory").value;
    const extra = Number(document.getElementById("extraCharge").value);

    if (
        !Number.isFinite(distance) ||
        !Number.isFinite(extra) ||
        distance <= 0 ||
        extra < 0 ||
        !RATES[category]
    ) {
        document.getElementById("farePreview").textContent = "₹0.00";
        return 0;
    }

    const fare = (distance * RATES[category]) + extra;

    document.getElementById("farePreview").textContent =
        "₹" + fare.toFixed(2);

    return fare;
}

["distance", "vehicleCategory", "extraCharge"].forEach(id => {
    document.getElementById(id).addEventListener("input", calculateFare);
    document.getElementById(id).addEventListener("change", calculateFare);
});

// ======================================
// DRIVER REGISTRATION
// ======================================

document.getElementById("driverForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const name = document.getElementById("driverName").value.trim();
    const phone = document.getElementById("driverPhone").value.trim();
    const licence = document.getElementById("driverLicence").value.trim();

    if (!name || !/^\d{10}$/.test(phone) || !licence) {
        showToast("Please enter valid driver details.");
        return;
    }

    const duplicate = drivers.some(driver =>
        driver.licence.toLowerCase() === licence.toLowerCase() ||
        driver.phone === phone
    );

    if (duplicate) {
        showToast("Driver already registered!");
        return;
    }

    drivers.push({
        id: generateID(),
        name,
        phone,
        licence
    });

    saveData();
    this.reset();
    renderAll();
    showToast("Driver registered successfully!");
});

// ======================================
// VEHICLE MANAGEMENT
// ======================================

document.getElementById("vehicleForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const number = document.getElementById("vehicleNumber").value.trim().toUpperCase();
    const model = document.getElementById("vehicleModel").value.trim();
    const category = document.getElementById("vehicleType").value;

    if (!number || !model || !RATES[category]) {
        showToast("Please enter valid vehicle details.");
        return;
    }

    const duplicate = vehicles.some(vehicle =>
        vehicle.number.toLowerCase() === number.toLowerCase()
    );

    if (duplicate) {
        showToast("Vehicle already registered!");
        return;
    }

    vehicles.push({
        id: generateID(),
        number,
        model,
        category
    });

    saveData();
    this.reset();
    renderAll();
    showToast("Vehicle added successfully!");
});

// ======================================
// CUSTOMER TAXI BOOKING
// ======================================

document.getElementById("bookingForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const name = document.getElementById("customerName").value.trim();
    const phone = document.getElementById("customerPhone").value.trim();
    const pickup = document.getElementById("pickup").value.trim();
    const drop = document.getElementById("drop").value.trim();
    const distance = Number(document.getElementById("distance").value);
    const category = document.getElementById("vehicleCategory").value;
    const extra = Number(document.getElementById("extraCharge").value);
    const driverId = document.getElementById("assignDriver").value;

    if (
        !name || !/^\d{10}$/.test(phone) ||
        !pickup || !drop ||
        !Number.isFinite(distance) || distance <= 0 ||
        !Number.isFinite(extra) || extra < 0 ||
        !RATES[category]
    ) {
        showToast("Please check all booking details.");
        return;
    }

    if (driverId && !drivers.some(d => d.id === driverId)) {
        showToast("Selected driver is unavailable.");
        return;
    }

    const fare = distance * RATES[category] + extra;

    bookings.push({
        id: generateID(),
        name,
        phone,
        pickup,
        drop,
        distance,
        category,
        extra,
        driverId,
        fare,
        status: "Pending",
        date: new Date().toLocaleString("en-IN")
    });

    saveData();
    this.reset();
    document.getElementById("farePreview").textContent = "₹0.00";

    renderAll();
    showToast("Taxi booking created successfully!");
});

// ======================================
// DELETE DRIVER
// ======================================

function deleteDriver(id) {
    const hasTrips = bookings.some(booking =>
        booking.driverId === id &&
        booking.status === "Pending"
    );

    if (hasTrips) {
        showToast("Complete or cancel the driver's pending trips first.");
        return;
    }

    if (!confirm("Are you sure you want to delete this driver?")) return;

    drivers = drivers.filter(driver => driver.id !== id);

    bookings.forEach(booking => {
        if (booking.driverId === id) {
            booking.driverId = "";
        }
    });

    saveData();
    renderAll();
    showToast("Driver deleted successfully.");
}

// ======================================
// DELETE VEHICLE
// ======================================

function deleteVehicle(id) {
    if (!confirm("Delete this vehicle?")) return;

    vehicles = vehicles.filter(vehicle => vehicle.id !== id);

    saveData();
    renderAll();
    showToast("Vehicle deleted successfully.");
}

// ======================================
// TRIP STATUS MANAGEMENT
// ======================================

function updateTrip(id, status) {
    const booking = bookings.find(item => item.id === id);

    if (!booking || booking.status !== "Pending") return;

    booking.status = status;

    saveData();
    renderAll();

    showToast("Trip marked as " + status + ".");
}

// ======================================
// DRIVER DROPDOWN
// ======================================

function renderDriverOptions() {
    const select = document.getElementById("assignDriver");
    const currentValue = select.value;

    select.innerHTML = '<option value="">No driver assigned</option>';

    drivers.forEach(driver => {
        const option = document.createElement("option");
        option.value = driver.id;
        option.textContent = driver.name;
        select.appendChild(option);
    });

    if (drivers.some(driver => driver.id === currentValue)) {
        select.value = currentValue;
    }
}

// ======================================
// DRIVER TABLE
// ======================================

function renderDrivers() {
    const table = document.getElementById("driverTable");

    if (!drivers.length) {
        table.innerHTML = '<tr><td colspan="4">No drivers registered.</td></tr>';
        return;
    }

    table.innerHTML = drivers.map(driver => `
        <tr>
            <td>${escapeHTML(driver.name)}</td>
            <td>${escapeHTML(driver.phone)}</td>
            <td>${escapeHTML(driver.licence)}</td>
            <td>
                <button class="delete-btn"
                    data-action="delete-driver"
                    data-id="${escapeHTML(driver.id)}">
                    Delete
                </button>
            </td>
        </tr>
    `).join("");
}

// ======================================
// VEHICLE TABLE
// ======================================

function renderVehicles() {
    const table = document.getElementById("vehicleTable");

    if (!vehicles.length) {
        table.innerHTML = '<tr><td colspan="4">No vehicles registered.</td></tr>';
        return;
    }

    table.innerHTML = vehicles.map(vehicle => `
        <tr>
            <td>${escapeHTML(vehicle.number)}</td>
            <td>${escapeHTML(vehicle.model)}</td>
            <td>${escapeHTML(vehicle.category)}</td>
            <td>
                <button class="delete-btn"
                    data-action="delete-vehicle"
                    data-id="${escapeHTML(vehicle.id)}">
                    Delete
                </button>
            </td>
        </tr>
    `).join("");
}

// ======================================
// BOOKING TABLE
// ======================================

function renderBookings() {
    const table = document.getElementById("bookingTable");

    if (!bookings.length) {
        table.innerHTML = '<tr><td colspan="8">No bookings available.</td></tr>';
        return;
    }

    table.innerHTML = bookings.map(booking => {
        const driver = drivers.find(d => d.id === booking.driverId);
        const driverName = driver ? driver.name : "Not assigned";

        let actions = "—";

        if (booking.status === "Pending") {
            actions = `
                <button class="complete-btn"
                    data-action="complete"
                    data-id="${escapeHTML(booking.id)}">
                    Complete
                </button>
                <button class="cancel-btn"
                    data-action="cancel"
                    data-id="${escapeHTML(booking.id)}">
                    Cancel
                </button>
            `;
        }

        return `
            <tr>
                <td>${escapeHTML(booking.name)}</td>
                <td>${escapeHTML(booking.pickup)} → ${escapeHTML(booking.drop)}</td>
                <td>${booking.distance} KM</td>
                <td>${escapeHTML(booking.category)}</td>
                <td>${escapeHTML(driverName)}</td>
                <td>₹${booking.fare.toFixed(2)}</td>
                <td>${escapeHTML(booking.status)}</td>
                <td>${actions}</td>
            </tr>
        `;
    }).join("");
}

// ======================================
// DRIVER-WISE REPORTS
// ======================================

function renderReports() {
    const container = document.getElementById("driverReports");

    if (!drivers.length) {
        container.innerHTML = "<p>No driver reports available yet.</p>";
        return;
    }

    container.innerHTML = drivers.map(driver => {
        const trips = bookings.filter(booking =>
            booking.driverId === driver.id &&
            booking.status === "Completed"
        );

        const totalFare = trips.reduce((sum, trip) => sum + trip.fare, 0);

        return `
            <div class="report-item">
                <strong>${escapeHTML(driver.name)}</strong>
                <span>Completed Trips: ${trips.length}</span><br>
                <span>Total Trip Fare: ₹${totalFare.toFixed(2)}</span>
            </div>
        `;
    }).join("");
}

// ======================================
// DASHBOARD STATISTICS
// ======================================

function renderDashboard() {
    const completed = bookings.filter(b => b.status === "Completed").length;

    const values = {
        totalBookings: bookings.length,
        totalDrivers: drivers.length,
        totalVehicles: vehicles.length,
        completedTrips: completed
    };

    Object.entries(values).forEach(([id, value]) => {
        document.getElementById(id).textContent = value;
    });

    document.getElementById("heroBookings").textContent = bookings.length;
    document.getElementById("heroDrivers").textContent = drivers.length;
    document.getElementById("heroVehicles").textContent = vehicles.length;
}

// ======================================
// EXPORT BOOKINGS TO CSV
// ======================================

document.getElementById("exportBtn").addEventListener("click", function() {
    if (!bookings.length) {
        showToast("No bookings to export.");
        return;
    }

    const rows = [
        ["Customer", "Phone", "Pickup", "Drop", "Distance", "Category", "Driver", "Fare", "Status", "Date"]
    ];

    bookings.forEach(booking => {
        const driver = drivers.find(d => d.id === booking.driverId);

        rows.push([
            booking.name,
            booking.phone,
            booking.pickup,
            booking.drop,
            booking.distance,
            booking.category,
            driver ? driver.name : "Not assigned",
            booking.fare.toFixed(2),
            booking.status,
            booking.date
        ]);
    });

    const csv = rows.map(row =>
        row.map(value =>
            '"' + String(value).replace(/"/g, '""') + '"'
        ).join(",")
    ).join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "Taxi_Booking_Report.csv";
    link.click();

    URL.revokeObjectURL(url);
    showToast("Report exported successfully!");
});

// ======================================
// BUTTON ACTIONS
// ======================================

document.addEventListener("click", function(e) {
    const button = e.target.closest("button[data-action]");

    if (!button) return;

    const id = button.dataset.id;
    const action = button.dataset.action;

    if (action === "delete-driver") {
        deleteDriver(id);
    } else if (action === "delete-vehicle") {
        deleteVehicle(id);
    } else if (action === "complete") {
        updateTrip(id, "Completed");
    } else if (action === "cancel") {
        updateTrip(id, "Cancelled");
    }
});

// ======================================
// RENDER EVERYTHING
// ======================================

function renderAll() {
    renderDriverOptions();
    renderDrivers();
    renderVehicles();
    renderBookings();
    renderReports();
    renderDashboard();
}

// Start the website
document.addEventListener("DOMContentLoaded", renderAll);
renderAll();

console.log("VOYAGE Taxi Management System loaded successfully!");
