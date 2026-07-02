/* ==========================================================================
   avatar.js
   Draws and animates the tutor's avatar as a single SVG. No external image
   assets — the face is built from vector shapes so every expression, blink,
   and "lip-sync" frame is just an attribute swap. This keeps the tutor
   fully self-contained and instantly responsive.
   ========================================================================== */

const Avatar = (() => {
  let svg, mouthEl, browLEl, browREl, eyeLEl, eyeREl, headGroup, handEl;
  let blinkTimer = null;
  let talkTimer = null;
  let mouthOpen = false;
  let expression = 'neutral'; // neutral | happy | encouraging | thinking

  const MOUTHS = {
    closed: 'M74 118 Q100 122 126 118',
    smallOpen: 'M76 116 Q100 130 124 116 Q100 124 76 116',
    wideOpen: 'M72 114 Q100 138 128 114 Q100 128 72 114',
    smile: 'M72 114 Q100 132 128 114',
  };

  function svgTemplate() {
    return `
      <defs>
        <radialGradient id="skinGrad" cx="45%" cy="35%" r="70%">
          <stop offset="0%" stop-color="#ffd9b0"/>
          <stop offset="100%" stop-color="#f0b988"/>
        </radialGradient>
        <linearGradient id="hairGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#3a2a20"/>
          <stop offset="100%" stop-color="#26190f"/>
        </linearGradient>
      </defs>

      <ellipse cx="100" cy="205" rx="46" ry="10" fill="#000" opacity=".18"/>

      <!-- torso / blazer -->
      <path d="M50 220 Q100 180 150 220 L150 220 Q100 205 50 220 Z" fill="var(--violet)"/>
      <path d="M46 222 C60 195 80 182 100 182 C120 182 140 195 154 222 L154 222 C140 200 122 190 100 190 C78 190 60 200 46 222 Z" fill="#3f3468"/>

      <g id="headGroup">
        <!-- neck -->
        <rect x="88" y="150" width="24" height="26" rx="8" fill="url(#skinGrad)"/>
        <!-- head -->
        <ellipse cx="100" cy="108" rx="52" ry="58" fill="url(#skinGrad)"/>
        <!-- hair -->
        <path d="M48 100 C46 60 70 32 100 32 C132 32 154 58 152 100 C146 78 132 62 100 62 C70 62 54 78 48 100Z" fill="url(#hairGrad)"/>
        <path d="M48 96 C46 122 50 138 58 150 C50 130 50 112 54 96 Z" fill="url(#hairGrad)"/>
        <path d="M152 96 C154 122 150 138 142 150 C150 130 150 112 146 96 Z" fill="url(#hairGrad)"/>

        <!-- eyebrows -->
        <path id="browL" d="M68 84 Q80 76 92 82" fill="none" stroke="#3a2a20" stroke-width="4" stroke-linecap="round"/>
        <path id="browR" d="M108 82 Q120 76 132 84" fill="none" stroke="#3a2a20" stroke-width="4" stroke-linecap="round"/>

        <!-- eyes -->
        <g id="eyeL">
          <ellipse cx="80" cy="100" rx="9" ry="9" fill="#fff"/>
          <circle cx="80" cy="100" r="4.6" fill="#3a2a20"/>
        </g>
        <g id="eyeR">
          <ellipse cx="120" cy="100" rx="9" ry="9" fill="#fff"/>
          <circle cx="120" cy="100" r="4.6" fill="#3a2a20"/>
        </g>

        <!-- nose -->
        <path d="M98 100 Q94 112 100 116 Q104 114 102 110" fill="none" stroke="#d99a68" stroke-width="2.4" stroke-linecap="round"/>

        <!-- mouth -->
        <path id="mouth" d="${MOUTHS.smile}" fill="none" stroke="#8a3f34" stroke-width="4.4" stroke-linecap="round"/>

        <!-- cheeks -->
        <ellipse cx="68" cy="118" rx="9" ry="6" fill="#ff9d7a" opacity=".28"/>
        <ellipse cx="132" cy="118" rx="9" ry="6" fill="#ff9d7a" opacity=".28"/>
      </g>

      <!-- gesturing hand -->
      <g id="handGroup" transform="translate(150,190) rotate(0)" opacity="0">
        <ellipse cx="0" cy="0" rx="12" ry="16" fill="url(#skinGrad)"/>
      </g>
    `;
  }

  function init(svgElement) {
    svg = svgElement;
    svg.innerHTML = svgTemplate();
    mouthEl = svg.querySelector('#mouth');
    browLEl = svg.querySelector('#browL');
    browREl = svg.querySelector('#browR');
    eyeLEl = svg.querySelector('#eyeL');
    eyeREl = svg.querySelector('#eyeR');
    headGroup = svg.querySelector('#headGroup');
    handEl = svg.querySelector('#handGroup');
    startBlinking();
    idleSway();
  }

  function startBlinking() {
    clearInterval(blinkTimer);
    blinkTimer = setInterval(() => {
      if (!eyeLEl) return;
      eyeLEl.style.transform = 'scaleY(0.12)';
      eyeREl.style.transform = 'scaleY(0.12)';
      eyeLEl.style.transformOrigin = '80px 100px';
      eyeREl.style.transformOrigin = '120px 100px';
      setTimeout(() => {
        eyeLEl.style.transform = 'scaleY(1)';
        eyeREl.style.transform = 'scaleY(1)';
      }, 130);
    }, 3200 + Math.random() * 2200);
  }

  function idleSway() {
    if (!headGroup) return;
    headGroup.style.transition = 'transform 2.6s ease-in-out';
    let dir = 1;
    setInterval(() => {
      dir *= -1;
      headGroup.style.transform = `translateY(${dir * 1.4}px) rotate(${dir * 0.6}deg)`;
    }, 2600);
  }

  function setExpression(name) {
    expression = name;
    if (!mouthEl) return;
    if (name === 'happy') mouthEl.setAttribute('d', MOUTHS.smile);
    else if (name === 'encouraging') mouthEl.setAttribute('d', MOUTHS.smallOpen);
    else if (name === 'thinking') mouthEl.setAttribute('d', MOUTHS.closed);
    else mouthEl.setAttribute('d', MOUTHS.smile);

    if (browLEl && browREl) {
      if (name === 'thinking') {
        browLEl.setAttribute('d', 'M68 80 Q80 74 92 80');
        browREl.setAttribute('d', 'M108 80 Q120 88 132 80');
      } else {
        browLEl.setAttribute('d', 'M68 84 Q80 76 92 82');
        browREl.setAttribute('d', 'M108 82 Q120 76 132 84');
      }
    }
  }

  /** Simple lip-sync: toggles mouth openness on each word boundary. */
  function talk(text, opts = {}) {
    setExpression('encouraging');
    gesture('point');
    SpeechModule.speak(text, {
      enabled: opts.voiceEnabled !== false,
      onStart: () => { opts.onStart && opts.onStart(); },
      onWord: () => {
        mouthOpen = !mouthOpen;
        if (mouthEl) mouthEl.setAttribute('d', mouthOpen ? MOUTHS.wideOpen : MOUTHS.smallOpen);
      },
      onEnd: () => {
        if (mouthEl) mouthEl.setAttribute('d', MOUTHS.smile);
        setExpression('happy');
        gestureReset();
        opts.onEnd && opts.onEnd();
      }
    });
  }

  function gesture(type) {
    if (!handEl) return;
    if (type === 'point') {
      handEl.style.transition = 'transform .4s ease, opacity .3s ease';
      handEl.style.opacity = '1';
      handEl.style.transform = 'translate(140px,150px) rotate(-25deg)';
    } else if (type === 'nod') {
      headGroup.style.transition = 'transform .25s ease';
      headGroup.style.transform = 'translateY(4px)';
      setTimeout(() => headGroup.style.transform = 'translateY(0)', 250);
    } else if (type === 'shake') {
      headGroup.style.transition = 'transform .18s ease';
      let n = 0;
      const shakeInt = setInterval(() => {
        headGroup.style.transform = `rotate(${n % 2 === 0 ? -5 : 5}deg)`;
        n++;
        if (n > 3) { clearInterval(shakeInt); headGroup.style.transform = 'rotate(0deg)'; }
      }, 90);
    }
  }

  function gestureReset() {
    if (!handEl) return;
    setTimeout(() => {
      handEl.style.opacity = '0';
      handEl.style.transform = 'translate(150px,190px) rotate(0deg)';
    }, 900);
  }

  function celebrate() {
    setExpression('happy');
    gesture('nod');
  }

  function sympathize() {
    setExpression('thinking');
    gesture('shake');
  }

  return { init, talk, setExpression, gesture, celebrate, sympathize };
})();
