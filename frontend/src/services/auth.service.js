import api from './api';

/** Auth responses are `{ message, user }` (not wrapped in `data`). */
const toUser = (res) => res.data.user;

export const authService = {
  /**
   * The backend matches `$or: [{ username }, { email }]`, so sending the same
   * identifier for both lets users sign in with either.
   */
  login: ({ identifier, password }) =>
    api.post('/auth/login', { username: identifier, email: identifier, password }).then(toUser),

  /** Registers a regular user; the backend sets the session cookie on success. */
  register: ({ firstName, lastName, username, email, password }) =>
    api.post('/auth/register', { firstName, lastName, username, email, password }).then(toUser),

  logout: () => api.post('/auth/logout'),
};
