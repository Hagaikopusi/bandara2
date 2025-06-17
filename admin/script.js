document.addEventListener('DOMContentLoaded', () => {
    // Definisi Elemen
    const pendingList = document.getElementById('pending-list');
    const approvedList = document.getElementById('approved-list');
    const logoutBtn = document.getElementById('logout-btn');
    const logTableBody = document.getElementById('log-table-body');
    const downloadLogBtn = document.getElementById('download-log-btn');
    
    // Elemen Paginasi Log
    const logPaginationContainer = document.getElementById('log-pagination');
    const logPrevBtn = document.getElementById('log-prev-btn');
    const logNextBtn = document.getElementById('log-next-btn');
    const logPageInput = document.getElementById('log-page-input');
    const logTotalPagesSpan = document.getElementById('log-total-pages');
    
    // Elemen Paginasi Promo Disetujui
    const approvedPaginationContainer = document.getElementById('approved-pagination');
    const approvedPrevBtn = document.getElementById('approved-prev-btn');
    const approvedNextBtn = document.getElementById('approved-next-btn');
    const approvedPageInfo = document.getElementById('approved-page-info');
    
    // Elemen Paginasi Promo Tertunda (BARU)
    const pendingPaginationContainer = document.getElementById('pending-pagination');
    const pendingPrevBtn = document.getElementById('pending-prev-btn');
    const pendingNextBtn = document.getElementById('pending-next-btn');
    const pendingPageInfo = document.getElementById('pending-page-info');

    // Elemen Filter
    const searchInput = document.getElementById('log-search-input');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const resetFilterBtn = document.getElementById('reset-filter-btn');
    
    // State
    let logCurrentPage = 1;
    const logRowsPerPage = 4;
    let approvedCurrentPage = 1;
    const approvedItemsPerPage = 3;
    let pendingCurrentPage = 1; // State Halaman untuk promo tertunda
    const pendingItemsPerPage = 3; // State item per halaman
    let searchTerm = '';
    let startDate = null;
    let endDate = null;
    let activeTimers = [];

    // --- FUNGSI & LOGIKA UNTUK LOG TETAP SAMA ---
    // (Semua fungsi dari logAction hingga event listener filter tidak berubah)

    // --- FUNGSI PROMO & LAINNYA ---
    function displayCurrentDate() {
        const dateElement = document.getElementById('current-date');
        if (!dateElement) return;
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Jakarta' };
        dateElement.textContent = now.toLocaleDateString('id-ID', options);
    }

    // FUNGSI LOADPROMOS DIPERBARUI UNTUK SEMUA PAGINASI
    function loadPromos() {
        activeTimers.forEach(timer => clearInterval(timer));
        activeTimers = [];

        pendingList.innerHTML = '';
        approvedList.innerHTML = '';

        const pendingPromos = JSON.parse(localStorage.getItem('pendingPromos')) || [];
        const approvedPromos = JSON.parse(localStorage.getItem('approvedPromos')) || [];

        // PAGINASI UNTUK PROMO TERTUNDA
        if (pendingPromos.length === 0) {
            pendingList.innerHTML = '<p class="empty-message">Tidak ada promo yang menunggu persetujuan.</p>';
        } else {
            const start = (pendingCurrentPage - 1) * pendingItemsPerPage;
            const end = start + pendingItemsPerPage;
            const paginatedPending = pendingPromos.slice(start, end);

            paginatedPending.forEach(promo => {
                const promoCard = createPromoCard(promo, 'pending');
                pendingList.appendChild(promoCard);
            });
        }
        setupPendingPagination(pendingPromos.length);


        // PAGINASI UNTUK PROMO DISETUJUI
        if (approvedPromos.length === 0) {
            approvedList.innerHTML = '<p class="empty-message">Belum ada promo yang disetujui.</p>';
        } else {
            const start = (approvedCurrentPage - 1) * approvedItemsPerPage;
            const end = start + approvedItemsPerPage;
            const paginatedApproved = approvedPromos.slice(start, end);

            paginatedApproved.forEach(promo => {
                const promoCard = createPromoCard(promo, 'approved');
                approvedList.appendChild(promoCard);
                if (promo.status === 'approved') {
                    startAdminCountdown(promo);
                }
            });
        }
        setupApprovedPagination(approvedPromos.length);
    }

    // --- FUNGSI BARU UNTUK KONTROL PAGINASI ---
    function setupPendingPagination(totalItems) {
        if (!pendingPaginationContainer) return;
        const totalPages = Math.ceil(totalItems / pendingItemsPerPage);

        if (totalPages <= 1) {
            pendingPaginationContainer.style.display = 'none';
        } else {
            pendingPaginationContainer.style.display = 'flex';
            pendingPageInfo.textContent = `Halaman ${pendingCurrentPage} dari ${totalPages}`;
            pendingPrevBtn.disabled = pendingCurrentPage === 1;
            pendingNextBtn.disabled = pendingCurrentPage === totalPages;

            pendingPrevBtn.classList.toggle('disabled', pendingCurrentPage === 1);
            pendingNextBtn.classList.toggle('disabled', pendingCurrentPage === totalPages);
        }
    }

    function setupApprovedPagination(totalItems) {
        if (!approvedPaginationContainer) return;
        const totalPages = Math.ceil(totalItems / approvedItemsPerPage);

        if (totalPages <= 1) {
            approvedPaginationContainer.style.display = 'none';
        } else {
            approvedPaginationContainer.style.display = 'flex';
            approvedPageInfo.textContent = `Halaman ${approvedCurrentPage} dari ${totalPages}`;
            approvedPrevBtn.disabled = approvedCurrentPage === 1;
            approvedNextBtn.disabled = approvedCurrentPage === totalPages;

            approvedPrevBtn.classList.toggle('disabled', approvedCurrentPage === 1);
            approvedNextBtn.classList.toggle('disabled', approvedCurrentPage === totalPages);
        }
    }
    
    // --- EVENT LISTENERS BARU UNTUK PAGINASI PROMO TERTUNDA ---
    pendingPrevBtn.addEventListener('click', () => {
        if (pendingCurrentPage > 1) {
            pendingCurrentPage--;
            loadPromos();
        }
    });

    pendingNextBtn.addEventListener('click', () => {
        const pendingPromos = JSON.parse(localStorage.getItem('pendingPromos')) || [];
        const totalPages = Math.ceil(pendingPromos.length / pendingItemsPerPage);
        if (pendingCurrentPage < totalPages) {
            pendingCurrentPage++;
            loadPromos();
        }
    });

    // --- EVENT LISTENERS LAINNYA ---
    approvedPrevBtn.addEventListener('click', () => {
        if (approvedCurrentPage > 1) {
            approvedCurrentPage--;
            loadPromos();
        }
    });

    approvedNextBtn.addEventListener('click', () => {
        const approvedPromos = JSON.parse(localStorage.getItem('approvedPromos')) || [];
        const totalPages = Math.ceil(approvedPromos.length / approvedItemsPerPage);
        if (approvedCurrentPage < totalPages) {
            approvedCurrentPage++;
            loadPromos();
        }
    });

    function approvePromo(id) {
        let pendingPromos = JSON.parse(localStorage.getItem('pendingPromos')) || [];
        const totalPendingBefore = pendingPromos.length;

        // ... sisa logika approve ...
        let approvedPromos = JSON.parse(localStorage.getItem('approvedPromos')) || [];
        const promoToApprove = pendingPromos.find(p => p.id === id);
        if (promoToApprove) {
            promoToApprove.status = 'approved';
            promoToApprove.approvalTimestamp = Date.now();
            approvedPromos.push(promoToApprove);
            logAction('Disetujui', promoToApprove);
            pendingPromos = pendingPromos.filter(p => p.id !== id);
            localStorage.setItem('pendingPromos', JSON.stringify(pendingPromos));
            localStorage.setItem('approvedPromos', JSON.stringify(approvedPromos));

            // Cek jika halaman pending jadi kosong setelah approve
            const totalPagesAfter = Math.ceil(pendingPromos.length / pendingItemsPerPage);
            if(pendingCurrentPage > totalPagesAfter && totalPagesAfter > 0) {
                pendingCurrentPage = totalPagesAfter;
            }

            approvedCurrentPage = 1; 
            loadPromos();
            logCurrentPage = 1;
            loadActivityLog();
        }
    }

    function rejectPromo(id) {
        const reason = prompt("Silakan masukkan alasan penolakan promo ini:");
        if (reason === null || reason.trim() === "") { alert("Penolakan dibatalkan karena tidak ada alasan yang diberikan."); return; }
        
        let pendingPromos = JSON.parse(localStorage.getItem('pendingPromos')) || [];
        let rejectedPromos = JSON.parse(localStorage.getItem('rejectedPromos')) || [];
        const promoToReject = pendingPromos.find(p => p.id === id);

        if (promoToReject) {
            promoToReject.status = 'rejected';
            promoToReject.rejectionReason = reason; 
            rejectedPromos.push(promoToReject);
            pendingPromos = pendingPromos.filter(p => p.id !== id);
            localStorage.setItem('pendingPromos', JSON.stringify(pendingPromos));
            localStorage.setItem('rejectedPromos', JSON.stringify(rejectedPromos));

             // Cek jika halaman pending jadi kosong setelah reject
            const totalPagesAfter = Math.ceil(pendingPromos.length / pendingItemsPerPage);
            if(pendingCurrentPage > totalPagesAfter && totalPagesAfter > 0) {
                pendingCurrentPage = totalPagesAfter;
            }

            loadPromos();
        }
    }
    
    function deleteApprovedPromo(promoId) {
        if (!confirm('Anda yakin ingin menghapus promo yang sudah disetujui ini? Aksi ini akan langsung menghilangkannya dari landing page.')) return;
        let approvedPromos = JSON.parse(localStorage.getItem('approvedPromos')) || [];
        const updatedApproved = approvedPromos.filter(promo => promo.id !== promoId);
        localStorage.setItem('approvedPromos', JSON.stringify(updatedApproved));
        
        // Cek jika halaman jadi kosong setelah hapus
        const totalPagesAfter = Math.ceil(updatedApproved.length / approvedItemsPerPage);
        if (approvedCurrentPage > totalPagesAfter && totalPagesAfter > 0) {
            approvedCurrentPage = totalPagesAfter;
        }
        loadPromos();
    }

    // --- KODE LENGKAP DARI SISA FUNGSI AGAR TIDAK TERPOTONG ---
    function logAction(action, promo) {
        const logEntry = {
            timestamp: Date.now(), action: action, promoTitle: promo.title,
            tenant: promo.tenant, duration: promo.duration
        };
        const actionLog = JSON.parse(localStorage.getItem('actionLog')) || [];
        actionLog.push(logEntry);
        localStorage.setItem('actionLog', JSON.stringify(actionLog));
    }
    function loadActivityLog() {
        if (!logTableBody) return;
        let actionLog = JSON.parse(localStorage.getItem('actionLog')) || [];
        if (startDate) actionLog = actionLog.filter(log => log.timestamp >= startDate.getTime());
        if (endDate) { const endOfDay = new Date(endDate); endOfDay.setHours(23, 59, 59, 999); actionLog = actionLog.filter(log => log.timestamp <= endOfDay.getTime()); }
        if (searchTerm) actionLog = actionLog.filter(log => log.promoTitle.toLowerCase().includes(searchTerm) || log.tenant.toLowerCase().includes(searchTerm));
        const reversedLog = actionLog.slice().reverse();
        logTableBody.innerHTML = '';
        const start = (logCurrentPage - 1) * logRowsPerPage;
        const end = start + logRowsPerPage;
        const paginatedItems = reversedLog.slice(start, end);
        paginatedItems.forEach(log => {
            const row = document.createElement('tr');
            const date = new Date(log.timestamp).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            row.innerHTML = `<td>${date}</td><td class="action-approved">${log.action}</td><td>${log.promoTitle}</td><td>${log.tenant}</td><td>${formatDisplayDuration(log.duration)}</td><td><button class="log-delete-btn" data-timestamp="${log.timestamp}" title="Hapus log ini"><i class="fa-solid fa-trash-can"></i></button></td>`;
            logTableBody.appendChild(row);
        });
        setupLogPaginationControls(actionLog.length);
    }
    function setupLogPaginationControls(totalItems) {
        if (!logPaginationContainer) return;
        const totalPages = Math.ceil(totalItems / logRowsPerPage);
        if (totalPages <= 1) { logPaginationContainer.style.display = 'none'; } 
        else {
            logPaginationContainer.style.display = 'flex';
            logPageInput.value = logCurrentPage; logTotalPagesSpan.textContent = totalPages; logPageInput.max = totalPages;
            logPrevBtn.disabled = logCurrentPage === 1; logNextBtn.disabled = logCurrentPage === totalPages;
            logPrevBtn.classList.toggle('disabled', logCurrentPage === 1);
            logNextBtn.classList.toggle('disabled', logCurrentPage === totalPages);
        }
    }
    logPrevBtn.addEventListener('click', () => { if (logCurrentPage > 1) { logCurrentPage--; loadActivityLog(); } });
    logNextBtn.addEventListener('click', () => {
        let actionLog = JSON.parse(localStorage.getItem('actionLog')) || [];
        if (startDate) actionLog = actionLog.filter(log => log.timestamp >= startDate.getTime());
        if (endDate) { const endOfDay = new Date(endDate); endOfDay.setHours(23, 59, 59, 999); actionLog = actionLog.filter(log => log.timestamp <= endOfDay.getTime()); }
        if (searchTerm) actionLog = actionLog.filter(log => log.promoTitle.toLowerCase().includes(searchTerm) || log.tenant.toLowerCase().includes(searchTerm));
        const totalPages = Math.ceil(actionLog.length / logRowsPerPage);
        if (logCurrentPage < totalPages) { logCurrentPage++; loadActivityLog(); }
    });
    logPageInput.addEventListener('change', () => {
        let actionLog = JSON.parse(localStorage.getItem('actionLog')) || [];
        if (startDate) actionLog = actionLog.filter(log => log.timestamp >= startDate.getTime());
        if (endDate) { const endOfDay = new Date(endDate); endOfDay.setHours(23, 59, 59, 999); actionLog = actionLog.filter(log => log.timestamp <= endOfDay.getTime()); }
        if (searchTerm) actionLog = actionLog.filter(log => log.promoTitle.toLowerCase().includes(searchTerm) || log.tenant.toLowerCase().includes(searchTerm));
        const totalPages = Math.ceil(actionLog.length / logRowsPerPage);
        let targetPage = parseInt(logPageInput.value);
        if (isNaN(targetPage) || targetPage < 1) targetPage = 1;
        if (targetPage > totalPages) targetPage = totalPages;
        logCurrentPage = targetPage;
        loadActivityLog();
    });
    searchInput.addEventListener('input', () => { searchTerm = searchInput.value.toLowerCase(); logCurrentPage = 1; loadActivityLog(); });
    startDateInput.addEventListener('change', () => { startDate = startDateInput.value ? new Date(startDateInput.value) : null; logCurrentPage = 1; loadActivityLog(); });
    endDateInput.addEventListener('change', () => { endDate = endDateInput.value ? new Date(endDateInput.value) : null; logCurrentPage = 1; loadActivityLog(); });
    resetFilterBtn.addEventListener('click', () => {
        searchInput.value = ''; startDateInput.value = ''; endDateInput.value = '';
        searchTerm = ''; startDate = null; endDate = null;
        logCurrentPage = 1; loadActivityLog();
    });
    function downloadLogAsCSV() {
        let actionLog = JSON.parse(localStorage.getItem('actionLog')) || [];
        if (startDate) actionLog = actionLog.filter(log => log.timestamp >= startDate.getTime());
        if (endDate) { const endOfDay = new Date(endDate); endOfDay.setHours(23, 59, 59, 999); actionLog = actionLog.filter(log => log.timestamp <= endOfDay.getTime()); }
        if (searchTerm) actionLog = actionLog.filter(log => log.promoTitle.toLowerCase().includes(searchTerm) || log.tenant.toLowerCase().includes(searchTerm));
        if (actionLog.length === 0) { alert("Tidak ada data log untuk diunduh (sesuai filter saat ini)."); return; }
        const headers = ["Tanggal", "Waktu", "Keterangan", "Judul Promo", "Tenant", "Durasi"];
        let csvContent = headers.join(",") + "\n";
        actionLog.forEach(log => {
            const d = new Date(log.timestamp); const pad = (num) => String(num).padStart(2, '0');
            const date = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
            const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
            const title = `"${(log.promoTitle || '').replace(/"/g, '""')}"`;
            const durationText = formatDisplayDuration(log.duration);
            const row = [date, time, log.action, title, log.tenant, durationText];
            csvContent += row.join(",") + "\n";
        });
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url); link.setAttribute("download", `log_persetujuan_promo_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden'; document.body.appendChild(link); link.click(); document.body.removeChild(link);
        }
    }
    function deleteLogEntry(timestampToDelete) {
        let actionLog = JSON.parse(localStorage.getItem('actionLog')) || [];
        const updatedLog = actionLog.filter(log => log.timestamp !== timestampToDelete);
        localStorage.setItem('actionLog', JSON.stringify(updatedLog));
        let filteredLog = updatedLog;
        if (startDate) filteredLog = filteredLog.filter(log => log.timestamp >= startDate.getTime());
        if (endDate) { const endOfDay = new Date(endDate); endOfDay.setHours(23, 59, 59, 999); filteredLog = filteredLog.filter(log => log.timestamp <= endOfDay.getTime()); }
        if (searchTerm) filteredLog = filteredLog.filter(log => log.promoTitle.toLowerCase().includes(searchTerm) || log.tenant.toLowerCase().includes(searchTerm));
        const totalPagesAfter = Math.ceil(filteredLog.length / logRowsPerPage);
        if (logCurrentPage > totalPagesAfter && totalPagesAfter > 0) { logCurrentPage = totalPagesAfter; }
        loadActivityLog();
    }
    logTableBody.addEventListener('click', (event) => {
        const deleteButton = event.target.closest('.log-delete-btn');
        if (deleteButton) { const timestamp = Number(deleteButton.dataset.timestamp); if (confirm('Apakah Anda yakin ingin menghapus log ini secara permanen?')) { deleteLogEntry(timestamp); } }
    });
    approvedList.addEventListener('click', (event) => {
        const deleteButton = event.target.closest('.log-delete-btn');
        if (deleteButton) { const promoId = deleteButton.dataset.id; deleteApprovedPromo(promoId); }
    });
    downloadLogBtn.addEventListener('click', downloadLogAsCSV);
    function formatDisplayDuration(seconds) {
        const durationInSeconds = Number(seconds);
        switch (durationInSeconds) {
            case 3600: return "1 Jam";
            case 2592000: return "1 Bulan";
            case 7776000: return "3 Bulan";
            case 15552000: return "6 Bulan";
            case 31536000: return "1 Tahun";
            default: return `${seconds || 'N/A'} detik`;
        }
    }
    function formatTime(totalSeconds) {
        if (totalSeconds < 0) totalSeconds = 0;
        const days = Math.floor(totalSeconds / 86400); totalSeconds %= 86400;
        const hours = Math.floor(totalSeconds / 3600); totalSeconds %= 3600;
        const minutes = Math.floor(totalSeconds / 60); const seconds = totalSeconds % 60;
        const pad = (num) => String(num).padStart(2, '0');
        let result = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
        if (days > 0) { result = `${days} hari, ${result}`; }
        return result;
    }
    function startAdminCountdown(promo) {
        const timerElement = document.getElementById(`timer-admin-${promo.id}`);
        if (!timerElement) return;
        const endTime = promo.approvalTimestamp + (Number(promo.duration) * 1000);
        if (Date.now() >= endTime) {
            timerElement.textContent = 'Selesai';
            timerElement.classList.add('expired');
            return;
        }
        timerElement.classList.add('countdown');
        const timer = setInterval(() => {
            const now = Date.now();
            const timeLeft = Math.round((endTime - now) / 1000);
            if (timeLeft > 0) {
                timerElement.textContent = `Aktif: ${formatTime(timeLeft)}`;
            } else {
                timerElement.textContent = 'Selesai';
                timerElement.classList.remove('countdown');
                timerElement.classList.add('expired');
                clearInterval(timer);
            }
        }, 1000);
        activeTimers.push(timer);
    }
    function createPromoCard(promo, type) {
        const card = document.createElement('div');
        card.className = 'promo-card';
        card.dataset.id = promo.id;
        const imageUrl = promo.imageData || promo.imageUrl || 'https://via.placeholder.com/300x180.png?text=No+Image';
        const submissionDate = promo.submissionTimestamp ? new Date(promo.submissionTimestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
        let approvalDateHTML = '';
        if (promo.approvalTimestamp) {
            const approvalDate = new Date(promo.approvalTimestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
            approvalDateHTML = `<p><strong>Tgl. Disetujui:</strong> ${approvalDate}</p>`;
        }
        let actionBlock = '';
        if (type === 'pending') {
            actionBlock = `<div class="promo-actions"><button class="btn approve-btn">Setujui</button><button class="btn reject-btn">Tolak</button></div>`;
        } else {
            actionBlock = `<div class="promo-status"><div class="status-tag-admin" id="timer-admin-${promo.id}">Memuat status...</div><button class="log-delete-btn" data-id="${promo.id}" title="Hapus promo ini"><i class="fa-solid fa-trash-can"></i></button></div>`;
        }
        card.innerHTML = `<img src="${imageUrl}" alt="Gambar Promo"><div class="promo-info"><h3>${promo.title || 'Judul Tidak Tersedia'}</h3><p><strong>Tgl. Pengajuan:</strong> ${submissionDate}</p>${approvalDateHTML}<p><strong>Header Text:</strong> ${promo.headerText || 'Tidak ada'}</p><p><strong>Caption:</strong> ${promo.caption || 'Caption tidak tersedia'}</p><p><strong>Durasi:</strong> ${formatDisplayDuration(promo.duration)}</p><p><strong>Tenant:</strong> ${promo.tenant || 'Tenant tidak diketahui'}</p></div>${actionBlock}`;
        if (type === 'pending') {
            card.querySelector('.approve-btn').addEventListener('click', () => approvePromo(promo.id));
            card.querySelector('.reject-btn').addEventListener('click', () => rejectPromo(promo.id));
        }
        return card;
    }
    logoutBtn.addEventListener('click', () => { window.location.href = '../index.html'; });
    
    displayCurrentDate();
    loadPromos();
    loadActivityLog();
});