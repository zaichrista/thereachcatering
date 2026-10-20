(() => {
  document.documentElement.classList.add('js');

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const logo = document.querySelector('.logo');
  const reach = document.querySelector('[data-drop]');
  const waves = [...document.querySelectorAll('[data-wave]')];

  // Split text into per-letter spans (originals are aria-hidden; the h1 carries the aria-label).
  const split = (el) => {
    const text = el.textContent;
    el.textContent = '';
    return [...text].map((c) => {
      const s = document.createElement('span');
      s.className = 'ch';
      s.textContent = c;
      el.append(s);
      return s;
    });
  };

  const reachLetters = split(reach);
  const waveLetters = waves.map(split);

  const css = (n) => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(n));
  const STAGGER = css('--drop-stagger') || 70;
  const DURATION = css('--drop-duration') || 1000;

  // --- Optical alignment ---------------------------------------------------------
  // Glyphs have side bearings, so box edges don't line up with the visible letter edges.
  // Measure the real ink edges and nudge "the" / "catering" so they sit flush with
  // the stem of the R and the stem of the H. Stored as a fraction of REACH's font size.
  function align() {
    const ctx = document.createElement('canvas').getContext('2d');
    const ink = (el, ch) => {
      const cs = getComputedStyle(el);
      ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const m = ctx.measureText(ch);
      return { left: -m.actualBoundingBoxLeft, right: m.width - m.actualBoundingBoxRight };
    };
    const rs = parseFloat(getComputedStyle(reach).fontSize);
    const ls = parseFloat(getComputedStyle(reach).letterSpacing) || 0;
    const R = ink(reach, 'R');
    const H = ink(reach, 'H');
    const the = ink(waves[0], 't');
    const dot = ink(waves[1], '.');
    logo.style.setProperty('--the-k', ((R.left - the.left) / rs).toFixed(5));
    // H carries trailing letter-spacing after it, "catering" carries none
    logo.style.setProperty('--cat-k', ((H.right + ls - dot.right) / rs).toFixed(5));
  }

  // --- Animation -----------------------------------------------------------------
  // Every letter (the A too) falls in already stretched tall, foot first, then compresses
  // down to its normal height. All one continuous motion:
  //   1. Fall: the foot accelerates down from above the frame while the letter grows to STRETCH x its height.
  //   2. Compress: the foot lands, the top keeps moving at the speed the foot had (so nothing pauses)
  //      and eases down into place, shrinking the letter back to 1x.
  function dropKeyframes(el) {
    const h = el.offsetHeight;
    const S = el.getBoundingClientRect().bottom + h; // start: whole letter just above the viewport
    const K = css('--reach-stretch') || 3.9;
    const fallMs = DURATION;
    const v = (2 * S) / fallMs;                       // foot speed at touchdown, px/ms
    const d = (K - 1) * h;                            // how far the top still has to travel
    const compressMs = (2.4 * d) / v;                 // keeps the top's ease-out from overshooting
    const total = fallMs + compressMs;
    const N = 160;
    const frames = [];
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * total;
      let foot, L;
      if (t <= fallMs) {
        const x = t / fallMs;
        foot = -S * (1 - x * x);                       // accelerating fall
        L = 1 + (K - 1) * (1 - (1 - x) ** 2);          // stretch grows, flat at touchdown
      } else {
        const u = (t - fallMs) / compressMs;
        const u2 = u * u, u3 = u2 * u;
        // cubic Hermite for the top edge: starts at -d with the foot's speed, ends at 0 at rest
        const top = (2 * u3 - 3 * u2 + 1) * -d + (u3 - 2 * u2 + u) * (v * compressMs) + (-2 * u3 + 3 * u2) * 0;
        foot = 0;
        L = 1 - top / h;
      }
      frames.push({
        transform: `translateY(${foot.toFixed(2)}px) scaleY(${L.toFixed(4)})`,
        opacity: 1,
        offset: i / N,
      });
    }
    return { frames, total };
  }

  function play() {
    const all = [...reachLetters, ...waveLetters.flat()];
    all.forEach((el) => el.getAnimations().forEach((a) => a.cancel()));

    if (reduced) {
      all.forEach((el) => (el.style.opacity = 1));
      return;
    }

    let total = 0;
    reachLetters.forEach((el, i) => {
      const k = dropKeyframes(el);
      total = k.total;
      el.animate(k.frames, { duration: k.total, delay: i * STAGGER, easing: 'linear', fill: 'both' });
    });

    // "the" and "catering": a quiet swell, staggered left to right, starting as REACH settles.
    const waveStart = total * 0.8 + reachLetters.length * STAGGER;
    waveLetters.forEach((letters, w) => {
      letters.forEach((el, i) => {
        el.animate(
          [
            { transform: 'translateY(0.45em)', opacity: 0, filter: 'blur(6px)' },
            { transform: 'translateY(0)', opacity: 1, filter: 'blur(0)' },
          ],
          { duration: 1500, delay: waveStart + w * 200 + i * 70, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both' },
        );
      });
    });
  }

  document.fonts.ready.then(() =>
    Promise.all([document.fonts.load('200 1em "sets-grotesk-m"'), document.fonts.load('600 1em "sets-grotesk-m"')])
      .catch(() => {})
      .then(() => {
        align();
        play();
      }),
  );
  document.querySelector('.replay').addEventListener('click', play);
})();
