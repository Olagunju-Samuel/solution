(function (global) {
  const STORAGE_KEY = "nsu_retention_users";
  const SESSION_KEY = "nsu_retention_session";

  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function saveUsers(users) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }

  function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  function initials(name) {
    return String(name || "?")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("");
  }

  function register({ role, fullName, email, password, idNumber, department }) {
    if (role !== "student" && role !== "lecturer") {
      return { ok: false, message: "Only students and lecturers can self-register." };
    }
    const em = normalizeEmail(email);
    if (!fullName?.trim()) return { ok: false, message: "Please enter your full name." };
    if (!em) return { ok: false, message: "Please enter your email." };
    if (!password || password.length < 6) {
      return { ok: false, message: "Password must be at least 6 characters." };
    }
    if (!idNumber?.trim()) {
      return { ok: false, message: role === "student" ? "Please enter your student ID." : "Please enter your staff ID." };
    }

    const users = getUsers();
    if (users.some((u) => u.email === em)) {
      return { ok: false, message: "An account with this email already exists." };
    }

    const user = {
      id: "u_" + Date.now(),
      role,
      fullName: fullName.trim(),
      email: em,
      password,
      idNumber: idNumber.trim(),
      department: (department || "").trim(),
      createdAt: new Date().toISOString(),
      stats: role === "student"
        ? { attendance: 92, gpa: 3.45, courses: 5, alerts: 2, risk: "low" }
        : { classes: 4, students: 128, atRisk: 18, attendanceAvg: 86 },
    };

    users.push(user);
    saveUsers(users);
    return { ok: true, user };
  }

  function login(email, password, expectedRole) {
    const em = normalizeEmail(email);
    const user = getUsers().find((u) => u.email === em && u.password === password);
    if (!user) return { ok: false, message: "Invalid email or password." };
    if (expectedRole && user.role !== expectedRole) {
      return { ok: false, message: `This account is registered as a ${user.role}, not ${expectedRole}.` };
    }
    const session = { userId: user.id, role: user.role, loggedInAt: Date.now() };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { ok: true, user };
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  function getSession() {
    try {
      const s = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
      if (!s?.userId) return null;
      const user = getUsers().find((u) => u.id === s.userId);
      if (!user) {
        logout();
        return null;
      }
      return { ...s, user };
    } catch {
      return null;
    }
  }

  function seedDemoAccounts() {
    const users = getUsers();
    if (users.length > 0) return;
    saveUsers([
      {
        id: "demo_student",
        role: "student",
        fullName: "John David",
        email: "student@nsu.edu.ng",
        password: "student1",
        idNumber: "NSU/2021/1042",
        department: "Computer Science",
        createdAt: new Date().toISOString(),
        stats: { attendance: 92, gpa: 3.45, courses: 5, alerts: 2, risk: "low" },
      },
      {
        id: "demo_lecturer",
        role: "lecturer",
        fullName: "Dr. Adebayo Okafor",
        email: "lecturer@nsu.edu.ng",
        password: "lecturer1",
        idNumber: "NSU/STF/2041",
        department: "Faculty of Science",
        createdAt: new Date().toISOString(),
        stats: { classes: 4, students: 128, atRisk: 18, attendanceAvg: 86 },
      },
    ]);
  }

  global.NSUAuth = {
    register,
    login,
    logout,
    getSession,
    getUsers,
    initials,
    seedDemoAccounts,
  };
})(window);
