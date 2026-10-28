import AuthAPI from './auth.js';

class ApiError extends Error {
    constructor(status, message, details = {}) {
        const fields = Object.entries(details ?? {}).map(([field, text]) => `${field}: ${text}`);
        super([message, ...fields].join("\n"));
        this.status = status;
    }

    static async from(response) {
        try {
            const body = await response.json();
            return new ApiError(response.status, body.error ?? `Ошибка ${response.status}`, body.details);
        } catch {
            return new ApiError(response.status, `Ошибка ${response.status}`);
        }
    }
}

export class UserAPI {
    static me() {
        return StudentAPI.request("GET", "/api/auth/me");
    }

    static URL = "/api/users";

    static list() {
        return StudentAPI.request("GET", this.URL);
    }

    static update(id, changes) {
        return StudentAPI.request("PATCH", `${this.URL}/${id}`, changes);
    }
}

export default class StudentAPI {
    static URL = "/api/requests";
    static MAX_GET_PARAMS = 5;

    static async request(method, url, body) {
        let response;
        try {
            response = await this.#fetch(method, url, body);
        } catch {
            throw new ApiError(0, "Сервер недоступен");
        }

        if (response.status === 401) {
            const reason = (await ApiError.from(response)).message;
            try {
                await AuthAPI.refresh();
            } catch (error) {
                if (error.status === 0 || error.status >= 500) {
                    throw new ApiError(error.status, "Сервер недоступен, попробуйте позже");
                }
                throw new ApiError(401, reason);
            }
            try {
                response = await this.#fetch(method, url, body);
            } catch {
                throw new ApiError(0, "Сервер недоступен");
            }
        }

        if (!response.ok) throw await ApiError.from(response);
        return response.status === 204 ? null : response.json();
    }

    static #fetch(method, url, body) {
        const options = {
            method,
            headers: {
                "Accept": "application/json",
                "Authorization": `Bearer ${AuthAPI.getAccessToken() ?? ""}`
            }
        };
        if (body !== undefined) {
            options.headers["Content-Type"] = "application/json";
            options.body = JSON.stringify(body);
        }
        return fetch(url, options);
    }

    static async list(filters = {}, page = 1) {
        const params = new URLSearchParams();
        for (const [key, values] of Object.entries(filters)) {
            values.forEach(value => params.append(key, value));
        }

        if ([...params].length > this.MAX_GET_PARAMS) {
            const body = { ...filters, page };
            return { method: "QUERY", url: this.URL, students: await this.request("QUERY", this.URL, body) };
        }
        if (page > 1) {
            params.append("page", page);
        }
        const url = params.size ? `${this.URL}?${params}` : this.URL;
        return { method: "GET", url: decodeURIComponent(url), students: await this.request("GET", url) };
    }

    static get(id) {
        return this.request("GET", `${this.URL}/${id}`);
    }

    static create(student) {
        return this.request("POST", this.URL, student);
    }

    static update(id, changes) {
        return this.request("PATCH", `${this.URL}/${id}`, changes);
    }

    static remove(id) {
        return this.request("DELETE", `${this.URL}/${id}`);
    }
}
