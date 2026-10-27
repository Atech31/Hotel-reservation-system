  var API_URL = window.API_URL || '/api';

const token = localStorage.getItem('token');
if (!token) {
    alert('Access Denied: Please log in first.');
    window.location.href = 'login.html';
}

// Helper to provide standard auth headers for fetch requests
function getAuthHeaders(customHeaders = {}) {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...customHeaders
    };
}

// 🧭 1. SIDEBAR VIEW CONTROLLER
function switchView(viewId, element) {
    document.querySelectorAll('.content-view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));

    const target = document.getElementById(viewId);
    if (target) target.classList.add('active');
    if (element) element.classList.add('active');

    if (viewId === 'historyView') fetchBookingHistory();
    if (viewId === 'catalogView' || viewId === 'bookingView') fetchRooms();
}

// 🚪 USER LOGOUT & THEME
function logoutUser() {
    localStorage.clear();
    window.location.href = 'login.html';
}

function toggleNeonTheme() {
    document.body.classList.toggle('cyberpunk-theme');
}

// 📊 2. ROOM MANAGEMENT & STATS UPDATE
async function fetchRooms() {
    try {
        const res = await fetch(`${API_URL}/rooms`, {
            headers: getAuthHeaders()
        });
        const rooms = await res.json();
		
        rooms.sort((a, b) => parseInt(a.roomNumber) - parseInt(b.roomNumber));

        const listDiv = document.getElementById('roomsList');
        const selectDropdown = document.getElementById('bookingRoom');

        if (listDiv) {
            listDiv.innerHTML = rooms.length === 0 ? '<p style="color: rgba(255,255,255,0.7); text-align:center;">No rooms found.</p>' : '';
            rooms.forEach(room => {
                const roomEl = document.createElement('div');
                roomEl.className = 'room-item';
                const statusBadge = room.available 
                    ? '<span class="badge available">Available</span>' 
                    : '<span class="badge booked">Booked</span>';
                
                roomEl.innerHTML = `
                    <div>
                        <strong style="color:#ffffff;">Room ${room.roomNumber}</strong> - <span style="color: rgba(255,255,255,0.8);">${room.roomType || 'Standard'}</span> <br>
                        <small style="color: rgba(255,255,255,0.65);">Price: ₹${room.price}/night</small>
                    </div>
                    ${statusBadge}
                `;
                listDiv.appendChild(roomEl);
            });
        }

        if (selectDropdown) {
            selectDropdown.innerHTML = '<option value="">-- Choose an Available Room --</option>';
            rooms.filter(r => r.available).forEach(room => {
                const opt = document.createElement('option');
                opt.value = room.id;
                opt.textContent = `Room ${room.roomNumber} (${room.roomType || 'Standard'}) - ₹${room.price}`;
                selectDropdown.appendChild(opt);
            });
        }

        // Update Total Rooms Stat
        const totalRoomsEl = document.getElementById('statTotalRooms');
        if (totalRoomsEl) totalRoomsEl.innerText = rooms.length;

    } catch (err) {
        console.error("Error fetching rooms:", err);
    }
}
/*
// 📋 3. RESERVATION HISTORY & REVENUE CALCULATION
async function fetchBookingHistory() {
    try {
        const res = await fetch(`${API_URL}/bookings`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error("Backend offline");
        
        const bookings = await res.json();
		window.allBookings = bookings;
        const tbody = document.getElementById('myBookingsList');
        if (!tbody) return;

        tbody.innerHTML = '';
        if (!bookings || bookings.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="padding: 20px; text-align: center; color: rgba(255,255,255,0.8);">No active reservations found.</td></tr>`;
            return;
        }

        let calculatedRevenue = 0;

        bookings.forEach(b => {
            const roomNo = b.roomNumber || (b.room ? b.room.roomNumber : null) || b.roomId || 'N/A';
            
            // Reads customerName directly from Spring Boot Entity
            const guest = b.customerName || b.guestName || b.customerEmail || 'Guest';
            
            const checkIn = b.checkInDate || b.checkIn || 'N/A';
            const checkOut = b.checkOutDate || b.checkOut || 'N/A';
			const paymentId = b.razorpayPaymentId || 'N/A';
            const bookingCost = parseFloat(b.totalPrice || b.price || (b.room ? b.room.price : 0) || 0);
            calculatedRevenue += bookingCost;
			const row = document.createElement('tr');
			            row.innerHTML = `
			                <td style="padding: 14px; border-bottom: 1px solid rgba(255,255,255,0.08);">Room ${roomNo}</td>
			                <td style="padding: 14px; border-bottom: 1px solid rgba(255,255,255,0.08);">${guest}</td>
			                <td style="padding: 14px; border-bottom: 1px solid rgba(255,255,255,0.08);">${checkIn}</td>
			                <td style="padding: 14px; border-bottom: 1px solid rgba(255,255,255,0.08);">${checkOut}</td>
			                <td style="padding: 14px; border-bottom: 1px solid rgba(255,255,255,0.08);"><small style="color: #60a5fa;">${paymentId}</small></td>
			                <td style="padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.08); text-align: center;">
			                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;">
			                        <button onclick="downloadReceipt(${b.id})" style="background: #2563eb; color: white; border: none; padding: 5px 0; width: 80px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px; text-align: center;">Receipt</button>
			                        <button onclick="deleteBooking(${b.id})" style="background: #ef4444; color: white; border: none; padding: 5px 0; width: 80px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px; text-align: center;">Cancel</button>
			                    </div>
			                </td>
			            `;

			            tbody.appendChild(row);
			        });

        const activeBookingsEl = document.getElementById('statActiveBookings');
        const revenueEl = document.getElementById('statRevenue');

        if (activeBookingsEl) activeBookingsEl.innerText = bookings.length;
        if (revenueEl) revenueEl.innerText = `₹${calculatedRevenue}`;

    } catch (err) {
        console.error('Error fetching bookings:', err);
    }
}
*/


// 📋 3. RESERVATION HISTORY & REVENUE CALCULATION SAME


async function fetchBookingHistory() {
    try {
        const res = await fetch(`${API_URL}/bookings`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error("Backend offline");
        
        const bookings = await res.json();
        window.allBookings = bookings;
        
        // Target table body or container
        const tbody = document.getElementById('myBookingsList');
        if (!tbody) return;

        tbody.innerHTML = ''; // Clears 'Loading active reservations...'

        if (!bookings || bookings.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="padding: 20px; text-align: center; color: rgba(255,255,255,0.8);">No active reservations found.</td></tr>`;
            return;
        }

        let calculatedRevenue = 0;

        bookings.forEach(b => {
            const roomNo = b.roomNumber || (b.room ? b.room.roomNumber : null) || b.roomId || 'N/A';
            const guest = b.customerName || b.guestName || b.customerEmail || 'Guest';
            const checkIn = b.checkInDate || b.checkIn || 'N/A';
            const checkOut = b.checkOutDate || b.checkOut || 'N/A';
            const paymentId = b.razorpayPaymentId || 'N/A';
            const bookingCost = parseFloat(b.totalPrice || b.price || (b.room ? b.room.price : 0) || 0);
            calculatedRevenue += bookingCost;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="padding: 14px; border-bottom: 1px solid rgba(255,255,255,0.08);">Room ${roomNo}</td>
                <td style="padding: 14px; border-bottom: 1px solid rgba(255,255,255,0.08);">${guest}</td>
                <td style="padding: 14px; border-bottom: 1px solid rgba(255,255,255,0.08);">${checkIn}</td>
                <td style="padding: 14px; border-bottom: 1px solid rgba(255,255,255,0.08);">${checkOut}</td>
                <td style="padding: 14px; border-bottom: 1px solid rgba(255,255,255,0.08);"><small style="color: #60a5fa;">${paymentId}</small></td>
                <td style="padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.08); text-align: center;">
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;">
                        <button onclick="downloadReceipt(${b.id})" style="background: #2563eb; color: white; border: none; padding: 5px 0; width: 80px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px; text-align: center;">Receipt</button>
                        <button onclick="deleteBooking(${b.id})" style="background: #ef4444; color: white; border: none; padding: 5px 0; width: 80px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px; text-align: center;">Cancel</button>
                    </div>
                </td>
            `;

            tbody.appendChild(row);
        });

        const activeBookingsEl = document.getElementById('statActiveBookings');
        const revenueEl = document.getElementById('statRevenue');

        if (activeBookingsEl) activeBookingsEl.innerText = bookings.length;
        if (revenueEl) revenueEl.innerText = `₹${calculatedRevenue}`;

    } catch (err) {
        console.error('Error fetching bookings:', err);
        const tbody = document.getElementById('myBookingsList');
        if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="padding: 20px; text-align: center; color: #ef4444;">Failed to load reservations.</td></tr>`;
    }
}






// 💳 4. REAL BACKEND SUBMIT FUNCTION
async function submitBooking(event) {
    if (event) event.preventDefault();

    const roomId = document.getElementById('bookingRoom')?.value;
    const nameVal = document.getElementById('custName')?.value;
    const emailVal = document.getElementById('custEmail')?.value;
    const checkInDate = document.getElementById('checkIn')?.value;
    const checkOutDate = document.getElementById('checkOut')?.value;

    if (!roomId || !nameVal || !checkInDate || !checkOutDate) {
        alert('Please fill in all required fields!');
        return;
    }

    const roomDropdown = document.getElementById('bookingRoom');
    const selectedText = roomDropdown.options[roomDropdown.selectedIndex].text;
    const priceMatch = selectedText.match(/₹(\d+)/);
    const roomPrice = priceMatch ? parseInt(priceMatch[1]) : 1000;

    const options = {
        key: "rzp_test_TGRXU04lKfQE5A",
        amount: roomPrice * 100,
        currency: "INR",
        name: "Luxury Stay Hotel",
        description: "Room Booking Payment",
        handler: async function (response) {
            console.log("Payment ID: " + response.razorpay_payment_id);
            
            const payload = {
                customerName: nameVal,
                customerEmail: emailVal,
                checkInDate: checkInDate,
                checkOutDate: checkOutDate,
                room: { id: parseInt(roomId) },
				razorpayPaymentId: response.razorpay_payment_id
            };

            try {
                const res = await fetch(`${API_URL}/bookings`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    alert(`🎉 Payment Successful!\nPayment ID: ${response.razorpay_payment_id}\nReservation confirmed!`);
                    fetchBookingHistory();
                    fetchRooms();
                    switchView('historyView');
                } else {
                    const errorTxt = await res.text();
                    alert('Booking failed: ' + errorTxt);
                }
            } catch (err) {
                console.error(err);
                alert('Server error.');
            }
        },
        prefill: { name: nameVal, email: emailVal, contact: "9999999999" },
        theme: { color: "#3b82f6" }
    };

    const rzp1 = new Razorpay(options);
    rzp1.on('payment.failed', function (response){
        alert("❌ Payment Failed: " + response.error.description);
    });
    
    rzp1.open();
}

// 💳 5. PAYMENT MODAL DUMMY HANDLERS
function openPaymentModal(amount) {
    document.getElementById('payAmount').innerText = '₹' + amount;
    document.getElementById('paymentModal').style.display = 'flex';
}

function processPseudoPayment() {
    alert("🎉 Payment Successful! Reservation confirmed.");
    document.getElementById('paymentModal').style.display = 'none';
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) bookingForm.reset();
    fetchRooms();
    fetchBookingHistory();
}

document.addEventListener('DOMContentLoaded', () => {
    fetchRooms();
    fetchBookingHistory();

    const roomForm = document.getElementById('roomForm');
    if (roomForm) {
        roomForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const roomData = {
                roomNumber: document.getElementById('roomNum').value,
                roomType: document.getElementById('roomType').value,
                price: parseFloat(document.getElementById('roomPrice').value),
                available: true
            };

            try {
                const res = await fetch(`${API_URL}/rooms`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(roomData)
                });
                if (res.ok) {
                    alert('✨ Room added successfully!');
                    roomForm.reset();
                    fetchRooms();
                }
            } catch (err) {
                console.error('Error adding room:', err);
            }
        });
    }

    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', submitBooking);
    }
});

// Delete handler
window.deleteBooking = async function(id) {
    if (!id || id === 'undefined') {
        alert('Booking ID missing! Cannot delete.');
        return;
    }

    if (!confirm('Are you sure you want to cancel this reservation?')) return;

    try {
        const res = await fetch(`${API_URL}/bookings/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (res.ok) {
            alert('Reservation cancelled successfully!');
            fetchBookingHistory();
            fetchRooms();
        } else {
            alert('Failed to cancel reservation on server.');
        }
    } catch (err) {
        console.error('Error deleting booking:', err);
        alert('Error connecting to backend server.');
    }
};

document.querySelector('#themeBtn')?.addEventListener('click', () => {
    document.body.classList.toggle('cyberpunk-theme');
});

// 🧾 RECEIPT GENERATOR
window.downloadReceipt = function(bookingId) {
    const bookings = window.allBookings || [];
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return alert("Booking details not found!");

    const receiptContent = `
========================================
       LUXURY STAY HOTEL - RECEIPT      
========================================
Booking ID    : #${booking.id}
Payment ID    : ${booking.razorpayPaymentId || 'N/A'}
Guest Name    : ${booking.customerName || 'Guest'}
Guest Email   : ${booking.customerEmail || 'N/A'}
Room          : Room ${booking.room ? booking.room.roomNumber : 'N/A'}
Check-In      : ${booking.checkInDate || 'N/A'}
Check-Out     : ${booking.checkOutDate || 'N/A'}
Status        : CONFIRMED & PAID
========================================
   Thank you for staying with us!       
========================================`;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Receipt_Booking_${bookingId}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
};
