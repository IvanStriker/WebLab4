import StudentAPI, { UserAPI } from './api.js';
import AuthAPI from './auth.js';

document.addEventListener('DOMContentLoaded', function () {
    const addForm = document.getElementById("add-student-form");
    const addFormAppearBtn = document.getElementById("toggle-add-student");
    const filterForm = document.getElementById("filter-form");
    const filterFormAppearBtn = document.getElementById("toggle-filter");

    const tbody = document.querySelector("table tbody");
    const rowTemplate = document.getElementById("student-row");
    const columns = Array.from(document.querySelectorAll(".table-header-row th[data-key]"));
    const studentsCount = document.getElementById("students-count");
    const lastRequest = document.getElementById("last-request");
    const fullInfoBtn = document.querySelector(".full-info-btn");
    const notice = document.getElementById("notice");

    const infoModal = document.getElementById("info-modal");
    const modalInfoList = document.getElementById("modal-info-list");
    const modalEditBtn = document.getElementById("modal-edit-btn");
    const modalSaveBtn = document.getElementById("modal-save-btn");
    const modalExportBtn = document.getElementById("modal-export-btn");

    const loginScreen = document.getElementById("login-screen");
    const loginForm = document.getElementById("login-form");
    const loginError = document.getElementById("login-error");
    const userInfo = document.getElementById("user-info");
    const currentUserEl = document.getElementById("current-user");
    const logoutBtn = document.getElementById("logout-btn");

    const pagination = document.getElementById("pagination");
    const prevPageBtn = document.getElementById("prev-page");
    const nextPageBtn = document.getElementById("next-page");
    const pageInfo = document.getElementById("page-info");

    const usersBtn = document.getElementById("users-btn");
    const usersModal = document.getElementById("users-modal");
    const usersTbody = document.getElementById("users-tbody");
    const usersError = document.getElementById("users-error");
    const userRowTemplate = document.getElementById("user-row");

    let filters = {};
    let page = 1;
    let students = new Map();
    let modalStudent = null;
    let noticeTimer = null;
    let users = new Map();

    function showLogin(message = "") {
        closeInfoModal();
        closeUsersModal();
        tbody.replaceChildren();
        students.clear();
        studentsCount.textContent = "0";
        lastRequest.textContent = "";
        pagination.classList.add("hidden");
        loginForm.reset();
        loginError.textContent = message;
        loginError.classList.toggle("hidden", !message);
        loginScreen.classList.remove("hidden");
        userInfo.classList.add("hidden");
        document.body.classList.remove("role-user");
    }

    function showApp(role) {
        loginScreen.classList.add("hidden");
        userInfo.classList.remove("hidden");
        currentUserEl.textContent = role === "ADMIN" ? "Администратор" : "Пользователь";
        document.body.classList.toggle("role-user", role !== "ADMIN");
    }

    function handleError(error) {
        if (error.status === 401) {
            AuthAPI.clearTokens();
            showLogin(error.message);
        } else {
            showNotice(error.message, true);
        }
    }

    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        loginError.classList.add("hidden");
        try {
            await AuthAPI.login(
                loginForm.elements.username.value,
                loginForm.elements.password.value
            );
            loginForm.reset();
            page = 1;
            showApp(AuthAPI.getRole());
            loadStudents();
        } catch (error) {
            loginError.textContent = error.message;
            loginError.classList.remove("hidden");
        }
    });

    logoutBtn.addEventListener("click", async function () {
        await AuthAPI.logout();
        showLogin();
    });

    function setAddFormVisible(visible) {
        addForm.classList.toggle("hidden", !visible);
        addFormAppearBtn.textContent = visible ? "Скрыть форму" : "Добавить студента";
    }

    function setFilterFormVisible(visible) {
        filterForm.classList.toggle("hidden", !visible);
        filterFormAppearBtn.textContent = visible ? "Скрыть фильтры" : "Фильтры";
    }

    function showNotice(text, isError = false) {
        clearTimeout(noticeTimer);
        notice.textContent = text;
        notice.classList.toggle("error", isError);
        notice.classList.remove("hidden");
        noticeTimer = setTimeout(function () {
            notice.classList.add("hidden");
        }, isError ? 8000 : 4000);
    }

    function extraColsVisible() {
        return !document.querySelector(".table-header-row .extra-col").classList.contains("hidden");
    }

    function formatValue(key, value) {
        if (value === null || value === undefined) {
            return "";
        }
        if (key === "moveinDate") {
            return value.split("-").reverse().join(".");
        }
        return String(value);
    }

    function readValue(input) {
        const value = input.value.trim();
        if (value === "") {
            return null;
        }
        return input.type === "number" ? Number(value) : value;
    }

    function createInput(key, value) {
        const input = addForm.elements.namedItem(key).cloneNode(true);
        input.removeAttribute("id");
        input.removeAttribute("placeholder");
        input.value = value ?? "";
        return input;
    }

    function collectChanges(inputs, student) {
        const changes = {};
        for (const input of inputs) {
            if (!input.reportValidity()) {
                return null;
            }
            const value = readValue(input);
            if (value !== student[input.name]) {
                changes[input.name] = value;
            }
        }
        return changes;
    }

    function fillRow(row, student) {
        const showExtra = extraColsVisible();
        row.querySelectorAll("td[data-key]").forEach(function (td) {
            td.textContent = formatValue(td.dataset.key, student[td.dataset.key]);
            if (td.classList.contains("extra-col")) {
                td.classList.toggle("hidden", !showExtra);
            }
        });
        row.querySelector(".edit-btn").classList.remove("hidden");
        row.querySelector(".save-btn").classList.add("hidden");
    }

    function renderTable(list) {
        students = new Map(list.map(student => [student.id, student]));

        if (!list.length) {
            const row = document.createElement("tr");
            row.innerHTML = '<td colspan="9" class="empty-row">Студенты не найдены</td>';
            tbody.replaceChildren(row);
            return;
        }

        tbody.replaceChildren(...list.map(function (student) {
            const row = rowTemplate.content.firstElementChild.cloneNode(true);
            row.dataset.id = student.id;
            fillRow(row, student);
            return row;
        }));
    }

    async function loadStudents() {
        try {
            const result = await StudentAPI.list(filters, page);
            const data = result.students;
            if (page > 1 && page > data.totalPages) {
                page = Math.max(1, data.totalPages);
                return loadStudents();
            }
            lastRequest.textContent = `${result.method} ${result.url}`
                + (result.method === "QUERY" ? " " + JSON.stringify({ ...filters, page }) : "");
            renderTable(data.items);
            studentsCount.textContent = data.totalItems;
            pagination.classList.toggle("hidden", data.totalPages <= 1);
            pageInfo.textContent = `Страница ${data.page} из ${data.totalPages}`;
            prevPageBtn.disabled = data.page <= 1;
            nextPageBtn.disabled = data.page >= data.totalPages;
        } catch (error) {
            handleError(error);
        }
    }

    addFormAppearBtn.addEventListener("click", function () {
        setAddFormVisible(addForm.classList.contains("hidden"));
    });

    filterFormAppearBtn.addEventListener("click", function () {
        setFilterFormVisible(filterForm.classList.contains("hidden"));
    });

    notice.addEventListener("click", function () {
        notice.classList.add("hidden");
    });

    addForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        const student = {};
        for (const input of addForm.querySelectorAll("[name]")) {
            const value = readValue(input);
            if (value !== null) {
                student[input.name] = value;
            }
        }

        try {
            await StudentAPI.create(student);
        } catch (error) {
            handleError(error);
            return;
        }

        addForm.reset();
        setAddFormVisible(false);
        showNotice(`Студент ${student.name} добавлен`);
        loadStudents();
    });

    filterForm.addEventListener("submit", function (event) {
        event.preventDefault();
        filters = {};
        page = 1;
        for (const [key, value] of new FormData(filterForm)) {
            value.split(",").map(part => part.trim()).filter(Boolean).forEach(function (part) {
                (filters[key] ??= []).push(part);
            });
        }
        loadStudents();
    });

    filterForm.addEventListener("reset", function () {
        filters = {};
        page = 1;
        loadStudents();
    });

    prevPageBtn.addEventListener("click", function () {
        page -= 1;
        loadStudents();
    });

    nextPageBtn.addEventListener("click", function () {
        page += 1;
        loadStudents();
    });

    fullInfoBtn.addEventListener("click", function () {
        const visible = extraColsVisible();
        document.querySelectorAll(".extra-col").forEach(function (el) {
            el.classList.toggle("hidden", visible);
        });
        fullInfoBtn.textContent = visible
            ? "Посмотреть подробную информацию"
            : "Скрыть подробную информацию";
    });

    function startRowEdit(row) {
        const student = students.get(Number(row.dataset.id));
        row.querySelectorAll("td[data-key]").forEach(function (td) {
            if (td.dataset.key !== "id") {
                td.replaceChildren(createInput(td.dataset.key, student[td.dataset.key]));
            }
        });
        row.querySelector(".edit-btn").classList.add("hidden");
        row.querySelector(".save-btn").classList.remove("hidden");
    }

    async function saveRow(row) {
        const id = Number(row.dataset.id);
        const changes = collectChanges(row.querySelectorAll("td [name]"), students.get(id));
        if (changes === null) {
            return;
        }
        if (!Object.keys(changes).length) {
            fillRow(row, students.get(id));
            return;
        }

        try {
            await StudentAPI.update(id, changes);
        } catch (error) {
            handleError(error);
            return;
        }
        showNotice(`Данные студента ${id} обновлены`);
        loadStudents();
    }

    async function deleteRow(row) {
        const id = Number(row.dataset.id);
        try {
            await StudentAPI.remove(id);
        } catch (error) {
            handleError(error);
            return;
        }
        showNotice(`Студент ${id} удалён`);
        loadStudents();
    }

    tbody.addEventListener("click", function (event) {
        const btn = event.target.closest("button");
        if (!btn) return;
        const row = btn.closest("tr");

        if (btn.classList.contains("edit-btn")) {
            startRowEdit(row);
        }

        if (btn.classList.contains("save-btn")) {
            saveRow(row);
        }

        if (btn.classList.contains("info-btn")) {
            openInfoModal(Number(row.dataset.id));
        }

        if (btn.classList.contains("del-btn")) {
            if (!btn.classList.contains("confirm")) {
                btn.textContent = "Точно удалить?";
                btn.classList.add("confirm");
            } else {
                deleteRow(row);
            }
        }
    });

    tbody.addEventListener("keydown", function (event) {
        const row = event.target.closest("tr");
        if (!row || !event.target.name) return;

        if (event.key === "Enter") {
            saveRow(row);
        }
        if (event.key === "Escape") {
            fillRow(row, students.get(Number(row.dataset.id)));
        }
    });

    document.addEventListener("click", function (event) {
        document.querySelectorAll("tbody .del-btn.confirm").forEach(function (btn) {
            if (btn !== event.target) {
                btn.textContent = "Удалить";
                btn.classList.remove("confirm");
            }
        });
    });

    function fillModal(student, editing) {
        modalStudent = student;
        modalInfoList.replaceChildren(...columns.map(function (th) {
            const key = th.dataset.key;
            const li = document.createElement("li");
            const title = document.createElement("strong");
            title.textContent = th.textContent.trim() + ":";
            li.append(title);

            if (editing && key !== "id") {
                const input = createInput(key, student[key]);
                input.classList.add("modal-value-input");
                li.append(input);
            } else {
                const value = document.createElement("span");
                value.className = "modal-value";
                value.textContent = formatValue(key, student[key]);
                li.append(value);
            }
            return li;
        }));

        modalEditBtn.classList.toggle("hidden", editing);
        modalSaveBtn.classList.toggle("hidden", !editing);
    }

    async function openInfoModal(id) {
        try {
            fillModal(await StudentAPI.get(id), false);
        } catch (error) {
            handleError(error);
            return;
        }
        infoModal.classList.remove("hidden");
    }

    function closeInfoModal() {
        infoModal.classList.add("hidden");
        modalStudent = null;
    }

    infoModal.addEventListener("click", function (event) {
        if (event.target === infoModal) {
            closeInfoModal();
        }
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && !infoModal.classList.contains("hidden")) {
            closeInfoModal();
        }
    });

    modalEditBtn.addEventListener("click", function () {
        fillModal(modalStudent, true);
    });

    modalInfoList.addEventListener("keydown", function (event) {
        if (event.key === "Enter" && !event.repeat) {
            modalSaveBtn.click();
        }
    });

    modalSaveBtn.addEventListener("click", async function () {
        const changes = collectChanges(modalInfoList.querySelectorAll("[name]"), modalStudent);
        if (changes === null) {
            return;
        }

        if (Object.keys(changes).length) {
            try {
                modalStudent = await StudentAPI.update(modalStudent.id, changes);
            } catch (error) {
                handleError(error);
                return;
            }
            showNotice(`Данные студента ${modalStudent.id} обновлены`);
            loadStudents();
        }
        fillModal(modalStudent, false);
    });

    modalExportBtn.addEventListener("click", function () {
        const blob = new Blob([JSON.stringify(modalStudent, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `student_${modalStudent.id}.json`;
        link.click();
        URL.revokeObjectURL(url);
    });

    function showUsersError(text) {
        usersError.textContent = text;
        usersError.classList.toggle("hidden", !text);
    }

    function createUserInput(key, value) {
        if (key === "role") {
            const select = document.createElement("select");
            select.name = "role";
            for (const role of ["ADMIN", "USER"]) {
                select.add(new Option(role, role, false, role === value));
            }
            return select;
        }
        const input = document.createElement("input");
        input.name = key;
        if (key === "username") {
            input.required = true;
            input.pattern = "[A-Za-z0-9_]{3,32}";
            input.title = "От 3 до 32 символов: латинские буквы, цифры и _";
        }
        if (key === "email") {
            input.type = "email";
            input.required = true;
            input.maxLength = 255;
            input.pattern = "[A-Za-z0-9._%+\\-]+@[A-Za-z0-9\\-]+(\\.[A-Za-z0-9\\-]+)*\\.[A-Za-z]{2,}";
            input.title = "Адрес почты, например name@mail.ru";
        }
        if (key === "password") {
            input.type = "password";
            input.minLength = 8;
            input.title = "Не короче 8 символов и не длиннее 72 байт";
            input.placeholder = "не менять";
            input.autocomplete = "new-password";
        }
        input.value = value ?? "";
        return input;
    }

    function fillUserRow(row, user) {
        row.querySelectorAll("td[data-key]").forEach(function (td) {
            td.textContent = td.dataset.key === "password" ? "" : String(user[td.dataset.key]);
        });
        row.querySelector(".edit-btn").classList.remove("hidden");
        row.querySelector(".save-btn").classList.add("hidden");
    }

    async function loadUsers() {
        try {
            const list = await UserAPI.list();
            users = new Map(list.map(user => [user.id, user]));
            usersTbody.replaceChildren(...list.map(function (user) {
                const row = userRowTemplate.content.firstElementChild.cloneNode(true);
                row.dataset.id = user.id;
                fillUserRow(row, user);
                return row;
            }));
        } catch (error) {
            closeUsersModal();
            handleError(error);
        }
    }

    function startUserEdit(row) {
        const user = users.get(Number(row.dataset.id));
        row.querySelectorAll("td[data-key]").forEach(function (td) {
            const key = td.dataset.key;
            if (key !== "id") {
                td.replaceChildren(createUserInput(key, key === "password" ? "" : user[key]));
            }
        });
        row.querySelector(".edit-btn").classList.add("hidden");
        row.querySelector(".save-btn").classList.remove("hidden");
    }

    async function saveUserRow(row) {
        const id = Number(row.dataset.id);
        const user = users.get(id);
        const changes = {};
        for (const input of row.querySelectorAll("td [name]")) {
            if (!input.reportValidity()) {
                return;
            }
            if (input.name === "password") {
                if (input.value) {
                    changes.password = input.value;
                }
            } else if (input.value.trim() !== user[input.name]) {
                changes[input.name] = input.value.trim();
            }
        }
        if (!Object.keys(changes).length) {
            fillUserRow(row, user);
            return;
        }

        try {
            await UserAPI.update(id, changes);
        } catch (error) {
            if (error.status === 401) {
                closeUsersModal();
                handleError(error);
            } else {
                showUsersError(error.message);
            }
            return;
        }

        if (user.username === AuthAPI.getUsername() && (changes.username || changes.password)) {
            closeUsersModal();
            await AuthAPI.logout();
            showLogin();
            showNotice("Данные вашей учетной записи изменены, войдите снова");
            return;
        }
        showUsersError("");
        showNotice(`Учетная запись ${changes.username ?? user.username} обновлена`);
        loadUsers();
    }

    function openUsersModal() {
        showUsersError("");
        usersModal.classList.remove("hidden");
        loadUsers();
    }

    function closeUsersModal() {
        usersModal.classList.add("hidden");
    }

    usersBtn.addEventListener("click", openUsersModal);

    usersModal.addEventListener("click", function (event) {
        if (event.target === usersModal) {
            closeUsersModal();
        }
    });

    usersTbody.addEventListener("click", function (event) {
        const btn = event.target.closest("button");
        if (!btn) return;
        const row = btn.closest("tr");
        if (btn.classList.contains("edit-btn")) {
            startUserEdit(row);
        }
        if (btn.classList.contains("save-btn")) {
            saveUserRow(row);
        }
    });

    usersTbody.addEventListener("keydown", function (event) {
        const row = event.target.closest("tr");
        if (!row || !event.target.name) return;
        if (event.key === "Enter") {
            saveUserRow(row);
        }
        if (event.key === "Escape") {
            event.stopPropagation();
            fillUserRow(row, users.get(Number(row.dataset.id)));
        }
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && !usersModal.classList.contains("hidden")) {
            closeUsersModal();
        }
    });

    async function restoreSession() {
        try {
            const me = await UserAPI.me();
            showApp(me.role);
            loadStudents();
        } catch (error) {
            handleError(error);
        }
    }

    if (AuthAPI.isLoggedIn()) {
        showApp(AuthAPI.getRole());
        restoreSession();
    } else {
        showLogin();
    }
});
