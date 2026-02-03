// Smooth scrolling για links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return; // Skip empty links
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// EmailJS Configuration
emailjs.init("49oIc0IIO21wWTa5p");
const serviceID = "service_3pbi8oj";
const templateID = "template_tnphm2l";

// Package Selection & Form Handling
const form = document.getElementById('applyForm');
const msg = document.getElementById('successMsg');
const btn = document.getElementById('submitBtn');
const pkgBtns = document.querySelectorAll('.package-btn');
const pkgInput = document.getElementById('selectedPackage');
const investmentInput = document.getElementById('investment');

if (pkgBtns.length > 0) {
    pkgBtns.forEach(b => {
        b.addEventListener('click', () => {
            pkgBtns.forEach(x => x.classList.remove('selected'));
            b.classList.add('selected');
            pkgInput.value = b.dataset.package;
            investmentInput.value = b.dataset.value || '';
        });
    });
}

const ctaBtn = document.getElementById('ctaBtn');
if (ctaBtn) {
    ctaBtn.addEventListener('click', () => {
        const formSection = document.getElementById('formSection');
        if (formSection) {
            formSection.scrollIntoView({ behavior: 'smooth' });
        }
    });
}

if (form) {
    form.addEventListener('submit', async e => {
        e.preventDefault();
        if (!form.name.value.trim() || !form.email.value.trim() || !form.phone.value.trim()) {
            msg.textContent = "Please fill in Name, Email and Phone";
            msg.className = "success-msg error";
            return;
        }

        btn.textContent = "SENDING...";
        btn.disabled = true;
        msg.textContent = "";
        msg.className = "success-msg";

        const params = {
            name: form.name.value.trim(),
            email: form.email.value.trim(),
            phone: form.phone.value.trim(),
            investment: investmentInput.value ? investmentInput.value + " EUR" : "—",
            package: pkgInput.value || "Not selected",
            reply_to: form.email.value.trim()
        };

        try {
            await emailjs.send(serviceID, templateID, params);
            msg.textContent = "Application sent successfully! We'll contact you soon.";
            msg.className = "success-msg success";
            form.reset();
            investmentInput.value = "";
            pkgBtns.forEach(b => b.classList.remove('selected'));
            pkgInput.value = "";
        } catch (err) {
            console.error("EmailJS Error:", err);
            msg.textContent = "Failed to send: " + (err.text || "Check console (F12)");
            msg.className = "success-msg error";
        } finally {
            btn.textContent = "SEND APPLICATION";
            btn.disabled = false;
        }
    });
}