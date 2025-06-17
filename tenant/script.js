document.addEventListener('DOMContentLoaded', () => {
    // Definisi elemen
    const promoForm = document.getElementById('promo-form');
    const titleInput = document.getElementById('title');
    const headerTextInput = document.getElementById('header-text');
    const captionInput = document.getElementById('caption');
    const durationInput = document.getElementById('duration');
    const successMessage = document.getElementById('success-message');
    const errorMessage = document.getElementById('error-message');
    const logoutBtn = document.getElementById('logout-btn');
    const tenantWelcome = document.getElementById('tenant-welcome');
    const imageUpload = document.getElementById('image-upload');
    const imagePreview = document.getElementById('image-preview');
    const imagePreviewContainer = document.querySelector('.image-preview-container');
    const fileInputLabel = document.querySelector('.file-input-label span');
    const promoStatusList = document.getElementById('promo-status-list');
    
    let activeTimers = [];
    const loggedInTenant = localStorage.getItem('loggedInTenant');

    if (!loggedInTenant) { window.location.href = '../index.html'; return; }
    
    tenantWelcome.textContent = `Dashboard Tenant: ${loggedInTenant}`;

    // --- FUNGSI FORMAT WAKTU DIPERBARUI ---
    function formatTime(totalSeconds) {
        if (totalSeconds < 0) totalSeconds = 0;
        
        const days = Math.floor(totalSeconds / 86400);
        totalSeconds %= 86400;
        const hours = Math.floor(totalSeconds / 3600);
        totalSeconds %= 3600;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        const pad = (num) => String(num).padStart(2, '0');
        
        let result = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
        if (days > 0) {
            result = `${days} hari, ${result}`;
        }
        return result;
    }

    function displayCurrentDate() {
        const dateElement = document.getElementById('current-date');
        if (!dateElement) return;
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Jakarta' };
        dateElement.textContent = now.toLocaleDateString('id-ID', options);
    }

    function loadMyPromos() {
        activeTimers.forEach(timer => clearInterval(timer));
        activeTimers = [];
        promoStatusList.innerHTML = '';
        const pendingPromos = JSON.parse(localStorage.getItem('pendingPromos')) || [];
        const approvedPromos = JSON.parse(localStorage.getItem('approvedPromos')) || [];
        const rejectedPromos = JSON.parse(localStorage.getItem('rejectedPromos')) || [];
        const allPromos = [...pendingPromos, ...approvedPromos, ...rejectedPromos];
        const myPromos = allPromos.filter(promo => promo.tenant === loggedInTenant);

        if (myPromos.length === 0) {
            promoStatusList.innerHTML = '<p class="empty-message">Anda belum pernah mengajukan promo.</p>';
            return;
        }

        myPromos.forEach(promo => {
            const card = document.createElement('div');
            card.className = 'status-card';
            card.id = `status-${promo.id}`;
            let statusBlock = '';
            let infoBlock = '';
            const submissionDate = new Date(promo.submissionTimestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
            infoBlock = `<div class="status-card-info"><h3>${promo.title}</h3><p>Diajukan: ${submissionDate}</p></div>`;

            if (promo.status === 'pending') {
                statusBlock = '<div class="status-tag pending">Menunggu Persetujuan</div>';
            } else if (promo.status === 'rejected') {
                statusBlock = `<div class="status-card-details"><div class="status-tag rejected">Tidak Disetujui</div><div class="rejection-reason"><strong>Alasan:</strong> ${promo.rejectionReason || 'Tidak ada alasan spesifik.'}</div><button class="revise-btn" data-promo-id="${promo.id}">Perbaiki</button></div>`;
            } else if (promo.status === 'approved') {
                 const approvalDate = new Date(promo.approvalTimestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                 infoBlock = `<div class="status-card-info"><h3>${promo.title}</h3><p>Diajukan: ${submissionDate}</p><p>Disetujui: ${approvalDate}</p></div>`;
                 const endTime = promo.approvalTimestamp + (Number(promo.duration) * 1000);
                 if (Date.now() < endTime) {
                     statusBlock = `<div class="status-tag countdown" id="timer-${promo.id}">Memuat...</div>`;
                     const timer = setInterval(() => {
                         const now = Date.now();
                         const timeLeft = Math.round((endTime - now) / 1000);
                         const timerElement = document.getElementById(`timer-${promo.id}`);
                         if (timerElement) {
                             if (timeLeft > 0) {
                                 timerElement.textContent = `Sisa Waktu: ${formatTime(timeLeft)}`;
                             } else {
                                 timerElement.textContent = 'Selesai';
                                 timerElement.className = 'status-tag expired';
                                 clearInterval(timer);
                             }
                         } else { clearInterval(timer); }
                     }, 1000);
                     activeTimers.push(timer);
                 } else {
                     statusBlock = '<div class="status-tag expired">Selesai</div>';
                 }
            }
            card.innerHTML = infoBlock + statusBlock;
            promoStatusList.appendChild(card);
        });
        document.querySelectorAll('.revise-btn').forEach(button => {
            button.addEventListener('click', () => handleRevise(button.dataset.promoId));
        });
    }

    function handleRevise(promoId) {
        let rejectedPromos = JSON.parse(localStorage.getItem('rejectedPromos')) || [];
        const promoToRevise = rejectedPromos.find(p => p.id === promoId);
        if (!promoToRevise) return;
        titleInput.value = promoToRevise.title;
        headerTextInput.value = promoToRevise.headerText;
        captionInput.value = promoToRevise.caption;
        durationInput.value = promoToRevise.duration;
        imagePreview.src = promoToRevise.imageData;
        imagePreviewContainer.classList.add('active');
        fileInputLabel.textContent = 'Pilih ulang gambar (wajib)';
        const updatedRejectedPromos = rejectedPromos.filter(p => p.id !== promoId);
        localStorage.setItem('rejectedPromos', JSON.stringify(updatedRejectedPromos));
        loadMyPromos();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        alert("Data promo telah dimuat ke form. Silakan perbaiki dan kirim ulang. Anda wajib memilih ulang file gambar.");
    }

    imageUpload.addEventListener('change', () => {
        const file = imageUpload.files[0];
        if (file) {
            imagePreviewContainer.classList.add('active');
            imagePreview.src = URL.createObjectURL(file);
            fileInputLabel.textContent = file.name;
        }
    });

    promoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        successMessage.style.display = 'none'; errorMessage.style.display = 'none';
        const file = imageUpload.files[0]; const duration = durationInput.value;
        if (!file || !titleInput.value || !headerTextInput.value || !captionInput.value || !duration) {
            errorMessage.textContent = 'Semua field, termasuk gambar dan durasi, harus diisi.';
            errorMessage.style.display = 'block'; return;
        }
        const reader = new FileReader();
        reader.onload = function(event) {
            const newPromo = {
                id: `promo-${Date.now()}`, submissionTimestamp: Date.now(),
                tenant: loggedInTenant, title: titleInput.value,
                headerText: headerTextInput.value, caption: captionInput.value,
                duration: duration, imageData: event.target.result, status: 'pending'
            };
            const pendingPromos = JSON.parse(localStorage.getItem('pendingPromos')) || [];
            pendingPromos.push(newPromo);
            localStorage.setItem('pendingPromos', JSON.stringify(pendingPromos));
            promoForm.reset(); imagePreviewContainer.classList.remove('active');
            imagePreview.src = '#'; fileInputLabel.textContent = 'Pilih file...';
            successMessage.textContent = 'Promo berhasil dikirim dan sedang menunggu persetujuan admin.';
            successMessage.style.display = 'block';
            loadMyPromos(); setTimeout(() => { successMessage.style.display = 'none'; }, 4000);
        };
        reader.readAsDataURL(file);
    });
    
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('loggedInTenant'); window.location.href = '../index.html';
    });

    displayCurrentDate();
    loadMyPromos();
});