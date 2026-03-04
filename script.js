const navToggle = document.getElementById("navToggle");
const navLinks  = document.getElementById("navLinks");

navToggle?.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

const links = Array.from(document.querySelectorAll(".nav-links a"));
links.forEach((a) => {
  a.addEventListener("click", () => {
    navLinks.classList.remove("open");
    navToggle?.setAttribute("aria-expanded", "false");
    links.forEach((l) => l.classList.remove("active"));
    a.classList.add("active");
  });
});

// ─── Hero video ───────────────────────────────────────────────────────────────
const video     = document.getElementById("heroVideo");
const toggleBtn = document.getElementById("videoToggle");
const muteBtn   = document.getElementById("videoMute");

async function tryAutoplay() {
  if (!video) return;
  try {
    video.muted = true;
    await video.play();
    if (toggleBtn) toggleBtn.textContent = "Pause";
    if (muteBtn)   muteBtn.textContent   = "Unmute";
  } catch {
    if (toggleBtn) toggleBtn.textContent = "Play";
    if (muteBtn)   muteBtn.textContent   = video.muted ? "Unmute" : "Mute";
  }
}

toggleBtn?.addEventListener("click", async () => {
  if (!video) return;
  if (video.paused) {
    try { await video.play(); toggleBtn.textContent = "Pause"; } catch {}
  } else {
    video.pause(); toggleBtn.textContent = "Play";
  }
});

muteBtn?.addEventListener("click", () => {
  if (!video) return;
  video.muted = !video.muted;
  muteBtn.textContent = video.muted ? "Unmute" : "Mute";
});

// ─── Intro overlay ────────────────────────────────────────────────────────────
const introOverlay = document.getElementById("introOverlay");
const introVideo   = document.getElementById("introVideo");
const brandMark    = document.querySelector(".brand-mark");
const brandLogo    = document.getElementById("brandLogo");
const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

function lockScroll(locked) { document.body.classList.toggle("is-locked", Boolean(locked)); }
function showNavbarLogo()   { if (brandLogo) brandLogo.classList.add("is-visible"); }
async function startHero()  { if (!video) return; video.loop = true; video.muted = true; await tryAutoplay(); }

function createMorphLogoAtCenter() {
  const el  = document.createElement("div");
  el.className = "intro-morph-logo";
  el.setAttribute("aria-hidden", "true");
  const size = 120;
  el.style.left = `${(window.innerWidth  - size) / 2}px`;
  el.style.top  = `${(window.innerHeight - size) / 2}px`;
  const img = document.createElement("img");
  img.src = "assets/image/logo.png"; img.alt = "";
  el.appendChild(img);
  document.body.appendChild(el);
  return el;
}

function computeTransformToTarget(fromEl, toEl) {
  const from = fromEl.getBoundingClientRect();
  const to   = toEl.getBoundingClientRect();
  return {
    dx: to.left - from.left, dy: to.top - from.top,
    scaleX: to.width / from.width, scaleY: to.height / from.height,
  };
}

let introEnding = false;
function endIntro() {
  if (introEnding) return;
  introEnding = true;
  startHero();
  if (!introOverlay || !introVideo || !brandMark) { showNavbarLogo(); lockScroll(false); return; }
  if (prefersReducedMotion) {
    showNavbarLogo(); lockScroll(false);
    introOverlay.classList.add("is-dimming");
    window.setTimeout(() => introOverlay.remove(), 500);
    return;
  }
  introOverlay.classList.add("is-dimming");
  introOverlay.setAttribute("aria-hidden", "true");
  const morph = createMorphLogoAtCenter();
  const t = computeTransformToTarget(morph, brandMark);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      morph.style.transform = `translate(${t.dx}px, ${t.dy}px) scale(${t.scaleX}, ${t.scaleY})`;
    });
  });
  morph.addEventListener("transitionend", () => {
    showNavbarLogo(); morph.style.opacity = "0";
    window.setTimeout(() => { morph.remove(); introOverlay.remove(); lockScroll(false); }, 380);
  }, { once: true });
}

function initIntro() {
  if (!introOverlay || !introVideo) { tryAutoplay(); return; }
  lockScroll(true);
  introVideo.muted = true; introVideo.playsInline = true;
  introVideo.addEventListener("ended", endIntro, { once: true });
}
initIntro();

// ─── Service card modals ──────────────────────────────────────────────────────
/**
 * Layout of 6 cards (position in grid):
 *   1  2  3
 *   4  5  6
 *
 * Modal animation pairs (as requested):
 *   Card 1 → LEFT   Card 2 → RIGHT
 *   Card 3 → LEFT   Card 4 → RIGHT
 *   Card 5 → LEFT   Card 6 → RIGHT
 *
 * Odd index (0,2,4) = left panel  |  Even index (1,3,5) = right panel
 */

let currentModal = null;

function openModal(modal) {
  if (currentModal) closeModal(currentModal, false);
  modal.removeAttribute("hidden");
  // Force reflow so the transition plays from the off-screen start position
  modal.getBoundingClientRect();
  modal.classList.add("is-open");
  currentModal = modal;
  document.body.classList.add("is-locked");
  // Focus close button for accessibility
  modal.querySelector(".svc-modal__close")?.focus();
}

function closeModal(modal, unlock = true) {
  modal.classList.remove("is-open");
  const panel = modal.querySelector(".svc-modal__panel");
  const onEnd = () => {
    modal.setAttribute("hidden", "");
    panel.removeEventListener("transitionend", onEnd);
  };
  panel.addEventListener("transitionend", onEnd, { once: true });
  if (unlock) { document.body.classList.remove("is-locked"); currentModal = null; }
}

// Wire up each card's button
document.querySelectorAll(".svc-card").forEach((card) => {
  const btn     = card.querySelector(".svc-card__btn");
  const modalId = card.dataset.modal;
  const modal   = document.getElementById(modalId);
  if (!btn || !modal) return;

  btn.addEventListener("click", () => openModal(modal));

  // Close on backdrop click
  modal.querySelector(".svc-modal__backdrop")?.addEventListener("click", () => closeModal(modal));

  // Close on × button
  modal.querySelector(".svc-modal__close")?.addEventListener("click", () => closeModal(modal));
});

// Close on Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && currentModal) closeModal(currentModal);
});