export default class AuthAPI {
    static #ACCESS_KEY = "students_access";
    static #REFRESH_KEY = "students_refresh";

    static getAccessToken() { return localStorage.getItem(this.#ACCESS_KEY); }
    static getRefreshToken() { return localStorage.getItem(this.#REFRESH_KEY); }

    static setTokens(accessToken, refreshToken) {
        localStorage.setItem(this.#ACCESS_KEY, accessToken);
        localStorage.setItem(this.#REFRESH_KEY, refreshToken);
    }

    static clearTokens() {
        localStorage.removeItem(this.#ACCESS_KEY);
        localStorage.removeItem(this.#REFRESH_KEY);
    }

    static isLoggedIn() { return !!this.getAccessToken(); }

    static getRole() {
        return this.#claim("role");
    }

    static getUsername() {
        return this.#claim("sub");
    }

    static #claim(name) {
        const token = this.getAccessToken();
        if (!token) return null;
        try {
            return JSON.parse(atob(token.split(".")[1]))[name] ?? null;
        } catch {
            return null;
        }
    }

    static async login(username, password) {
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "Ошибка входа");
        this.setTokens(body.accessToken, body.refreshToken);
    }

    static async logout() {
        const refreshToken = this.getRefreshToken();
        this.clearTokens();
        if (refreshToken) {
            await fetch("/api/auth/logout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken })
            }).catch(() => {});
        }
    }

    static #refreshing = null;

    static refresh() {
        this.#refreshing ??= this.#doRefresh().finally(() => {
            this.#refreshing = null;
        });
        return this.#refreshing;
    }

    static async #doRefresh() {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) throw Object.assign(new Error("Нет refresh-токена"), { status: 401 });
        let response;
        try {
            response = await fetch("/api/auth/refresh", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken })
            });
        } catch {
            throw Object.assign(new Error("Сервер недоступен"), { status: 0 });
        }
        if (!response.ok) {
            if (response.status === 400 || response.status === 401) {
                this.clearTokens();
            }
            throw Object.assign(new Error("Сессия истекла"), { status: response.status });
        }
        const body = await response.json();
        this.setTokens(body.accessToken, body.refreshToken);
    }
}
