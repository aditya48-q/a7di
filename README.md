# a7di — Aditya Gupta's 3D Portfolio

A premium portfolio website featuring an interactive **Three.js 3D background**, CSS 3D card effects, holographic text animations, and a fully functional **Node.js/Express contact form backend** with Nodemailer.

---

## ✨ Features

- **Three.js Hero Scene** — Animated particle field, floating 3D geometric objects (icosahedron, octahedron, torus, tetrahedron, dodecahedron) with wireframe overlays and a morphing central geometry; camera gently follows the mouse cursor.
- **CSS 3D Card Tilt** — All cards (projects, skills, about, contact) react to mouse movement with a smooth perspective tilt using CSS `perspective` and `rotateX`/`rotateY`.
- **Holographic Headings** — Section headings shimmer with a cyan-to-blue gradient animation.
- **3D Card Flip** — Project cards support a click-triggered 3D flip effect (progressive enhancement).
- **Contact Form Backend** — `/api/contact` endpoint powered by Express + Nodemailer; validates inputs server-side and sends an email to your inbox.
- **Toast Notifications** — Animated success/error toasts with spring entrance animation.
- **Loading State** — Submit button shows a spinner and disables while the request is in flight.
- **Accessible** — Skip-link, `aria-live` toast, `prefers-reduced-motion` respected (Three.js canvas hidden, animations disabled).

---

## 🗂 Project Structure

```
a7di/
├── index.html        # Main HTML — Three.js canvas, updated contact form
├── style.css         # All styles including new 3D, toast, and loading CSS
├── main.js           # Three.js scene setup + card tilt + contact form JS
├── server.js         # Express backend for /api/contact
├── package.json      # Node.js dependencies
├── .env.example      # Environment variable template
└── README.md
```

---

## 🚀 Getting Started

### Frontend only (static)

Open `index.html` directly in a browser. The 3D animations work immediately. The contact form will show a network error without the backend running — that is expected.

### With backend (contact form enabled)

**1. Install dependencies**

```bash
npm install
```

**2. Configure environment**

```bash
cp .env.example .env
```

Edit `.env` and fill in your SMTP credentials:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
RECIPIENT_EMAIL=your-email@gmail.com
PORT=3000
```

> **Gmail users**: generate an [App Password](https://myaccount.google.com/apppasswords) and use it as `EMAIL_PASS`. Do **not** use your regular Gmail password.

**3. Start the server**

```bash
npm start
```

Visit **http://localhost:3000** — the contact form is now fully functional.

---

## 🔧 Environment Variables

| Variable           | Description                                               | Default           |
|--------------------|-----------------------------------------------------------|-------------------|
| `SMTP_HOST`        | SMTP server hostname                                      | `smtp.gmail.com`  |
| `SMTP_PORT`        | SMTP port                                                 | `587`             |
| `SMTP_SECURE`      | Use TLS (`true` for port 465)                             | `false`           |
| `EMAIL_USER`       | SMTP account username (sender address)                    | —                 |
| `EMAIL_PASS`       | SMTP account password / app password                      | —                 |
| `RECIPIENT_EMAIL`  | Address that receives contact form submissions            | Same as `EMAIL_USER` |
| `PORT`             | HTTP port for the Express server                          | `3000`            |

---

## 🛠 Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | HTML5, CSS3, JavaScript (ES2020)    |
| 3D        | Three.js r134 (CDN)                 |
| Animations| AOS 2.3.4 (CDN), CSS keyframes      |
| Backend   | Node.js ≥ 18, Express 4             |
| Email     | Nodemailer 6                        |

---

## 📄 License

MIT

