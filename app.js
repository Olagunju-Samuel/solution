(function () {
  const SCREENS = ["login", "student", "lecturer", "admin"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const charts = {};
  let chartsReady = false;

  const backdrop = document.getElementById("sidebar-backdrop");
  const authMessage = document.getElementById("auth-message");

  NSUAuth.seedDemoAccounts();

  function showAuthMessage(text, type) {
    if (!authMessage) return;
    if (!text) {
      authMessage.hidden = true;
      return;
    }
    authMessage.hidden = false;
    authMessage.textContent = text;
    authMessage.className = "auth-message auth-message--" + (type || "error");
  }

  function getSelectedRole() {
    const active = document.querySelector(".role-card--active");
    return active?.dataset.role || "student";
  }

  function setAuthTab(tab) {
    const isRegister = tab === "register";
    document.querySelectorAll(".auth-tabs__btn").forEach((b) => {
      b.classList.toggle("auth-tabs__btn--active", b.dataset.authTab === tab);
    });
    document.querySelectorAll(".auth-panel").forEach((p) => {
      const show = p.dataset.authPanel === tab;
      p.hidden = !show;
      p.classList.toggle("auth-panel--active", show);
    });
    document.querySelector('[data-role="admin"]')?.classList.toggle("hidden", isRegister);
    if (isRegister && getSelectedRole() === "admin") {
      document.querySelector('[data-role="student"]')?.click();
    }
    updateRegisterIdLabel();
    showAuthMessage("");
  }

  function updateRegisterIdLabel() {
    const label = document.getElementById("register-id-label");
    if (!label) return;
    const role = getSelectedRole();
    label.firstChild.textContent = role === "lecturer" ? "Staff ID " : "Student ID ";
  }

  function closeSidebar() {
    document.querySelectorAll("[data-sidebar]").forEach((s) => s.classList.remove("is-open"));
    backdrop?.classList.remove("is-visible");
    document.body.style.overflow = "";
  }

  function openSidebar(sidebar) {
    closeSidebar();
    sidebar?.classList.add("is-open");
    backdrop?.classList.add("is-visible");
    document.body.style.overflow = "hidden";
  }

  function firstName(fullName) {
    return (fullName || "").trim().split(/\s+/)[0] || "there";
  }

  function applyUserToPortal(role, user) {
    const screen = document.getElementById(role);
    if (!screen || !user) return;

    const initials = NSUAuth.initials(user.fullName);
    screen.querySelectorAll("[data-user-name]").forEach((el) => {
      el.textContent = user.fullName;
    });
    screen.querySelectorAll("[data-user-initials]").forEach((el) => {
      el.textContent = initials;
    });
    screen.querySelectorAll("[data-welcome-title]").forEach((el) => {
      el.textContent =
        role === "student"
          ? `Welcome back, ${firstName(user.fullName)}`
          : `${user.fullName}`;
    });

    const email = screen.querySelector("[data-profile-email]");
    const pid = screen.querySelector("[data-profile-id]");
    const dept = screen.querySelector("[data-profile-dept]");
    if (email) email.textContent = user.email;
    if (pid) pid.textContent = user.idNumber;
    if (dept) dept.textContent = user.department || "—";

  if (role === "student" && user.stats) {
      const s = user.stats;
      screen.querySelectorAll("[data-stat-attendance]").forEach((el) => (el.textContent = s.attendance + "%"));
      screen.querySelectorAll("[data-stat-gpa]").forEach((el) => (el.textContent = s.gpa));
      screen.querySelectorAll("[data-stat-courses]").forEach((el) => (el.textContent = s.courses));
      screen.querySelectorAll("[data-student-alerts]").forEach((el) => (el.textContent = s.alerts));
      const riskEl = screen.querySelector("[data-profile-risk]");
      if (riskEl) riskEl.textContent = (s.risk || "low") + " risk";

      fillList("student-attendance-list", [
        { dot: "green", text: "CSC 201 — Present", time: "Today" },
        { dot: "green", text: "MTH 102 — Present", time: "Yesterday" },
        { dot: "orange", text: "PHY 101 — Absent", time: "2 days ago" },
      ]);
      fillList("student-alerts-list", [
        { dot: "green", text: "Risk level updated", time: "2h ago" },
        { dot: "orange", text: "Missed class reminder", time: "1d ago" },
      ]);
      fillGrades();
    }

    if (role === "lecturer") {
      const list = document.getElementById("lecturer-classes-list");
      if (list) {
        list.innerHTML = `
          <ul class="alert-list">
            <li><span class="dot dot--green"></span> CSC 301 — 42 students</li>
            <li><span class="dot dot--green"></span> CSC 201 — 38 students</li>
            <li><span class="dot dot--green"></span> MTH 102 — 48 students</li>
          </ul>`;
      }
    }
  }

  function fillList(id, items) {
    const ul = document.getElementById(id);
    if (!ul) return;
    ul.innerHTML = items
      .map(
        (i) =>
          `<li><span class="dot dot--${i.dot}"></span> ${i.text} <time>${i.time}</time></li>`
      )
      .join("");
  }

  function fillGrades() {
    const tbody = document.getElementById("student-grades-list");
    if (!tbody) return;
    const courses = [
      ["Computer Science 201", "A", "Excellent"],
      ["Mathematics 102", "B+", "Good"],
      ["Physics 101", "B", "Good"],
      ["English 101", "A-", "Excellent"],
      ["Statistics 201", "B+", "Good"],
    ];
    tbody.innerHTML = courses
      .map(([c, g, s]) => `<tr><td>${c}</td><td>${g}</td><td>${s}</td></tr>`)
      .join("");
  }

  function showPortalPage(role, pageId) {
    const portal = document.querySelector(`[data-portal="${role}"]`);
    if (!portal) return;
    portal.querySelectorAll(".portal-page").forEach((p) => {
      p.classList.toggle("portal-page--active", p.dataset.page === pageId);
    });
    document.querySelectorAll(`[data-portal-nav="${role}"] a[data-page]`).forEach((a) => {
      a.classList.toggle("active", a.dataset.page === pageId);
    });
    closeSidebar();
  }

  function showScreen(id) {
    const screenId = SCREENS.includes(id) ? id : "login";
    const session = NSUAuth.getSession();

    if ((screenId === "student" || screenId === "lecturer") && !session) {
      document.querySelectorAll(".screen").forEach((el) => {
        el.classList.toggle("is-active", el.id === "login");
      });
      document.body.dataset.screen = "login";
      showAuthMessage("Please sign in to continue.", "error");
      return;
    }

    if (session && (screenId === "student" || screenId === "lecturer") && session.user.role !== screenId) {
      showAuthMessage(`Signed in as ${session.user.role}. Redirecting…`, "error");
      location.hash = session.user.role;
      return;
    }

    if (document.body.dataset.screen === screenId) return;

    closeSidebar();
    document.querySelectorAll(".screen").forEach((el) => {
      el.classList.toggle("is-active", el.id === screenId);
    });
    document.body.dataset.screen = screenId;

    if (session && (screenId === "student" || screenId === "lecturer")) {
      applyUserToPortal(screenId, session.user);
      showPortalPage(screenId, "dashboard");
    }

    if (screenId === "student" || screenId === "lecturer" || screenId === "admin") {
      requestAnimationFrame(() => {
        initChartsOnce();
        resizeChartsForScreen(screenId);
      });
    }
  }

  function onRoute() {
    const hash = location.hash.replace("#", "") || "login";
    if (hash === "logout") {
      NSUAuth.logout();
      location.hash = "login";
      return;
    }
    showScreen(hash);
  }

  function resizeChartsForScreen(screenId) {
    const map = {
      student: ["spark-attendance", "spark-gpa", "chart-student-attendance"],
      lecturer: ["chart-lecturer-donut"],
      admin: ["chart-admin-trend"],
    };
    (map[screenId] || []).forEach((id) => {
      if (charts[id]) charts[id].resize();
    });
  }

  function initChartsOnce() {
    if (chartsReady) return;
    chartsReady = true;

    const sparkOpts = {
      responsive: false,
      animation: false,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: { x: { display: false }, y: { display: false } },
      elements: { point: { radius: 0 }, line: { tension: 0.4, borderWidth: 2 } },
    };

    function spark(id, color, data) {
      const el = document.getElementById(id);
      if (!el || charts[id]) return;
      charts[id] = new Chart(el, {
        type: "line",
        data: {
          labels: data.map((_, i) => i),
          datasets: [{ data, borderColor: color, backgroundColor: color + "22", fill: true }],
        },
        options: sparkOpts,
      });
    }

    spark("spark-attendance", "#0c4a6e", [88, 90, 89, 91, 92, 92]);
    spark("spark-gpa", "#3d6b35", [3.2, 3.3, 3.35, 3.4, 3.42, 3.45]);

    const lineOpts = {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2.5,
      animation: false,
      resizeDelay: 100,
      plugins: { legend: { display: false } },
    };

    const studentAtt = document.getElementById("chart-student-attendance");
    if (studentAtt && !charts["chart-student-attendance"]) {
      charts["chart-student-attendance"] = new Chart(studentAtt, {
        type: "line",
        data: {
          labels: months,
          datasets: [{
            data: [88, 90, 89, 91, 93, 92],
            borderColor: "#0c4a6e",
            backgroundColor: "rgba(12, 74, 110, 0.12)",
            fill: true,
            tension: 0.35,
          }],
        },
        options: {
          ...lineOpts,
          scales: { y: { min: 80, max: 100, ticks: { callback: (v) => v + "%" } } },
        },
      });
    }

    const donut = document.getElementById("chart-lecturer-donut");
    if (donut && !charts["chart-lecturer-donut"]) {
      charts["chart-lecturer-donut"] = new Chart(donut, {
        type: "doughnut",
        data: {
          labels: ["Present", "Absent", "Late"],
          datasets: [{ data: [86, 10, 4], backgroundColor: ["#3d6b35", "#9b2c2c", "#b8860b"], borderWidth: 0 }],
        },
        options: { responsive: true, maintainAspectRatio: true, aspectRatio: 1, animation: false, cutout: "70%", plugins: { legend: { display: false } } },
      });
    }

    const adminTrend = document.getElementById("chart-admin-trend");
    if (adminTrend && !charts["chart-admin-trend"]) {
      charts["chart-admin-trend"] = new Chart(adminTrend, {
        type: "line",
        data: {
          labels: months,
          datasets: [{
            data: [16.2, 15.8, 15.1, 14.9, 14.7, 14.6],
            borderColor: "#b8860b",
            backgroundColor: "rgba(184, 134, 11, 0.12)",
            fill: true,
            tension: 0.35,
          }],
        },
        options: {
          ...lineOpts,
          scales: { y: { min: 12, max: 18, ticks: { callback: (v) => v + "%" } } },
        },
      });
    }
  }

  document.querySelectorAll(".role-card").forEach((card) => {
    card.addEventListener("click", () => {
      document.querySelectorAll(".role-card").forEach((c) => c.classList.remove("role-card--active"));
      card.classList.add("role-card--active");
      updateRegisterIdLabel();
    });
  });

  document.querySelectorAll("[data-auth-tab]").forEach((btn) => {
    btn.addEventListener("click", () => setAuthTab(btn.dataset.authTab));
  });

  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(loginForm);
      const role = getSelectedRole();
      if (role === "admin") {
        location.hash = "admin";
        return;
      }
      const result = NSUAuth.login(fd.get("email"), fd.get("password"), role);
      if (!result.ok) {
        showAuthMessage(result.message, "error");
        return;
      }
      showAuthMessage("");
      location.hash = result.user.role;
    });
  }

  const registerForm = document.getElementById("register-form");
  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(registerForm);
      if (fd.get("password") !== fd.get("confirmPassword")) {
        showAuthMessage("Passwords do not match.", "error");
        return;
      }
      const role = getSelectedRole();
      const result = NSUAuth.register({
        role,
        fullName: fd.get("fullName"),
        email: fd.get("email"),
        password: fd.get("password"),
        idNumber: fd.get("idNumber"),
        department: fd.get("department"),
      });
      if (!result.ok) {
        showAuthMessage(result.message, "error");
        return;
      }
      showAuthMessage("Account created! You can sign in now.", "success");
      setAuthTab("login");
      loginForm.querySelector('[name="email"]').value = fd.get("email");
      registerForm.reset();
    });
  }

  document.querySelectorAll("[data-portal-nav] a[data-page]").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const nav = link.closest("[data-portal-nav]");
      const role = nav?.dataset.portalNav;
      if (role) showPortalPage(role, link.dataset.page);
    });
  });

  document.querySelectorAll(".sidebar__logout").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      NSUAuth.logout();
      closeSidebar();
      location.hash = "login";
    });
  });

  document.querySelectorAll("[data-goto-page]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const page = btn.dataset.gotoPage;
      const session = NSUAuth.getSession();
      if (session?.user?.role === "student") showPortalPage("student", page);
    });
  });

  const supportForm = document.getElementById("support-form");
  if (supportForm) {
    supportForm.addEventListener("submit", (e) => {
      e.preventDefault();
      alert("Support ticket submitted. We will reply to your registered email.");
      supportForm.reset();
    });
  }

  window.addEventListener("hashchange", onRoute);

  const session = NSUAuth.getSession();
  if (session && !location.hash) {
    location.hash = session.user.role;
  } else {
    onRoute();
  }

  document.querySelectorAll("[data-menu-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const sidebar = btn.closest(".screen")?.querySelector("[data-sidebar]");
      if (sidebar?.classList.contains("is-open")) closeSidebar();
      else openSidebar(sidebar);
    });
  });

  backdrop?.addEventListener("click", closeSidebar);

  document.querySelectorAll(".password-toggle").forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const wrap = toggle.closest(".password-wrap");
      const input = wrap?.querySelector("input");
      if (!input) return;
      const hidden = input.type === "password";
      input.type = hidden ? "text" : "password";
      toggle.textContent = hidden ? "Hide" : "Show";
    });
  });

  document.querySelector('[data-role="admin"]')?.addEventListener("click", () => {
    if (document.querySelector('[data-auth-panel="register"]')?.hidden === false) return;
  });

  const style = document.createElement("style");
  style.textContent = ".hidden{display:none!important}";
  document.head.appendChild(style);
})();
