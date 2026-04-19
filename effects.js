(function () {
  'use strict';

  var MOBILE_BREAKPOINT  = 780;
  var MAX_TILT_DEGREES   = 18;
  var TILT_PERSPECTIVE   = 900;   /* px */
  var TILT_TRANSLATE_Z   = 14;    /* px */
  var TILT_SCALE         = 1.02;
  var CAMERA_FOLLOW_X    = 1.4;
  var CAMERA_FOLLOW_Y    = 0.9;
  var CAMERA_LERP_FACTOR = 0.025;
  var PARALLAX_COPY_X    = -16;   /* px per unit (−0.5…0.5) */
  var PARALLAX_COPY_Y    = -9;
  var PARALLAX_VISUAL_X  = 22;
  var PARALLAX_VISUAL_Y  = 13;

  /* ── 1. Three.js floating hero background ─────────────────── */
  var canvas = document.getElementById('hero-canvas');
  if (canvas && window.THREE) {
    var THREE = window.THREE;
    var scene = new THREE.Scene();
    var hero  = canvas.parentElement;
    var w     = hero.clientWidth;
    var h     = hero.clientHeight;

    var camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
    camera.position.z = 5;

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);

    var COLORS = [0x00b4d8, 0xcaf0f8, 0x90e0ef, 0x0077b6, 0x48cae4];

    function rnd(min, max) { return Math.random() * (max - min) + min; }

    var meshes = [];
    for (var i = 0; i < 22; i++) {
      var size = rnd(0.18, 0.68);
      var geo  = (i % 2 === 0)
        ? new THREE.IcosahedronGeometry(size, 0)
        : new THREE.OctahedronGeometry(size, 0);

      var mat = new THREE.MeshBasicMaterial({
        color:       COLORS[Math.floor(Math.random() * COLORS.length)],
        wireframe:   true,
        transparent: true,
        opacity:     rnd(0.12, 0.57),
      });

      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(rnd(-6, 6), rnd(-4, 4), rnd(-4, -0.5));
      mesh.userData.rx        = rnd(-0.007, 0.007);
      mesh.userData.ry        = rnd(-0.009, 0.009);
      mesh.userData.seed      = rnd(0, Math.PI * 2);
      mesh.userData.driftAmp  = rnd(0.08, 0.28);

      scene.add(mesh);
      meshes.push(mesh);
    }

    var targetCamX = 0, targetCamY = 0;
    var currentCamX = 0, currentCamY = 0;

    document.addEventListener('mousemove', function (e) {
      targetCamX =  (e.clientX / window.innerWidth  - 0.5) * CAMERA_FOLLOW_X;
      targetCamY = -(e.clientY / window.innerHeight - 0.5) * CAMERA_FOLLOW_Y;
    });

    function animate() {
      requestAnimationFrame(animate);
      var t = performance.now() * 0.001;

      for (var j = 0; j < meshes.length; j++) {
        var m = meshes[j];
        m.rotation.x += m.userData.rx;
        m.rotation.y += m.userData.ry;
        m.position.y += Math.sin(t + m.userData.seed)       * m.userData.driftAmp * 0.003;
        m.position.x += Math.cos(t * 0.65 + m.userData.seed) * m.userData.driftAmp * 0.002;
      }

      currentCamX += (targetCamX - currentCamX) * CAMERA_LERP_FACTOR;
      currentCamY += (targetCamY - currentCamY) * CAMERA_LERP_FACTOR;
      camera.position.x = currentCamX;
      camera.position.y = currentCamY;

      renderer.render(scene, camera);
    }
    animate();

    function onResize() {
      var parentEl = canvas.parentElement;
      var nw = parentEl.clientWidth;
      var nh = parentEl.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    }
    window.addEventListener('resize', onResize);
  }

  /* ── 2. Mouse-tracking 3D card tilt with shine ─────────────── */
  function applyTilt(card) {
    if (!card.querySelector('.card-shine')) {
      var shine = document.createElement('div');
      shine.className = 'card-shine';
      card.appendChild(shine);
    }

    card.addEventListener('mousemove', function (e) {
      if (window.innerWidth < MOBILE_BREAKPOINT) return;
      var rect   = card.getBoundingClientRect();
      var cx     = rect.left + rect.width  / 2;
      var cy     = rect.top  + rect.height / 2;
      var dx     = e.clientX - cx;
      var dy     = e.clientY - cy;
      var tiltY  = Math.max(-MAX_TILT_DEGREES, Math.min(MAX_TILT_DEGREES,  (dx / (rect.width  / 2)) * MAX_TILT_DEGREES));
      var tiltX  = Math.max(-MAX_TILT_DEGREES, Math.min(MAX_TILT_DEGREES, -(dy / (rect.height / 2)) * MAX_TILT_DEGREES));

      card.style.transform =
        'perspective(' + TILT_PERSPECTIVE + 'px) rotateX(' + tiltX + 'deg) rotateY(' + tiltY + 'deg) translateZ(' + TILT_TRANSLATE_Z + 'px) scale(' + TILT_SCALE + ')';

      var s  = card.querySelector('.card-shine');
      if (s) {
        var px = ((e.clientX - rect.left) / rect.width)  * 100;
        var py = ((e.clientY - rect.top)  / rect.height) * 100;
        s.style.background =
          'radial-gradient(circle at ' + px + '% ' + py + '%, rgba(255,255,255,0.18) 0%, transparent 65%)';
      }
    });

    card.addEventListener('mouseleave', function () {
      card.style.transform = '';
      var s = card.querySelector('.card-shine');
      if (s) s.style.background = '';
    });
  }

  function initTilt() {
    var cards = document.querySelectorAll('.tilt-card');
    for (var i = 0; i < cards.length; i++) {
      applyTilt(cards[i]);
    }
  }

  initTilt();

  /* ── 3. Hero content mouse parallax ─────────────────────────── */
  var heroCopy   = document.querySelector('.hero-copy');
  var heroVisual = document.querySelector('.hero-visual');

  document.addEventListener('mousemove', function (e) {
    if (window.innerWidth < MOBILE_BREAKPOINT) return;
    var x = e.clientX / window.innerWidth  - 0.5;
    var y = e.clientY / window.innerHeight - 0.5;
    if (heroCopy)   heroCopy.style.transform   = 'translate3d(' + (x * PARALLAX_COPY_X)   + 'px,' + (y * PARALLAX_COPY_Y)   + 'px,0)';
    if (heroVisual) heroVisual.style.transform = 'translate3d(' + (x * PARALLAX_VISUAL_X) + 'px,' + (y * PARALLAX_VISUAL_Y) + 'px,0)';
  });

}());
