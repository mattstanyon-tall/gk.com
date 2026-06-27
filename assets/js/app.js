/* =========================================================================
   GK — interactive behaviours for the mockup
   No frameworks. Pure DOM.
   ========================================================================= */

(function () {
  'use strict';

  // ---------- Reveal on scroll ----------
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  // ---------- Mega-menu ----------
  const triggers = document.querySelectorAll('[data-mega-trigger]');
  const megas = document.querySelectorAll('[data-mega]');
  let openMega = null;
  let megaCloseTimer = null;

  function closeMega() {
    megas.forEach((m) => m.classList.remove('is-open'));
    triggers.forEach((t) => t.setAttribute('aria-expanded', 'false'));
    openMega = null;
  }

  function openMegaById(id) {
    closeMega();
    const panel = document.querySelector(`[data-mega="${id}"]`);
    const trigger = document.querySelector(`[data-mega-trigger="${id}"]`);
    if (panel) panel.classList.add('is-open');
    if (trigger) trigger.setAttribute('aria-expanded', 'true');
    openMega = id;
  }

  triggers.forEach((t) => {
    const id = t.getAttribute('data-mega-trigger');
    t.addEventListener('mouseenter', () => {
      clearTimeout(megaCloseTimer);
      openMegaById(id);
    });
    t.addEventListener('focus', () => openMegaById(id));
    t.addEventListener('click', (e) => {
      e.preventDefault();
      if (openMega === id) closeMega();
      else openMegaById(id);
    });
    t.addEventListener('mouseleave', () => {
      megaCloseTimer = setTimeout(closeMega, 200);
    });
  });

  megas.forEach((m) => {
    m.addEventListener('mouseenter', () => clearTimeout(megaCloseTimer));
    m.addEventListener('mouseleave', () => {
      megaCloseTimer = setTimeout(closeMega, 200);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMega();
  });

  // ---------- Drawers (cart, language) ----------
  const backdrop = document.querySelector('[data-backdrop]');

  function openDrawer(id) {
    const drawer = document.querySelector(`[data-drawer="${id}"]`);
    if (!drawer) return;
    drawer.classList.add('is-open');
    if (backdrop) backdrop.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawers() {
    document.querySelectorAll('[data-drawer]').forEach((d) => d.classList.remove('is-open'));
    if (backdrop) backdrop.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('[data-drawer-open]').forEach((btn) => {
    btn.addEventListener('click', () => openDrawer(btn.getAttribute('data-drawer-open')));
  });
  document.querySelectorAll('[data-drawer-close]').forEach((btn) => {
    btn.addEventListener('click', closeDrawers);
  });
  if (backdrop) backdrop.addEventListener('click', closeDrawers);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawers(); });

  // ---------- Cart store (localStorage) ----------
  const CART_KEY = 'gk_cart_v1';

  function readCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
    catch { return []; }
  }
  function writeCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    renderCart();
  }
  function addToCart(item) {
    const cart = readCart();
    cart.push(item);
    writeCart(cart);
  }
  function removeFromCart(idx) {
    const cart = readCart();
    cart.splice(idx, 1);
    writeCart(cart);
  }
  function renderCart() {
    const cart = readCart();
    const count = cart.length;
    document.querySelectorAll('[data-cart-count]').forEach((el) => {
      el.textContent = count;
      el.classList.toggle('is-visible', count > 0);
    });
    const list = document.querySelector('[data-cart-list]');
    const total = document.querySelector('[data-cart-total]');
    if (!list) return;
    if (count === 0) {
      list.innerHTML = `
        <div style="text-align:center; padding: 48px 0;">
          <p class="t-mono t-subtle" style="margin-bottom: 16px;">CART IS EMPTY</p>
          <a href="training.html" class="btn btn-outline btn-sm">Browse training</a>
        </div>`;
      if (total) total.textContent = '£0';
      return;
    }
    list.innerHTML = cart.map((it, i) => `
      <div style="display:flex; gap:14px; padding:18px 0; border-bottom: 1px solid var(--surface-border);">
        <div style="width:6px; align-self:stretch; background:${it.color || 'var(--ink-900)'}; border-radius:2px; flex-shrink:0;"></div>
        <div style="flex:1; min-width:0;">
          <div class="t-mono" style="font-size:.7rem; color:var(--fg-muted); letter-spacing:.1em;">${it.vendor} · ${it.code}</div>
          <div style="font-weight:600; margin: 4px 0 6px; font-size:.95rem; line-height:1.3;">${it.title}</div>
          <div class="t-mono" style="font-size:.7rem; color:var(--fg-muted);">
            ${it.date} · ${it.modality} · ${it.location || 'Virtual'}
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-family:var(--font-display); font-weight:600;">${it.price}</div>
          <button class="t-mono" data-cart-remove="${i}" style="background:none; border:none; padding:0; margin-top:8px; font-size:.65rem; color:var(--fg-muted); letter-spacing:.1em; cursor:pointer; text-transform:uppercase;">Remove</button>
        </div>
      </div>
    `).join('');
    const sum = cart.reduce((s, it) => s + (it.priceValue || 0), 0);
    if (total) total.textContent = '£' + sum.toLocaleString('en-GB');
    list.querySelectorAll('[data-cart-remove]').forEach((btn) => {
      btn.addEventListener('click', () => removeFromCart(+btn.getAttribute('data-cart-remove')));
    });
  }

  // Add-to-cart buttons (data attributes on the button)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-add-to-cart]');
    if (!btn) return;
    e.preventDefault();
    addToCart({
      code: btn.dataset.code,
      title: btn.dataset.title,
      vendor: btn.dataset.vendor,
      date: btn.dataset.date,
      modality: btn.dataset.modality,
      location: btn.dataset.location,
      price: btn.dataset.price,
      priceValue: +btn.dataset.priceValue || 0,
      color: btn.dataset.color
    });
    // Tiny feedback
    const original = btn.textContent;
    btn.textContent = 'Added ✓';
    btn.style.background = 'var(--build-500)';
    btn.style.color = 'var(--ink-900)';
    setTimeout(() => {
      btn.textContent = original;
      btn.style.background = '';
      btn.style.color = '';
      openDrawer('cart');
    }, 450);
  });

  renderCart();

  // ---------- Language switcher ----------
  document.querySelectorAll('[data-lang]').forEach((el) => {
    el.addEventListener('click', () => {
      const code = el.getAttribute('data-lang');
      localStorage.setItem('gk_lang', code);
      document.querySelectorAll('[data-lang-current]').forEach((c) => c.textContent = code.toUpperCase());
      closeDrawers();
    });
  });
  const savedLang = localStorage.getItem('gk_lang') || 'en';
  document.querySelectorAll('[data-lang-current]').forEach((c) => c.textContent = savedLang.toUpperCase());

  // ---------- Diagnose quiz (used on /diagnose) ----------
  const quiz = document.querySelector('[data-quiz]');
  if (quiz) {
    let step = 0;
    const answers = {};
    const steps = quiz.querySelectorAll('[data-quiz-step]');
    const progress = quiz.querySelector('[data-quiz-progress]');

    function show(n) {
      steps.forEach((s, i) => s.classList.toggle('is-active', i === n));
      if (progress) {
        progress.style.setProperty('--p', ((n + 1) / steps.length) * 100 + '%');
        progress.setAttribute('data-step', `${n + 1} / ${steps.length}`);
      }
    }
    show(0);

    quiz.addEventListener('click', (e) => {
      const opt = e.target.closest('[data-quiz-option]');
      if (opt) {
        const key = opt.closest('[data-quiz-step]').dataset.quizKey;
        answers[key] = opt.dataset.quizOption;
        // visual mark
        opt.closest('[data-quiz-step]').querySelectorAll('[data-quiz-option]').forEach((o) => o.classList.remove('is-chosen'));
        opt.classList.add('is-chosen');
        return;
      }
      const next = e.target.closest('[data-quiz-next]');
      if (next) {
        if (step < steps.length - 1) {
          step++;
          show(step);
        } else {
          // show result
          const result = quiz.querySelector('[data-quiz-result]');
          if (result) {
            result.classList.add('is-active');
            steps.forEach((s) => s.classList.remove('is-active'));
            renderQuizResult(answers, result);
          }
        }
      }
      const back = e.target.closest('[data-quiz-back]');
      if (back && step > 0) {
        step--;
        show(step);
      }
    });
  }

  function renderQuizResult(answers, el) {
    const recos = {
      cybersecurity: {
        title: 'Cybersecurity programme',
        href: 'programme-cybersecurity.html',
        why: 'You described a defence and assurance problem. That is what this discipline is built for.',
        courses: [
          { code: 'CISSP', title: 'CISSP Certification Boot Camp', price: '£3,495' },
          { code: 'SC-200', title: 'Microsoft Security Operations Analyst', price: '£2,545' }
        ]
      },
      ai: {
        title: 'AI Transformation programme',
        href: 'programme-ai.html',
        why: 'You named adoption, governance, and value capture — the three things this programme is structured around.',
        courses: [
          { code: 'M-AI200', title: 'Develop AI cloud solutions on Azure', price: '£3,245' },
          { code: 'AWS-MLE', title: 'AWS Machine Learning Engineer', price: '£2,795' }
        ]
      },
      people: {
        title: 'People Skills programme',
        href: 'programme-people.html',
        why: 'Capability is about how people work, not just what they know. Lead, communicate, decide.',
        courses: [
          { code: 'P2AFP', title: 'PRINCE2 Agile Foundation + Practitioner', price: '£2,495' },
          { code: 'ITIL4CDS', title: 'ITIL 4 Specialist: Create, Deliver, Support', price: '£2,045' }
        ]
      }
    };
    const pick = answers.area || 'cybersecurity';
    const r = recos[pick];
    el.innerHTML = `
      <div class="t-eyebrow" style="margin-bottom: 16px;"><span class="dot"></span>Your direction</div>
      <h2 class="t-display" style="margin: 0 0 16px;">${r.title}</h2>
      <p class="t-muted" style="font-size: 1.15rem; max-width: 60ch; margin: 0 0 32px;">${r.why}</p>
      <div class="grid cols-2" style="margin-bottom: 40px;">
        <a href="${r.href}" class="card is-hoverable" style="text-decoration:none;">
          <div class="t-eyebrow" style="margin-bottom:8px;">Programme</div>
          <h3 class="t-h3" style="margin:0 0 8px;">See the Blueprint applied</h3>
          <p class="t-muted" style="margin:0; font-size:.95rem;">Diagnose · Design · Deliver · Prove. The four-step engagement, with named experts and case studies.</p>
        </a>
        <a href="training.html" class="card is-hoverable" style="text-decoration:none;">
          <div class="t-eyebrow" style="margin-bottom:8px;">Start now</div>
          <h3 class="t-h3" style="margin:0 0 8px;">Or take a class next week</h3>
          <p class="t-muted" style="margin:0; font-size:.95rem;">${r.courses.map(c => c.title).join(' · ')}. Guaranteed to run.</p>
        </a>
      </div>
      <a href="for-business.html" class="btn btn-primary">Talk to a programme lead<svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
    `;
  }
})();
